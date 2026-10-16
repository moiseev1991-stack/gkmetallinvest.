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
 * Roistat: номер визита (cookie roistat_visit) добавляется в письмо, а при наличии
 * roistat_key в конфиге заявка уходит в Roistat проксилидом
 * (https://cloud.roistat.com/api/proxy/1.0/leads/add), откуда Roistat передаёт её в CRM.
 */

// Форма шлёт заявку через fetch (Accept: application/json) и получает JSON. Если же браузер перешёл
// на /send.php обычной отправкой формы (JavaScript не успел загрузиться или отключён), показываем
// понятную HTML-страницу вместо голого JSON.
$accept = (string) ($_SERVER['HTTP_ACCEPT'] ?? '');
$wantsHtml = ($_SERVER['HTTP_SEC_FETCH_DEST'] ?? '') === 'document'
	|| (strpos($accept, 'application/json') === false && strpos($accept, 'text/html') !== false);

header('Content-Type: ' . ($wantsHtml ? 'text/html' : 'application/json') . '; charset=utf-8');
header('X-Robots-Tag: noindex');

if ($wantsHtml) {
	ob_start(static function (string $buf): string {
		$d = json_decode($buf, true);
		if (!is_array($d)) {
			return $buf;
		}
		$msgs = [
			'consent' => 'Отметьте согласие на обработку персональных данных и отправьте заявку ещё раз.',
			'required' => 'Заполните имя и телефон и отправьте заявку ещё раз.',
			'file_size' => 'Файл слишком большой (до 5 МБ). Приложите файл меньше или отправьте его на zakaz@gkmetallinvest.ru.',
			'file_type' => 'Этот формат файла не принимаем. Приложите PDF, TXT, Word, Excel, JPG или PNG.',
			'captcha' => 'Проверка «я не робот» не пройдена. Вернитесь на сайт и отправьте заявку ещё раз.',
		];
		$ok = !empty($d['ok']);
		$title = $ok ? 'Заявка отправлена' : 'Заявка не отправлена';
		$text = $ok
			? 'Менеджер свяжется с вами в течение 30 минут.'
			: ($msgs[$d['error'] ?? ''] ?? 'Не удалось отправить заявку. Напишите на zakaz@gkmetallinvest.ru или позвоните нам.');
		return '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
			. '<meta name="viewport" content="width=device-width, initial-scale=1">'
			. '<meta name="robots" content="noindex"><title>' . $title . '</title>'
			. '<style>body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#1a1a1a}'
			. 'h1{font-size:1.5rem}a{color:#1d4ed8}</style></head><body>'
			. '<h1>' . $title . '</h1><p>' . htmlspecialchars($text, ENT_QUOTES, 'UTF-8') . '</p>'
			. '<p><a href="javascript:history.back()">← Вернуться к форме</a> · <a href="/">На главную</a></p>'
			. '</body></html>';
	});
}

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

// Тело запроса больше post_max_size: PHP отбрасывает $_POST и $_FILES целиком (обычно из-за крупного файла).
if (empty($_POST) && empty($_FILES) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
	http_response_code(413);
	echo json_encode(['ok' => false, 'error' => 'file_size']);
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

// ---- Капча: включается, когда в send-config.php есть captcha_secret (Google reCAPTCHA v3 или Яндекс SmartCaptcha). ----
$captchaNote = ''; // строка для письма: пройдена / не проверена; пусто — капча выключена
if (!empty($cfg['captcha_secret']) && is_string($cfg['captcha_secret'])) {
	$captchaProvider = (isset($cfg['captcha_provider']) && $cfg['captcha_provider'] === 'google') ? 'google' : 'yandex';
	$captchaField = $captchaProvider === 'google' ? 'g-recaptcha-response' : 'smart-token';
	$captchaToken = isset($_POST[$captchaField]) && is_string($_POST[$captchaField]) ? trim($_POST[$captchaField]) : '';
	$remoteIp = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
	if (strlen($captchaToken) > 4096) {
		$fail('captcha');
	}
	if ($captchaToken === '') {
		// Скрипт капчи не загрузился у посетителя (заблокирован, медленная сеть). Живого клиента терять нельзя,
		// поэтому принимаем заявку, но не чаще 3 раз в час с одного IP, и помечаем письмо.
		$diag = isset($_POST['captcha_unavailable']) && is_string($_POST['captcha_unavailable']) ? trim($_POST['captcha_unavailable']) : '';
		if ($diag === '' || !lead_fallback_allowed($remoteIp)) {
			$fail('captcha');
		}
		$diag = substr((string) preg_replace('/[^\w .:,\/-]/u', '', $diag), 0, 80);
		$captchaNote = 'НЕ ПРОВЕРЕНА (капча не загрузилась у посетителя: ' . $diag . ')';
	} else {
		$minScore = isset($cfg['captcha_min_score']) && is_numeric($cfg['captcha_min_score']) ? (float) $cfg['captcha_min_score'] : 0.3;
		if (!lead_captcha_ok($captchaProvider, $cfg['captcha_secret'], $captchaToken, $remoteIp, $minScore)) {
			$fail('captcha');
		}
		$captchaNote = 'пройдена';
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
if ($captchaNote !== '') {
	// Перед строками «Дата/время» и «IP».
	array_splice($bodyLines, -2, 0, ['Капча:               ' . $captchaNote]);
}
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

// Идентификатор заявки из формы: по нему находим сделку в amoCRM, чтобы приложить файл к нужной.
$rid = isset($_POST['rid']) && is_string($_POST['rid']) && preg_match('/^F[0-9a-f]{10}$/', $_POST['rid']) ? $_POST['rid'] : '';
$requestStart = time();

// Загрузка вложения в сделку amoCRM включается, когда в конфиге есть amocrm_token.
$amoOn = $attachment && $rid !== '' && !empty($cfg['amocrm_token']) && is_string($cfg['amocrm_token']);
$mailOff = isset($cfg['mail']) && $cfg['mail'] === 'off';

/** Отправка письма с заявкой (SMTP или запасной mail()). */
$sendMail = static function () use ($cfg, $useSmtp, $smtpUser, $recipients, $subject, $headers, $body, $fromEmail): bool {
	if ($useSmtp) {
		// По SMTP отправитель обязан совпадать с логином ящика.
		$smtpHeaders = 'Date: ' . date('r') . "\r\n"
			. 'To: ' . $recipients . "\r\n"
			. 'Subject: ' . $subject . "\r\n"
			. str_replace('<' . $fromEmail . '>', '<' . $smtpUser . '>', $headers);
		return lead_smtp_send($cfg, $smtpUser, $recipients, $smtpHeaders . "\r\n" . $body);
	}
	// Запасной путь: на некоторых хостингах mail() отключён — тогда нужен SMTP.
	if (!function_exists('mail')) {
		return false;
	}
	return @mail($recipients, $subject, $body, $headers, '-f' . $fromEmail);
};

$mailLater = false; // письмо понадобится только как запасной путь, если файл не удастся положить в amoCRM
if ($mailOff && (!$attachment || $amoOn)) {
	// Письмо отключено настройкой (секрет LEAD_MAIL=off): заявка идёт только в Roistat/CRM.
	// Исключение — заявка с файлом, который некуда положить, кроме письма.
	$sent = true;
	$mailLater = (bool) $attachment;
} else {
	$sent = $sendMail();
}

// Roistat (проксилид): заявка с номером визита уходит в Roistat, тот передаёт её в CRM.
// Ошибки пишем только в лог, ответ клиенту они не меняют.
if (!empty($cfg['roistat_key']) && is_string($cfg['roistat_key'])) {
	$roiLines = [];
	if ($message !== '') {
		$roiLines[] = $message;
		$roiLines[] = '';
	}
	$roiLines[] = 'Город: ' . ($city !== '' ? $city : '—');
	$roiLines[] = 'Страница: ' . ($page !== '' ? $page : '—');
	$roiLines[] = 'Согласие на рекламу: ' . $marketing;
	if ($attachment) {
		$roiLines[] = 'Вложение: ' . $attachment['name'] . ' (файл во письме на почте)';
	}
	if ($captchaNote !== '' && $captchaNote !== 'пройдена') {
		$roiLines[] = 'Капча: ' . $captchaNote;
	}
	$roiData = [
		'roistat' => $roistatVisit !== '' ? $roistatVisit : 'nocookie',
		'key' => $cfg['roistat_key'],
		'title' => 'Заявка с сайта gkmetallinvest.ru',
		'name' => $name,
		'phone' => $phone,
		'comment' => implode("
", $roiLines),
		'order_creation_method' => 'Форма на сайте',
		'is_need_callback' => '0',
		'sync' => '0',
	];
	if ($email !== '') {
		$roiData['email'] = $email;
	}
	// Поля CRM с переменными Roistat (источник визита); коды полей можно переопределить в roistat_fields.
	$roiFields = isset($cfg['roistat_fields']) && is_array($cfg['roistat_fields'])
		? $cfg['roistat_fields']
		: ['UTM_SOURCE' => '{utmSource}', 'utm_source' => '{sourceAliasLevel1}'];
	if ($roiFields) {
		$roiData['fields'] = $roiFields;
	}
	lead_roistat_proxylead($roiData);
}

$response = $sent ? json_encode(['ok' => true]) : json_encode(['ok' => false, 'error' => 'send']);
if (!$sent) {
	http_response_code(502);
}

if (!$amoOn || $wantsHtml || !$sent) {
	echo $response;
	// Файл некуда положить, кроме письма (обычный переход без JS или сбой): отправляем письмо сейчас.
	if ($mailLater) {
		$sendMail();
	}
	exit;
}

// Файл уходит в сделку amoCRM уже после ответа посетителю: сделку создаёт Roistat с задержкой в несколько секунд.
ignore_user_abort(true);
@set_time_limit(240);
header('Content-Length: ' . strlen($response));
header('Connection: close');
echo $response;
while (ob_get_level() > 0) {
	@ob_end_flush();
}
@flush();
if (function_exists('fastcgi_finish_request')) {
	@fastcgi_finish_request();
}

$attached = false;
try {
	$attached = lead_amo_attach($cfg, $attachment, $rid, $requestStart);
} catch (\Throwable $e) {
	error_log('send.php amocrm: ' . $e->getMessage());
}
if (!$attached && $mailLater) {
	// Не получилось положить файл в сделку — отправляем его письмом, чтобы не потерять.
	$sendMail();
}
exit;

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
 * Проверка токена капчи на сервере. true — человек; false — робот или неверный токен.
 * Провайдеры: 'google' (reCAPTCHA v3, порог score $minScore) и 'yandex' (SmartCaptcha).
 * Если сервис капчи недоступен или у нас неверный серверный ключ, считаем проверку
 * пройденной (так советуют документации): лучше принять заявку, чем потерять клиента.
 */
function lead_captcha_ok(string $provider, string $secret, string $token, string $ip, float $minScore = 0.3): bool
{
	if ($provider === 'google') {
		// google.com, а при недоступности — зеркало recaptcha.net
		$urls = ['https://www.google.com/recaptcha/api/siteverify', 'https://www.recaptcha.net/recaptcha/api/siteverify'];
		$post = http_build_query(['secret' => $secret, 'response' => $token, 'remoteip' => $ip]);
	} else {
		$urls = ['https://smartcaptcha.cloud.yandex.ru/validate'];
		$post = http_build_query(['secret' => $secret, 'token' => $token, 'ip' => $ip]);
	}

	$body = false;
	$code = 0;
	foreach ($urls as $url) {
		[$body, $code] = lead_http_post($url, $post);
		// Сбой сервиса (нет ответа, 5xx, 429) — пробуем следующий адрес, потом не теряем заявку.
		if (is_string($body) && $code !== 0 && $code < 500 && $code !== 429) {
			break;
		}
	}
	if (!is_string($body) || $code === 0 || $code >= 500 || $code === 429) {
		error_log('send.php captcha: сервис недоступен, код ' . $code);
		return true;
	}
	$data = json_decode($body, true);
	if (!is_array($data)) {
		return true;
	}

	if ($provider === 'google') {
		if (!empty($data['success'])) {
			// Действие должно совпасть с тем, что запросила форма, и оценка не ниже порога.
			if (isset($data['action']) && $data['action'] !== 'lead') {
				return false;
			}
			return !isset($data['score']) || (float) $data['score'] >= $minScore;
		}
		$errors = isset($data['error-codes']) && is_array($data['error-codes']) ? $data['error-codes'] : [];
		// Неверный серверный ключ — наша ошибка настройки, а не бот: заявку принимаем и пишем в лог.
		if (array_intersect($errors, ['missing-input-secret', 'invalid-input-secret'])) {
			error_log('send.php captcha: ошибка ключа — ' . implode(',', $errors));
			return true;
		}
		return false;
	}

	if (($data['status'] ?? '') === 'ok') {
		return true;
	}
	$msg = (string) ($data['message'] ?? '');
	if ($msg !== '' && preg_match('/secret|authentication|key/i', $msg)) {
		error_log('send.php captcha: ошибка ключа — ' . $msg);
		return true;
	}
	return false;
}

/**
 * Запасной путь без капчи: не больше 3 заявок в час с одного IP. Счётчик лежит во временной папке;
 * если файл недоступен для записи, лимит не применяем (не теряем заявку).
 */
function lead_fallback_allowed(string $ip): bool
{
	$file = sys_get_temp_dir() . '/lead_fb_' . md5($ip !== '' ? $ip : 'unknown') . '.json';
	$now = time();
	$times = [];
	if (is_file($file)) {
		$data = json_decode((string) @file_get_contents($file), true);
		if (is_array($data)) {
			foreach ($data as $ts) {
				if (is_int($ts) && $ts > $now - 3600) {
					$times[] = $ts;
				}
			}
		}
	}
	if (count($times) >= 3) {
		return false;
	}
	$times[] = $now;
	@file_put_contents($file, json_encode($times), LOCK_EX);
	return true;
}

/** POST x-www-form-urlencoded: возвращает [тело|false, HTTP-код]. curl, а если его нет — потоки PHP. */
function lead_http_post(string $url, string $post, int $connectTimeout = 4, int $timeout = 8): array
{
	if (function_exists('curl_init')) {
		$ch = curl_init($url);
		curl_setopt_array($ch, [
			CURLOPT_POST => true,
			CURLOPT_POSTFIELDS => $post,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_CONNECTTIMEOUT => $connectTimeout,
			CURLOPT_TIMEOUT => $timeout,
		]);
		$body = curl_exec($ch);
		$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);
		return [$body, $code];
	}
	$ctx = stream_context_create(['http' => [
		'method' => 'POST',
		'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
		'content' => $post,
		'timeout' => $timeout,
		'ignore_errors' => true,
	]]);
	$body = @file_get_contents($url, false, $ctx);
	$code = 0;
	if (isset($http_response_header[0]) && preg_match('#^HTTP/\S+\s+(\d{3})#', $http_response_header[0], $m)) {
		$code = (int) $m[1];
	}
	return [$body, $code];
}

/**
 * Запрос к amoCRM (JSON). Возвращает [HTTP-код, разобранный ответ|null].
 * $url — полный адрес; $json — тело в JSON; $raw — сырое тело (части файла).
 */
function lead_amo_call(array $cfg, string $method, string $url, ?array $json = null, ?string $raw = null): array
{
	$headers = ['Authorization: Bearer ' . $cfg['amocrm_token'], 'Accept: application/json'];
	$ch = curl_init($url);
	$opts = [
		CURLOPT_CUSTOMREQUEST => $method,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_CONNECTTIMEOUT => 6,
		CURLOPT_TIMEOUT => 40,
	];
	if ($json !== null) {
		$headers[] = 'Content-Type: application/json';
		$opts[CURLOPT_POSTFIELDS] = json_encode($json, JSON_UNESCAPED_UNICODE);
	} elseif ($raw !== null) {
		$headers[] = 'Content-Type: application/octet-stream';
		$opts[CURLOPT_POSTFIELDS] = $raw;
	}
	$opts[CURLOPT_HTTPHEADER] = $headers;
	curl_setopt_array($ch, $opts);
	$body = curl_exec($ch);
	$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);
	$data = is_string($body) && $body !== '' ? json_decode($body, true) : null;
	return [$code, is_array($data) ? $data : null];
}

/**
 * Находит сделку по идентификатору заявки: Roistat кладёт текст заявки (в нём «№ F…») примечанием в сделку.
 * Ищем среди недавно изменённых примечаний; до $deadline опрашиваем каждые 5 секунд.
 */
function lead_amo_find_lead(array $cfg, string $base, string $rid, int $since, int $deadline): int
{
	while (time() <= $deadline) {
		$q = http_build_query([
			'filter' => ['updated_at' => ['from' => $since - 60]],
			'order' => ['updated_at' => 'desc'],
			'limit' => 250,
		]);
		[$code, $data] = lead_amo_call($cfg, 'GET', $base . '/api/v4/leads/notes?' . $q);
		if ($code === 200 && isset($data['_embedded']['notes']) && is_array($data['_embedded']['notes'])) {
			foreach ($data['_embedded']['notes'] as $note) {
				if (strpos(json_encode($note['params'] ?? [], JSON_UNESCAPED_UNICODE), $rid) !== false && !empty($note['entity_id'])) {
					return (int) $note['entity_id'];
				}
			}
		} elseif ($code === 401 || $code === 403) {
			throw new \RuntimeException('нет доступа к amoCRM, код ' . $code);
		}
		sleep(5);
	}
	return 0;
}

/**
 * Кладёт файл заявки в сделку amoCRM (Files API): сессия → части → привязка к сделке → проверка.
 * true — файл привязан и виден в списке файлов сделки.
 */
function lead_amo_attach(array $cfg, array $attachment, string $rid, int $since): bool
{
	$domain = !empty($cfg['amocrm_domain']) && is_string($cfg['amocrm_domain']) ? $cfg['amocrm_domain'] : 'gkmetallinvest.amocrm.ru';
	$base = !empty($cfg['amocrm_base']) && is_string($cfg['amocrm_base']) ? rtrim($cfg['amocrm_base'], '/') : 'https://' . $domain;

	$wait = isset($cfg['amocrm_wait']) && is_numeric($cfg['amocrm_wait']) ? max(5, (int) $cfg['amocrm_wait']) : 75;
	$leadId = lead_amo_find_lead($cfg, $base, $rid, $since, $since + $wait);
	if ($leadId <= 0) {
		error_log('send.php amocrm: сделка с заявкой ' . $rid . ' не найдена');
		return false;
	}

	[$code, $acc] = lead_amo_call($cfg, 'GET', $base . '/api/v4/account?with=drive_url');
	$drive = $code === 200 && !empty($acc['drive_url']) ? rtrim((string) $acc['drive_url'], '/') : '';
	if ($drive === '') {
		error_log('send.php amocrm: нет адреса хранилища файлов, код ' . $code);
		return false;
	}

	$data = (string) $attachment['data'];
	[$code, $sess] = lead_amo_call($cfg, 'POST', $drive . '/v1.0/sessions', [
		'file_name' => (string) $attachment['name'],
		'file_size' => strlen($data),
		'content_type' => (string) $attachment['type'],
	]);
	if (!in_array($code, [200, 201], true) || empty($sess['upload_url'])) {
		error_log('send.php amocrm: сессия загрузки, код ' . $code);
		return false;
	}
	$part = max(1024, (int) ($sess['max_part_size'] ?? 131072));
	$url = (string) $sess['upload_url'];
	$file = null;
	for ($off = 0; $off < strlen($data); $off += $part) {
		[$code, $res] = lead_amo_call($cfg, 'POST', $url, null, substr($data, $off, $part));
		if ($code !== 200 || !is_array($res)) {
			error_log('send.php amocrm: часть файла, код ' . $code);
			return false;
		}
		if (!empty($res['next_url'])) {
			$url = (string) $res['next_url'];
		} elseif (!empty($res['uuid'])) {
			$file = $res;
		}
	}
	if (!$file || empty($file['uuid'])) {
		error_log('send.php amocrm: загрузка не вернула файл');
		return false;
	}

	[$code] = lead_amo_call($cfg, 'PUT', $base . '/api/v4/leads/' . $leadId . '/files', [['file_uuid' => (string) $file['uuid']]]);
	if (!in_array($code, [200, 202, 204], true)) {
		error_log('send.php amocrm: привязка файла к сделке ' . $leadId . ', код ' . $code);
		return false;
	}
	// Проверяем, что файл действительно привязан.
	[$code, $list] = lead_amo_call($cfg, 'GET', $base . '/api/v4/leads/' . $leadId . '/files');
	if ($code === 200 && isset($list['_embedded']['files'])) {
		foreach ($list['_embedded']['files'] as $f) {
			if (($f['file_uuid'] ?? '') === $file['uuid']) {
				return true;
			}
		}
	}
	error_log('send.php amocrm: привязка к сделке ' . $leadId . ' не подтверждена');
	return false;
}

/**
 * Проксилид Roistat: POST на leads/add (параметры, как в документации Roistat, «передача через серверный код»).
 * Ответ вида {"status":"ok"} или {"status":"error","data":"..."}; ошибки пишем в лог и не влияем на заявку.
 */
function lead_roistat_proxylead(array $data): void
{
	[$body, $code] = lead_http_post('https://cloud.roistat.com/api/proxy/1.0/leads/add', http_build_query($data), 3, 6);
	if (!is_string($body) || $code !== 200) {
		error_log('send.php roistat: нет ответа, код ' . $code);
		return;
	}
	$d = json_decode($body, true);
	if (!is_array($d) || ($d['status'] ?? '') !== 'ok') {
		error_log('send.php roistat: ' . substr($body, 0, 200));
	}
}
