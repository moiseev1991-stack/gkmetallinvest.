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
	if (mb_strlen($v) > $max) {
		$v = mb_substr($v, 0, $max);
	}
	// Срезаем управляющие символы (защита от инъекции в заголовки/тело).
	return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
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

$sent = @mail($recipients, $subject, $body, $headers, '-f' . $fromEmail);

if ($sent) {
	echo json_encode(['ok' => true]);
} else {
	http_response_code(502);
	echo json_encode(['ok' => false, 'error' => 'send']);
}
