import { telegramChannel } from '../data/home';

export type ChannelPost = {
  text: string;
  /** ISO datetime from Telegram preview. */
  date: string;
  href: string;
};

const FETCH_MS = 8_000;
const TEXT_MAX = 140;

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function clipText(value: string, max = TEXT_MAX): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const at = cut.lastIndexOf(' ');
  const base = (at > 80 ? cut.slice(0, at) : cut).trimEnd();
  return `${base}…`;
}

/** Parse t.me/s HTML. Service messages are skipped. */
export function parseChannelPosts(html: string, limit = 3): ChannelPost[] {
  const chunks = html.split('tgme_widget_message_wrap');
  const found: ChannelPost[] = [];

  for (const chunk of chunks) {
    if (!chunk.includes('js-widget_message')) continue;
    if (/\bservice_message\b/.test(chunk)) continue;

    const textMatch = chunk.match(
      /class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    );
    if (!textMatch?.[1]) continue;

    const text = clipText(stripHtml(textMatch[1]));
    if (!text) continue;

    const timeMatch = chunk.match(/<time[^>]*datetime="([^"]+)"/i);
    if (!timeMatch?.[1]) continue;

    const hrefMatch = chunk.match(
      /class="[^"]*tgme_widget_message_date[^"]*"[^>]*href="([^"]+)"/i,
    );
    const postMatch = chunk.match(/data-post="([^"]+)"/i);
    const href =
      hrefMatch?.[1] ||
      (postMatch?.[1] ? `https://t.me/${postMatch[1]}` : null);
    if (!href) continue;

    found.push({ text, date: timeMatch[1], href });
  }

  return found.slice(-limit).reverse();
}

/**
 * Build-time fetch of the latest channel posts.
 * Returns [] on network/parse failure — callers must not throw.
 */
export async function fetchChannelPosts(limit = 3): Promise<ChannelPost[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_MS);
    const response = await fetch(telegramChannel.preview, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; portfolio-build)',
      },
    });
    clearTimeout(timer);
    if (!response.ok) return [];
    const html = await response.text();
    return parseChannelPosts(html, limit);
  } catch {
    return [];
  }
}

export function formatChannelDate(iso: string, locale: 'ru' | 'en' = 'ru'): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(locale === 'en' ? 'en-GB' : 'ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function isTelegramChannelHref(href: string): boolean {
  return new RegExp(
    `(?:https?:\\/\\/)?(?:t\\.me|telegram\\.me)\\/${telegramChannel.handle}(?:\\/|$)`,
    'i',
  ).test(href);
}
