<?php
/**
 * Обработчик заявок с форм сайта gkmetallinvest.ru.
 * Работает на Timeweb (Apache + PHP). Принимает POST (multipart) от LeadForm,
 * отправляет письмо на общую почту компании (та же, что в шапке сайта)
 * и при необходимости прикладывает файл клиента. Возвращает JSON.
 *
 * ВАЖНО: SPF домена разрешает отправку только через mail.ru, поэтому если
 * письма будут попадать в спам — переключить отправку на SMTP smtp.mail.ru
 * (ящик zakaz@gkmetallinvest.ru). Пока используем стандартный mail().
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

// ---- Вложение (необязательно): один файл до 5 МБ, только безопасные форматы. ----
const ATTACH_MAX_BYTES = 5 * 1024 * 1024;
$attachment = null; // ['name' => ..., 'type' => ..., 'data' => ..., 'size' => ...]

$fail = static function (string $code, int $status = 422): void {
	http_response_code($status);
	echo json_encode(['ok' => false, 'error' => $code]);
	exit;
};

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
$recipients = 'zakaz@gkmetallinvest.ru';

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

// На некоторых хостингах mail() отключён в disable_functions — тогда нужен SMTP.
if (!function_exists('mail')) {
	http_response_code(502);
	echo json_encode(['ok' => false, 'error' => 'mail_disabled']);
	exit;
}

$sent = @mail($recipients, $subject, $body, $headers, '-f' . $fromEmail);

if ($sent) {
	echo json_encode(['ok' => true]);
} else {
	http_response_code(502);
	echo json_encode(['ok' => false, 'error' => 'send']);
}
