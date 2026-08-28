<?php
/**
 * Обработчик заявок с форм сайта gkmetallinvest.ru.
 * Работает на Timeweb (Apache + PHP). Принимает POST от LeadForm,
 * отправляет письмо на две почты компании. Возвращает JSON.
 *
 * ВАЖНО: SPF домена разрешает отправку только через mail.ru, поэтому если
 * письма будут попадать в спам — переключить отправку на SMTP smtp.mail.ru
 * (ящик zakaz@gkmetallinvest.ru). Пока используем стандартный mail().
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

// Диагностика: ?debug=<ключ> включает вывод реальной ошибки (иначе тихо 500).
$debug = (($_GET['debug'] ?? '') === 'clod2026diag');
if ($debug) { ini_set('display_errors', '1'); error_reporting(E_ALL); }

// Фатальный сбой отдаём как JSON, а не пустой 500 — чтобы фронт показал ошибку,
// а в debug-режиме было видно причину (нет mbstring, отключён mail() и т.п.).
register_shutdown_function(static function () use ($debug) {
	$e = error_get_last();
	if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
		echo json_encode(['ok' => false, 'error' => 'server', 'detail' => $debug ? $e['message'] : null]);
	}
});

// Ping: проверка, что задеплоена именно эта версия обработчика (письмо НЕ отправляется).
if (($_GET['ping'] ?? '') === 'clod2026') {
	echo json_encode(['ok' => true, 'ver' => 'send-v3-debugcc']);
	exit;
}

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

// В Reply-To кладём email клиента только если он валиден (защита от инъекции).
$replyTo = filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';

$recipients = 'corp-metalinvest01265@yandex.ru, ev18011@yandex.ru';

// В debug-режиме письмо уходит ТОЛЬКО на адрес из формы (проверка механизма
// без писем в рабочие ящики сотрудников). Продакшн-форма шлёт на оба ящика.
if ($debug && filter_var($email, FILTER_VALIDATE_EMAIL)) {
	$recipients = $email;
}

$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта — ' . $name) . '?=';

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
	str_repeat('-', 40),
	'Согласие на рекламу: ' . $marketing,
	'Страница:            ' . ($page !== '' ? $page : '—'),
	'Дата/время:          ' . date('Y-m-d H:i:s'),
	'IP:                  ' . ($_SERVER['REMOTE_ADDR'] ?? '—'),
];
$body = implode("\r\n", $bodyLines);

$fromEmail = 'zakaz@gkmetallinvest.ru';
$fromName  = '=?UTF-8?B?' . base64_encode('Сайт ГК Металлинвест') . '?=';

$headers  = 'From: ' . $fromName . ' <' . $fromEmail . '>' . "\r\n";
if ($replyTo !== '') {
	$headers .= 'Reply-To: ' . $replyTo . "\r\n";
}
$headers .= 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-Type: text/plain; charset=UTF-8' . "\r\n";
$headers .= 'Content-Transfer-Encoding: 8bit' . "\r\n";

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
