import type { APIRoute } from 'astro';

const body = `/* TEAM */
Developer: Bogdan Shcherbinin
Site: https://dubstepmolitva.ru
GitHub: https://github.com/blessed-bless
Contact: bogdan@dubstepmolitva.ru
Telegram: https://t.me/ketasonx
From: Omsk, Russia

/* SITE */
Last update: 2026-11
Language: Russian
Doctype: HTML5
Standards: Astro, MDX, TypeScript
Stack: Astro 7, GSAP, Lenis, Three.js
Fonts: Onest, Unbounded, IBM Plex Mono
Hosting: Timeweb Cloud
IDE: Cursor

/* THANKS */
Onest / Unbounded / IBM Plex Mono — readable Cyrillic under load
Astro — View Transitions without a SPA tax
GSAP — motion that stays under control
Lenis — scroll that does not fight the page
Three.js — hero when the GPU agrees
`;

export const GET: APIRoute = () =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
