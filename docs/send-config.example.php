<?php
/**
 * Образец настроек для public/send.php (отправка заявок с сайта).
 *
 * КАК ПОЛЬЗОВАТЬСЯ
 * 1. Скопируйте этот файл под именем send-config.php и впишите реальные значения.
 * 2. Загрузите send-config.php на хостинг в ту же папку, где лежит send.php
 *    (корень сайта). Через файловый менеджер Timeweb или SFTP.
 * 3. В репозиторий send-config.php НЕ добавляйте: в нём пароль.
 *    (он уже в .gitignore, деплой его не затирает).
 *
 * smtp_pass — НЕ пароль от почты, а «пароль для внешнего приложения» из настроек
 * ящика mail.ru: Почта → Настройки → Пароли для внешних приложений → создать
 * (права: «Все протоколы» или «SMTP»).
 */
return [
	// SMTP ящика zakaz@gkmetallinvest.ru на mail.ru
	'smtp_host'   => 'smtp.mail.ru',
	'smtp_port'   => 465,
	'smtp_secure' => 'ssl',          // ssl (465), tls (587, STARTTLS) или none
	'smtp_user'   => 'zakaz@gkmetallinvest.ru',
	'smtp_pass'   => 'ПАРОЛЬ_ВНЕШНЕГО_ПРИЛОЖЕНИЯ',

	// Кому слать заявки (через запятую можно несколько адресов)
	'to'          => 'zakaz@gkmetallinvest.ru',

	// Roistat: URL Webhook-интеграции (Roistat → Интеграции → Добавить → Webhook).
	// Пока не указан — заявка только письмом, номер визита Roistat в нём есть.
	'roistat_webhook' => '',

	// Yandex SmartCaptcha: серверный ключ. Пусто — капча на сервере выключена.
	// При деплое его пишет scripts/write-send-config.mjs из секретов GitHub
	// SMARTCAPTCHA_SERVER_KEY и SMARTCAPTCHA_SITEKEY (клиентский ключ идёт в сборку формы).
	'captcha_secret' => '',
];
