#!/usr/bin/env node
/**
 * Пишет dist/send-config.php (настройки отправки заявок для public/send.php)
 * из секретов GitHub Actions. Так пароль SMTP не попадает в репозиторий и не
 * нужно вручную заливать файл на хостинг: он создаётся при каждом деплое.
 *
 * Секреты репозитория (Settings → Secrets and variables → Actions):
 *   SMTP_PASS        — пароль внешнего приложения почты zakaz@gkmetallinvest.ru (mail.ru)
 *   SMTP_USER        — логин ящика (по умолчанию zakaz@gkmetallinvest.ru)
 *   LEAD_TO          — кому слать заявки (по умолчанию zakaz@gkmetallinvest.ru)
 *   ROISTAT_WEBHOOK  — URL Webhook-интеграции Roistat (необязательно)
 *   RECAPTCHA_SECRET_KEY (+ RECAPTCHA_SITEKEY в сборке) — Google reCAPTCHA v3 (необязательно)
 *   SMARTCAPTCHA_SERVER_KEY (+ SMARTCAPTCHA_SITEKEY в сборке) — Yandex SmartCaptcha (необязательно)
 * Без SMTP_PASS файл не создаётся, send.php работает в запасном режиме mail().
 */
import { writeFileSync, existsSync } from 'node:fs';

const env = (k, d = '') => (process.env[k] ?? d).trim();
const pass = env('SMTP_PASS');

if (!pass) {
	console.log('write-send-config: SMTP_PASS не задан, send-config.php не создаётся');
	process.exit(0);
}
if (!existsSync('dist')) {
	console.error('write-send-config: нет папки dist (сначала сборка)');
	process.exit(1);
}

// Строка в одинарных кавычках PHP: экранируем только обратную косую и одинарную кавычку.
const BACKSLASH = String.fromCharCode(92);
const q = (s) => "'" + String(s).split(BACKSLASH).join(BACKSLASH + BACKSLASH).split("'").join(BACKSLASH + "'") + "'";

const user = env('SMTP_USER', 'zakaz@gkmetallinvest.ru');
const to = env('LEAD_TO', 'zakaz@gkmetallinvest.ru');
const hook = env('ROISTAT_WEBHOOK');
// Капча включается только когда есть оба ключа провайдера: серверный (секрет) и клиентский (он же уходит
// в сборку сайта как PUBLIC_*_SITEKEY). Иначе форма без виджета упёрлась бы в серверную проверку.
// Приоритет у Google reCAPTCHA v3, запасной вариант: Яндекс SmartCaptcha.
const rcSecret = env('RECAPTCHA_SECRET_KEY');
const rcSitekey = env('PUBLIC_RECAPTCHA_SITEKEY');
const ycSecret = env('SMARTCAPTCHA_SERVER_KEY');
const ycSitekey = env('PUBLIC_SMARTCAPTCHA_SITEKEY');
let captchaProvider = '';
let captchaSecret = '';
if (rcSecret !== '' && rcSitekey !== '') {
	captchaProvider = 'google';
	captchaSecret = rcSecret;
} else if (ycSecret !== '' && ycSitekey !== '') {
	captchaProvider = 'yandex';
	captchaSecret = ycSecret;
}

const php = `<?php
// Создан при деплое из секретов GitHub Actions (scripts/write-send-config.mjs). Не редактировать вручную.
return [
	'smtp_host' => 'smtp.mail.ru',
	'smtp_port' => 465,
	'smtp_secure' => 'ssl',
	'smtp_user' => ${q(user)},
	'smtp_pass' => ${q(pass)},
	'to' => ${q(to)},
	'roistat_webhook' => ${q(hook)},
	'captcha_provider' => ${q(captchaProvider)},
	'captcha_secret' => ${q(captchaSecret)},
];
`;

writeFileSync('dist/send-config.php', php, { mode: 0o600 });
console.log('write-send-config: dist/send-config.php создан (SMTP ' + user + ', Roistat ' + (hook ? 'вкл' : 'выкл') + ', капча ' + (captchaProvider || 'выкл') + ')');
