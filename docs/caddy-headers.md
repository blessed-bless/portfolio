# Заголовки Caddy для портфолио

На 24.11.2026 публичные ответы для главной и хешированного `/_astro/page.B2KGc8p6.js` содержали `ETag` и `Last-Modified`. В этих ответах не было `Cache-Control`, HSTS, `X-Content-Type-Options` и CSP. Caddyfile сайта управляется на хостинге.

Вставить внутрь HTTPS-блока сайта на тестовом хосте. Правила кэширования используют отложенную запись заголовка, чтобы проверить статус и тип ответа. Скопировать результат в боевую конфигурацию только после согласования.

```caddyfile
@hashedAstro path_regexp hashedAstro ^/_astro/[^/]+\.[A-Za-z0-9_-]{8}(_[A-Za-z0-9]+)?\.[a-z0-9]+$
header @hashedAstro Cache-Control "public, max-age=31536000, immutable" {
	match status 2xx 304
}

header Cache-Control "no-cache" {
	match header Content-Type text/html*
}

header {
	Strict-Transport-Security "max-age=31536000"
	X-Content-Type-Options "nosniff"
	Content-Security-Policy-Report-Only "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://yastatic.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://mc.yandex.ru https://yastatic.net; font-src 'self' data:; connect-src 'self' https://mc.yandex.ru wss://mc.yandex.ru https://yastatic.net; frame-src 'self' blob: https://mc.yandex.ru; worker-src 'self' blob:"
}
```

`no-cache` позволяет браузеру хранить HTML и проверять актуальность перед повторным использованием. При обновлении хранить ассеты предыдущей сборки, пока открытые вкладки могут на них ссылаться. Для HSTS включён только текущий HTTPS-хост.

В Report-Only оставлены inline-скрипт темы и inline-стили из Astro и анимаций. Проверить консоль браузера с согласием и отказом, в обоих языках, на главной, странице заказа, кейсе с демо и 404. Зафиксировать реальные обращения тега Метрики, включая региональные домены, перед включением политики в режиме блокировки. Локальный тест перехватывает тег и проверяет домен его загрузки. Для карты кликов внутри кабинета отдельно проверить ограничения `frame-ancestors`.

```sh
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

base=https://dubstepmolitva.ru
asset=$(curl -fsS "$base/" | grep -oE '/_astro/[^" <>]+\.(js|css|woff2)' | head -1)
test -n "$asset" && curl -sSI "$base$asset"
curl -sSI "$base/order/"
curl -sSI "$base/en/order/"
curl -sSI "$base/_astro/missing.ABCDEFGH.js"
curl -sSI "$base/sitemap.xml"
```

Хешированный файл должен отдавать `public, max-age=31536000, immutable`. У HTML ожидается `no-cache`. Ответ 404 за отсутствующий ассет должен остаться без `immutable`.

- [Директива header в Caddy](https://caddyserver.com/docs/caddyfile/directives/header)
- [Настройка CSP для Яндекс Метрики](https://yandex.com/support/metrica/ru/code/install-counter-csp)
