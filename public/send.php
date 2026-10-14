<?php
/**
 * Обработчик заявок с форм сайта gkmetallinvest.ru.
 * Работает на Timeweb (Apache + PHP). Принимает POST (multipart) от LeadForm,
 * отправляет письмо на общую почту компании (та же, что в шапке сайта)
 * и при необходимости прикладывает файл клиента. Возвращает JSON.
 *
 * Отправка: через SMTP ящика zakaz@gkmetallinvest.ru (mail.ru) с авторизацией —
 * SPF домена разрешает рассылку только через mail.ru, поэтому обычный mail() с
 * хостинга попадает в спам или отбрасывается. Логин и пароль SMTP лежат на
 * сервере в файле send-config.php рядом с этим скриптом (в репозитории его нет,
 * образец — docs/send-config.example.php). Без этого файла работает запасной mail().
 *
 * Roistat: номер визита (cookie roistat_visit) добавляется в письмо, а при
 * наличии roistat_webhook в конфиге заявка уходит в Roistat Webhook-интеграцией.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

// Фатальный сбой отдаём как JSON, а не пустой 500 — чтобы фронт показал ошибку.
// Текст ошибки наружу не выводим.
register_shutdown_function(static function () {
	$e = error_get_last();
	if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
		echo json_encode(['ok' => false, 'error' => 'server']);
	}
});

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
	http_response_code(405);
	echo json_encode(['ok' => false, 'error' => 'method']);
	exit;
}

// Ханипот: скрытое поле, которое заполняют только боты — тихо принимаем «ок».
if (!empty($_POST['company_site'])) {
	echo json_encode(['ok' => true]);
	exit;
}

// Согласие на обработку персональных данных обязательно (152-ФЗ).
if (empty($_POST['consent_pd'])) {
	http_response_code(422);
	echo json_encode(['ok' => false, 'error' => 'consent']);
	exit;
}

$clean = static function (string $key, int $max): string {
	$v = isset($_POST[$key]) && is_string($_POST[$key]) ? trim($_POST[$key]) : '';
	$len = function_exists('mb_strlen') ? mb_strlen($v) : strlen($v);
	if ($len > $max) {
		$v = function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
	}
	// Срезаем управляющие символы (защита от инъекции в заголовки/тело).
	$out = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
	return $out ?? $v;
};

$name    = $clean('name', 150);
$phone   = $clean('phone', 50);
$email   = $clean('email', 150);
$message = $clean('message', 4000);
$city    = $clean('city', 100);
$page    = $clean('page', 300);
$marketing = !empty($_POST['consent_marketing']) ? 'да' : 'нет';

if ($name === '' || $phone === '') {
	http_response_code(422);
	echo json_encode(['ok' => false, 'error' => 'required']);
	exit;
}

// ---- Серверные настройки (SMTP, Roistat). Файла может не быть — тогда запасной режим. ----
$cfg = [];
$cfgFile = __DIR__ . '/send-config.php';
if (is_file($cfgFile)) {
	$loaded = @include $cfgFile;
	if (is_array($loaded)) {
		$cfg = $loaded;
	}
}

// Номер визита Roistat кладёт счётчик в cookie roistat_visit; cookie приходит от клиента — валидируем.
$roistatVisit = isset($_COOKIE['roistat_visit']) && is_string($_COOKIE['roistat_visit'])
	&& preg_match('/^[A-Za-z0-9_-]{1,64}$/', $_COOKIE['roistat_visit'])
	? $_COOKIE['roistat_visit']
	: '';

// ---- Вложение (необязательно): один файл до 5 МБ, только безопасные форматы. ----
const ATTACH_MAX_BYTES = 5 * 1024 * 1024;
$attachment = null; // ['name' => ..., 'type' => ..., 'data' => ..., 'size' => ...]

$fail = static function (string $code, int $status = 422): void {
	http_response_code($status);
	echo json_encode(['ok' => false, 'error' => $code]);
	exit;
};

// ---- Капча Yandex SmartCaptcha: включается, когда в send-config.php есть captcha_secret. ----
if (!empty($cfg['captcha_secret']) && is_string($cfg['captcha_secret'])) {
	$captchaToken = isset($_POST['smart-token']) && is_string($_POST['smart-token']) ? trim($_POST['smart-token']) : '';
	if ($captchaToken === '' || strlen($captchaToken) > 4096) {
		$fail('captcha');
	}
	if (!lead_captcha_ok($cfg['captcha_secret'], $captchaToken, (string) ($_SERVER['REMOTE_ADDR'] ?? ''))) {
		$fail('captcha');
	}
}

if (isset($_FILES['attachment']) && is_array($_FILES['attachment'])) {
	$f = $_FILES['attachment'];
	$err = (int) ($f['error'] ?? UPLOAD_ERR_NO_FILE);

	if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
		$fail('file_size');
	}
	if ($err !== UPLOAD_ERR_NO_FILE) {
		if ($err !== UPLOAD_ERR_OK || !is_uploaded_file((string) ($f['tmp_name'] ?? ''))) {
			$fail('file');
		}
		$size = (int) ($f['size'] ?? 0);
		if ($size <= 0) {
			$fail('file');
		}
		if ($size > ATTACH_MAX_BYTES) {
			$fail('file_size');
		}

		// Имя файла: оставляем только базовое имя, без путей и управляющих символов.
		// basename() и pathinfo() зависят от локали и портят кириллицу — режем вручную.
		$nameParts = preg_split('#[\\\\/]#', (string) ($f['name'] ?? 'file')) ?: ['file'];
		$origName = (string) end($nameParts);
		// Имя не в UTF-8 (старые клиенты) — приводим, иначе regex с /u вернёт null.
		if (!preg_match('//u', $origName)) {
			$origName = function_exists('mb_convert_encoding')
				? (string) @mb_convert_encoding($origName, 'UTF-8', 'Windows-1251')
				: (string) preg_replace('/[^\x20-\x7E]+/', '_', $origName);
			if (!preg_match('//u', $origName)) {
				$origName = (string) preg_replace('/[^\x20-\x7E]+/', '_', $origName);
			}
		}
		$origName = preg_replace('/[\x00-\x1F\x7F"\\\\\/:*?<>|]+/u', '_', $origName) ?? 'file';
		$origName = trim($origName, ". \t");
		if ($origName === '') {
			$origName = 'file';
		}
		if (function_exists('mb_substr')) {
			$origName = mb_substr($origName, 0, 120);
		} else {
			$origName = substr($origName, 0, 120);
		}

		$dot = strrpos($origName, '.');
		$ext = $dot === false ? '' : strtolower(substr($origName, $dot + 1));
		// Расширение → MIME для письма и проверка сигнатуры файла.
		$allowed = [
			'pdf'  => 'application/pdf',
			'txt'  => 'text/plain',
			'csv'  => 'text/csv',
			'doc'  => 'application/msword',
			'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'xls'  => 'application/vnd.ms-excel',
			'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'jpg'  => 'image/jpeg',
			'jpeg' => 'image/jpeg',
			'png'  => 'image/png',
		];
		if (!isset($allowed[$ext])) {
			$fail('file_type');
		}

		$data = @file_get_contents((string) $f['tmp_name']);
		if ($data === false || $data === '') {
			$fail('file');
		}
		$head = substr($data, 0, 8);
		$okSig = true;
		switch ($ext) {
			case 'pdf':
				$okSig = strncmp($data, '%PDF', 4) === 0 || strpos(substr($data, 0, 1024), '%PDF') !== false;
				break;
			case 'docx':
			case 'xlsx':
				$okSig = strncmp($head, "PK\x03\x04", 4) === 0;
				break;
			case 'doc':
			case 'xls':
				$okSig = strncmp($head, "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1", 8) === 0;
				break;
			case 'jpg':
			case 'jpeg':
				$okSig = strncmp($head, "\xFF\xD8\xFF", 3) === 0;
				break;
			case 'png':
				$okSig = strncmp($head, "\x89PNG\r\n\x1A\n", 8) === 0;
				break;
			case 'txt':
			case 'csv':
				$okSig = strpos(substr($data, 0, 4096), "\0") === false; // текст без бинарных байтов
				break;
		}
		if (!$okSig) {
			$fail('file_type');
		}

		$attachment = [
			'name' => $origName,
			'type' => $allowed[$ext],
			'data' => $data,
			'size' => strlen($data),
		];
	}
}

// В Reply-To кладём email клиента только если он валиден (защита от инъекции).
$replyTo = filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';

// Та же почта, что в шапке сайта (contacts.email в src/data/site.ts).
$recipients = (isset($cfg['to']) && is_string($cfg['to']) && $cfg['to'] !== '') ? $cfg['to'] : 'zakaz@gkmetallinvest.ru';

$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта — ' . $name) . '?=';

$fmtSize = static function (int $b): string {
	return $b >= 1048576 ? round($b / 1048576, 1) . ' МБ' : max(1, (int) round($b / 1024)) . ' КБ';
};

$bodyLines = [
	'Новая заявка с сайта gkmetallinvest.ru',
	str_repeat('-', 40),
	'Имя:      ' . $name,
	'Телефон:  ' . $phone,
	'Email:    ' . ($email !== '' ? $email : '—'),
	'Город:    ' . ($city !== '' ? $city : '—'),
	'',
	'Сообщение:',
	$message !== '' ? $message : '—',
	'',
	'Вложение: ' . ($attachment ? $attachment['name'] . ' (' . $fmtSize($attachment['size']) . ')' : 'нет'),
	'',
	str_repeat('-', 40),
	'Согласие на рекламу: ' . $marketing,
	'Страница:            ' . ($page !== '' ? $page : '—'),
	'Визит Roistat:       ' . ($roistatVisit !== '' ? $roistatVisit : 'nocookie'),
	'Дата/время:          ' . date('Y-m-d H:i:s'),
	'IP:                  ' . ($_SERVER['REMOTE_ADDR'] ?? '—'),
];
$text = implode("\r\n", $bodyLines);

$fromEmail = 'zakaz@gkmetallinvest.ru';
$fromName  = '=?UTF-8?B?' . base64_encode('Сайт ГК Металлинвест') . '?=';

$headers  = 'From: ' . $fromName . ' <' . $fromEmail . '>' . "\r\n";
if ($replyTo !== '') {
	$headers .= 'Reply-To: ' . $replyTo . "\r\n";
}
$headers .= 'Message-ID: <' . bin2hex(random_bytes(8)) . '@gkmetallinvest.ru>' . "\r\n";
$headers .= 'MIME-Version: 1.0' . "\r\n";

if ($attachment) {
	// multipart/mixed: текст + вложение в base64.
	$boundary = 'lead_' . bin2hex(random_bytes(12));
	$headers .= 'Content-Type: multipart/mixed; boundary="' . $boundary . '"' . "\r\n";

	$encName = '=?UTF-8?B?' . base64_encode($attachment['name']) . '?=';
	$body  = '--' . $boundary . "\r\n";
	$body .= 'Content-Type: text/plain; charset=UTF-8' . "\r\n";
	$body .= 'Content-Transfer-Encoding: base64' . "\r\n\r\n";
	$body .= chunk_split(base64_encode($text), 76, "\r\n");
	$body .= '--' . $boundary . "\r\n";
	$body .= 'Content-Type: ' . $attachment['type'] . '; name="' . $encName . '"' . "\r\n";
	$body .= 'Content-Transfer-Encoding: base64' . "\r\n";
	$body .= 'Content-Disposition: attachment; filename="' . $encName . '"; filename*=UTF-8\'\'' . rawurlencode($attachment['name']) . "\r\n\r\n";
	$body .= chunk_split(base64_encode($attachment['data']), 76, "\r\n");
	$body .= '--' . $boundary . '--' . "\r\n";
} else {
	$headers .= 'Content-Type: text/plain; charset=UTF-8' . "\r\n";
	$headers .= 'Content-Transfer-Encoding: 8bit' . "\r\n";
	$body = $text;
}

$smtpUser = isset($cfg['smtp_user']) && is_string($cfg['smtp_user']) ? $cfg['smtp_user'] : '';
$useSmtp = $smtpUser !== '' && !empty($cfg['smtp_pass']) && !empty($cfg['smtp_host']);

if ($useSmtp) {
	// По SMTP отправитель обязан совпадать с логином ящика.
	$smtpFrom = $smtpUser;
	$smtpHeaders = 'Date: ' . date('r') . "\r\n"
		. 'To: ' . $recipients . "\r\n"
		. 'Subject: ' . $subject . "\r\n"
		. str_replace('<' . $fromEmail . '>', '<' . $smtpFrom . '>', $headers);
	$sent = lead_smtp_send($cfg, $smtpFrom, $recipients, $smtpHeaders . "\r\n" . $body);
} else {
	// Запасной путь: на некоторых хостингах mail() отключён — тогда нужен SMTP.
	if (!function_exists('mail')) {
		http_response_code(502);
		echo json_encode(['ok' => false, 'error' => 'mail_disabled']);
		exit;
	}
	$sent = @mail($recipients, $subject, $body, $headers, '-f' . $fromEmail);
}

// Roistat: заявка с номером визита (необязательно, ошибки не влияют на ответ клиенту).
if (!empty($cfg['roistat_webhook']) && is_string($cfg['roistat_webhook'])) {
	lead_roistat_send($cfg['roistat_webhook'], [
		'title' => 'Заявка с сайта gkmetallinvest.ru',
		'name' => $name,
		'phone' => $phone,
		'email' => $email !== '' ? $email : null,
		'comment' => $message !== '' ? $message : null,
		'roistat_visit' => $roistatVisit !== '' ? $roistatVisit : 'nocookie',
		'fields' => ['page' => $page, 'city' => $city, 'attachment' => $attachment ? $attachment['name'] : null],
	]);
}

if ($sent) {
	echo json_encode(['ok' => true]);
} else {
	http_response_code(502);
	echo json_encode(['ok' => false, 'error' => 'send']);
}

/**
 * Минимальный SMTP-клиент: implicit TLS (ssl, порт 465), STARTTLS (tls, 587)
 * или без шифрования (none — только для локальных проверок). AUTH LOGIN.
 */
