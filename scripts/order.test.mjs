import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const origin = 'https://dubstepmolitva.ru';
const builtFile = (path) => readFile(new URL(`../dist/${path}`, import.meta.url), 'utf8');

test('both order pages have matching alternates, sitemap entries and direct contacts', async () => {
  const sitemap = await builtFile('sitemap.xml');
  for (const prefix of ['', 'en/']) {
    const path = `${prefix}order/`;
    const page = await builtFile(`${path}index.html`);
    assert.ok(page.includes(`rel="canonical" href="${origin}/${path}"`));
    assert.ok(page.includes(`hreflang="ru" href="${origin}/order/"`));
    assert.ok(page.includes(`hreflang="en" href="${origin}/en/order/"`));
    assert.ok(sitemap.includes(`<loc>${origin}/${path}</loc>`));

    const contact = page.match(/<section\b[^>]*\bid="contact"[^>]*>[\s\S]*?<\/section>/)?.[0];
    assert.ok(contact);
    assert.match(contact, /href="https:\/\/t\.me\/ketasonx"/);
    assert.match(contact, /href="mailto:bogdan@dubstepmolitva\.ru"/);
    assert.doesNotMatch(contact, /<(form|input|textarea)\b/);
    assert.doesNotMatch(page, /<noscript>[^]*?mc\.yandex\.ru\/watch\//);
  }
});

test('home and order share prices while the FAQ explains the estimate', async () => {
  for (const prefix of ['', 'en/']) {
    const home = await builtFile(`${prefix}index.html`);
    const order = await builtFile(`${prefix}order/index.html`);
    const prices = [...order.matchAll(/<strong[^>]*>((?:от|from)\s+[^<]+ ₽)<\/strong>/g)]
      .map(([, price]) => price);
    assert.equal(prices.length, 4);
    const faq = order.match(/<section\b[^>]*\bid="faq"[^>]*>[\s\S]*?<\/section>/)?.[0];
    assert.ok(faq);
    assert.doesNotMatch(home, /\bid="faq"/);
    assert.match(faq, prefix ? /payments or CRM sync/ : /оплата или синхронизация с CRM/);
    for (const price of prices) {
      assert.ok(home.includes(price));
      assert.ok(!faq.includes(price));
    }
  }
});
