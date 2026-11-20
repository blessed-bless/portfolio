# Timeweb Apps: 404, кэш, заголовки

Статика из `astro build` лежит в `dist/`. Astro уже пишет `dist/404.html`.

## 1. Отдавать 404.html со статусом 404

В панели Timeweb Apps → приложение → **Настройки** / **Static** / **Custom headers & redirects** (названия могут чуть отличаться):

| Параметр | Значение |
| --- | --- |
| Error page / 404 document | `404.html` |
| Fallback SPA на `index.html` | **выключить** |

Если SPA-fallback включён, любой неизвестный URL вернёт главную с **200** — это ломает SEO и проверку 404.

Проверка после деплоя:

```bash
curl -sI https://ВАШ_ДОМЕН/нет-такой-страницы/
# HTTP/2 404
# и тело — страница «Здесь пусто», не главная
```

## 2. Сжатие

Включите **Brotli** и **Gzip** для текстовых типов (`text/html`, `text/css`, `application/javascript`, `image/svg+xml`, `application/json`, `application/manifest+json`).

## 3. Cache-Control

| Путь | Заголовок |
| --- | --- |
| `/_astro/*` | `Cache-Control: public, max-age=31536000, immutable` |
| `*.html`, `/`, страницы без хеша | `Cache-Control: public, max-age=0, must-revalidate` или `max-age=300` |
| `/og/*`, `/covers/*` | `Cache-Control: public, max-age=86400` |

Хешированные ассеты Astro лежат под `/_astro/` — им нужен длинный immutable-кэш.

## 4. HTTPS и HSTS

- Редирект **HTTP → HTTPS** (301).
- HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (только после того, как HTTPS точно стабилен на основном домене).

## 5. Security / privacy headers (все ответы)

```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Опционально: `X-Frame-Options: SAMEORIGIN`.

## 6. Preview-домен `*.twc1.net`

Для служебного URL Timeweb (не основной домен):

```
X-Robots-Tag: noindex, nofollow
```

На основном домене (`dubstepmolitva.ru`) этот заголовок **не** ставить.

## 7. Если Timeweb даёт raw nginx snippet

Пример (подправьте под их include):

```nginx
gzip on;
gzip_types text/plain text/css application/javascript application/json image/svg+xml application/manifest+json;
brotli on;
brotli_types text/plain text/css application/javascript application/json image/svg+xml application/manifest+json;

add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

location /_astro/ {
  add_header Cache-Control "public, max-age=31536000, immutable" always;
}

location ~* \.html$ {
  add_header Cache-Control "public, max-age=0, must-revalidate" always;
}

error_page 404 /404.html;
location = /404.html {
  internal;
}

# только на server_name *.twc1.net:
# add_header X-Robots-Tag "noindex, nofollow" always;
```

## 8. Чеклист после деплоя

1. `curl -sI https://домен/нет-такой/` → **404** + HTML 404-страницы.
2. `curl -sI https://домен/_astro/....js` → `immutable` / длинный max-age.
3. `curl -sI http://домен/` → редирект на https.
4. На `*.twc1.net` в ответе есть `X-Robots-Tag: noindex`.