function lead_smtp_send(array $cfg, string $from, string $to, string $message): bool
{
	$host = (string) $cfg['smtp_host'];
	$port = (int) ($cfg['smtp_port'] ?? 465);
	$secure = (string) ($cfg['smtp_secure'] ?? 'ssl');
	$remote = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;

	$fp = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT);
	if (!$fp) {
		error_log('send.php smtp connect: ' . $errno . ' ' . $errstr);
		return false;
	}
	stream_set_timeout($fp, 20);

	$read = static function () use ($fp): array {
		$code = 0;
		$text = '';
		while (($line = fgets($fp, 1024)) !== false) {
			$text .= $line;
			$code = (int) substr($line, 0, 3);
			if (strlen($line) < 4 || $line[3] !== '-') {
				break;
			}
		}
		return [$code, $text];
	};
	$cmd = static function (string $c, array $okCodes) use ($fp, $read): bool {
		fwrite($fp, $c . "\r\n");
		[$code] = $read();
		return in_array($code, $okCodes, true);
	};

	try {
		[$code] = $read();
		if ($code !== 220) {
			return false;
		}
		$ehlo = 'gkmetallinvest.ru';
		if (!$cmd('EHLO ' . $ehlo, [250])) {
			return false;
		}
		if ($secure === 'tls') {
			if (!$cmd('STARTTLS', [220]) || !@stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
				return false;
			}
			if (!$cmd('EHLO ' . $ehlo, [250])) {
				return false;
			}
		}
		if (!$cmd('AUTH LOGIN', [334])
			|| !$cmd(base64_encode((string) $cfg['smtp_user']), [334])
			|| !$cmd(base64_encode((string) $cfg['smtp_pass']), [235])) {
			error_log('send.php smtp auth failed');
			return false;
		}
		if (!$cmd('MAIL FROM:<' . $from . '>', [250])) {
			return false;
		}
		foreach (array_filter(array_map('trim', explode(',', $to))) as $rcpt) {
			if (!$cmd('RCPT TO:<' . $rcpt . '>', [250, 251])) {
				return false;
			}
		}
		if (!$cmd('DATA', [354])) {
			return false;
		}
		// Нормализуем переводы строк и экранируем точку в начале строки (dot-stuffing).
		$msg = preg_replace('/\r\n|\r|\n/', "\r\n", $message);
		$msg = preg_replace('/^\./m', '..', (string) $msg);
		fwrite($fp, $msg . "\r\n.\r\n");
		[$code] = $read();
		$ok = $code === 250;
		@fwrite($fp, "QUIT\r\n");
		return $ok;
	} finally {
		@fclose($fp);
	}
}

/**
 * Проверка токена Yandex SmartCaptcha на сервере. true — человек; false — робот или неверный токен.
 * Если сервис капчи недоступен или у нас неверный серверный ключ, считаем проверку
 * пройденной (так советует документация Яндекса): лучше принять заявку, чем потерять клиента.
 */
function lead_captcha_ok(string $secret, string $token, string $ip): bool
{
	$url = 'https://smartcaptcha.cloud.yandex.ru/validate';
	$post = http_build_query(['secret' => $secret, 'token' => $token, 'ip' => $ip]);
	$body = false;
	$code = 0;

	if (function_exists('curl_init')) {
		$ch = curl_init($url);
		curl_setopt_array($ch, [
			CURLOPT_POST => true,
			CURLOPT_POSTFIELDS => $post,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_CONNECTTIMEOUT => 4,
			CURLOPT_TIMEOUT => 8,
		]);
		$body = curl_exec($ch);
		$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);
	} else {
		$ctx = stream_context_create(['http' => [
			'method' => 'POST',
			'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
			'content' => $post,
			'timeout' => 8,
			'ignore_errors' => true,
		]]);
		$body = @file_get_contents($url, false, $ctx);
		if (isset($http_response_header[0]) && preg_match('#^HTTP/\S+\s+(\d{3})#', $http_response_header[0], $m)) {
			$code = (int) $m[1];
		}
	}

	// Сбой сервиса (нет ответа, 5xx, 429) — не теряем заявку.
	if (!is_string($body) || $code === 0 || $code >= 500 || $code === 429) {
		error_log('send.php captcha: сервис недоступен, код ' . $code);
		return true;
	}
	$data = json_decode($body, true);
	if (!is_array($data)) {
		return true;
	}
	$status = (string) ($data['status'] ?? '');
	if ($status === 'ok') {
		return true;
	}
	// Неверный серверный ключ — это наша ошибка настройки, а не бот: заявку принимаем и пишем в лог.
	$msg = (string) ($data['message'] ?? '');
	if ($msg !== '' && preg_match('/secret|authentication|key/i', $msg)) {
		error_log('send.php captcha: ошибка ключа — ' . $msg);
		return true;
	}
	return false;
}

/** Отправка заявки в Roistat (Webhook-интеграция): POST JSON, таймаут 6 с, ошибки молча игнорируем. */
function lead_roistat_send(string $url, array $payload): void
{
	if (strpos($url, 'https://') !== 0) {
		return;
	}
	$ctx = stream_context_create(['http' => [
		'method' => 'POST',
		'header' => "Content-Type: application/json\r\n",
		'content' => json_encode($payload, JSON_UNESCAPED_UNICODE),
		'timeout' => 6,
		'ignore_errors' => true,
	]]);
	@file_get_contents($url, false, $ctx);
}
