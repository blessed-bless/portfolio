import { toggleTheme } from './theme';
import { isLessMotionToggleOn, toggleLessMotion } from './perf';
import type { PaletteItem } from '../data/command-palette';

const RECENT_KEY = 'portfolio-cmdk-recent';
const RECENT_MAX = 5;

type Ranked = PaletteItem & { score: number; indices: number[] };

let root: HTMLElement | null = null;
let input: HTMLInputElement | null = null;
let listEl: HTMLElement | null = null;
let items: PaletteItem[] = [];
let ranked: Ranked[] = [];
let activeIndex = 0;
let open = false;
let lastFocus: HTMLElement | null = null;
let bound = false;

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

/** Subsequence fuzzy match with gap / boundary bonuses. */
export function fuzzyMatch(query: string, text: string): { score: number; indices: number[] } | null {
  const q = normalize(query.trim());
  const t = normalize(text);
  if (!q) return { score: 0, indices: [] };
  if (!t) return null;

  let ti = 0;
  let score = 0;
  let prev = -2;
  const indices: number[] = [];

  for (let qi = 0; qi < q.length; qi += 1) {
    const ch = q[qi];
    let found = -1;
    for (let i = ti; i < t.length; i += 1) {
      if (t[i] === ch) {
        found = i;
        break;
      }
    }
    if (found < 0) return null;
    indices.push(found);
    score += 2;
    if (found === prev + 1) score += 4;
    if (found === 0 || /\s|-|_|\./.test(t[found - 1] ?? '')) score += 3;
    prev = found;
    ti = found + 1;
  }
  score -= t.length * 0.01;
  return { score, indices };
}

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string): void {
  const next = [id, ...readRecent().filter((x) => x !== id)].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlight(title: string, indices: number[]): string {
  if (!indices.length) return escapeHtml(title);
  const set = new Set(indices);
  let out = '';
  for (let i = 0; i < title.length; i += 1) {
    const ch = escapeHtml(title[i] ?? '');
    out += set.has(i) ? `<mark>${ch}</mark>` : ch;
  }
  return out;
}

function groupLabel(type: PaletteItem['type']): string {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
  if (type === 'page') return lang === 'en' ? 'Pages' : 'Страницы';
  if (type === 'project') return lang === 'en' ? 'Projects' : 'Проекты';
  return lang === 'en' ? 'Actions' : 'Действия';
}

function typeOrder(type: PaletteItem['type']): number {
  if (type === 'page') return 0;
  if (type === 'project') return 1;
  return 2;
}

function rankItems(query: string): Ranked[] {
  const recent = readRecent();
  const q = query.trim();
  const out: Ranked[] = [];

  for (const item of items) {
    const hay = `${item.title} ${item.hint ?? ''} ${item.keywords}`;
    if (!q) {
      const recentBoost = recent.indexOf(item.id);
      out.push({
        ...item,
        score: recentBoost >= 0 ? 1000 - recentBoost : 0,
        indices: [],
      });
      continue;
    }
    const match = fuzzyMatch(q, hay);
    if (!match) continue;
    const titleMatch = fuzzyMatch(q, item.title);
    out.push({
      ...item,
      score: match.score + (titleMatch ? 8 : 0),
      indices: titleMatch?.indices ?? [],
    });
  }

  out.sort((a, b) => {
    if (!q) {
      const typeDiff = typeOrder(a.type) - typeOrder(b.type);
      if (typeDiff !== 0) return typeDiff;
      if (b.score !== a.score) return b.score - a.score;
      return a.title.localeCompare(b.title, 'ru');
    }
    return b.score - a.score || a.title.localeCompare(b.title, 'ru');
  });
  return out.slice(0, 24);
}

function renderList(): void {
  if (!listEl || !input) return;
  ranked = rankItems(input.value);
  activeIndex = ranked.length ? Math.min(activeIndex, ranked.length - 1) : 0;

  if (!ranked.length) {
    const empty =
      document.documentElement.lang === 'en'
        ? 'No matches. Try another word.'
        : 'Ничего не нашлось. Попробуй другое слово.';
    listEl.innerHTML = `<p class="cmdk__empty" role="status">${empty}</p>`;
    input.setAttribute('aria-activedescendant', '');
    return;
  }

  let html = '';
  let lastType = '';
  ranked.forEach((item, index) => {
    if (item.type !== lastType) {
      lastType = item.type;
      html += `<p class="cmdk__group" role="presentation">${groupLabel(item.type)}</p>`;
    }
    const id = `cmdk-opt-${index}`;
    const selected = index === activeIndex ? 'true' : 'false';
    let title = item.title;
    if (item.action === 'less-motion') {
      const lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
      title = isLessMotionToggleOn()
        ? lang === 'en'
          ? 'Animations reduced'
          : 'Анимации урезаны'
        : lang === 'en'
          ? 'Fewer animations'
          : 'Меньше анимаций';
    }
    html += `<button type="button" class="cmdk__option" role="option" id="${id}" data-index="${index}" aria-selected="${selected}">
      <span class="cmdk__option-title">${highlight(title, item.indices)}</span>
      ${item.hint ? `<span class="cmdk__option-hint mono">${escapeHtml(item.hint)}</span>` : ''}
    </button>`;
  });
  listEl.innerHTML = html;
  input.setAttribute('aria-activedescendant', ranked[activeIndex] ? `cmdk-opt-${activeIndex}` : '');
}

function setActive(next: number): void {
  if (!ranked.length) return;
  activeIndex = (next + ranked.length) % ranked.length;
  renderList();
  listEl?.querySelector(`#cmdk-opt-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
}

function switchLocale(): void {
  const path = location.pathname;
  if (path === '/en' || path.startsWith('/en/')) {
    const bare = path.replace(/^\/en/, '') || '/';
    location.href = bare.endsWith('/') ? bare : `${bare}/`;
    return;
  }
  const next = path === '/' ? '/en/' : `/en${path}`;
  location.href = next.endsWith('/') ? next : `${next}/`;
}

async function runItem(item: PaletteItem): Promise<void> {
  pushRecent(item.id);
  closePalette();

  if (item.action === 'theme') {
    toggleTheme();
    return;
  }
  if (item.action === 'less-motion') {
    toggleLessMotion();
    return;
  }
  if (item.action === 'copy-email') {
    const email = item.hint;
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      window.prompt('Скопируй почту:', email);
    }
    return;
  }
  if (item.action === 'locale') {
    switchLocale();
    return;
  }
  if (!item.href) return;

  if (
    item.action === 'telegram' ||
    item.action === 'telegram-channel' ||
    item.action === 'github' ||
    item.action === 'open-gran' ||
    item.action === 'open-zerno' ||
    item.action === 'open-pingo' ||
    item.action === 'resume'
  ) {
    if (item.action === 'telegram-channel') {
      const { goal } = await import('./metrika');
      goal('tg_channel_click', { from: 'cmdk' });
    }
    window.open(item.href, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const { navigate } = await import('astro:transitions/client');
    await navigate(item.href);
  } catch {
    location.href = item.href;
  }
}

function getFocusable(): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

function onKeyDown(event: KeyboardEvent): void {
  const metaK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
  if (metaK) {
    event.preventDefault();
    if (open) closePalette();
    else openPalette();
    return;
  }

  if (!open) {
    if (
      event.key === '/' &&
      !(event.target instanceof HTMLInputElement) &&
      !(event.target instanceof HTMLTextAreaElement) &&
      !(event.target instanceof HTMLElement && event.target.isContentEditable)
    ) {
      event.preventDefault();
      openPalette();
    }
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closePalette();
    return;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActive(activeIndex + 1);
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    setActive(activeIndex - 1);
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    const item = ranked[activeIndex];
    if (item) void runItem(item);
    return;
  }
  if (event.key === 'Tab' && root) {
    const focusable = getFocusable();
    if (focusable.length < 2) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

export function openPalette(): void {
  if (!root || !input) return;
  open = true;
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  root.hidden = false;
  root.dataset.open = 'true';
  document.documentElement.dataset.cmdkOpen = 'true';
  input.setAttribute('aria-expanded', 'true');
  activeIndex = 0;
  input.value = '';
  renderList();
  window.requestAnimationFrame(() => input?.focus());
}

export function closePalette(): void {
  if (!root) return;
  open = false;
  root.dataset.open = 'false';
  root.hidden = true;
  delete document.documentElement.dataset.cmdkOpen;
  input?.setAttribute('aria-expanded', 'false');
  lastFocus?.focus();
  lastFocus = null;
}

function onListClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const option = target.closest<HTMLElement>('.cmdk__option');
  if (!option) return;
  const index = Number(option.dataset.index);
  const item = ranked[index];
  if (item) void runItem(item);
}

function onBackdropPointer(event: PointerEvent): void {
  if (event.target === root) closePalette();
}

function onOpenClick(event: Event): void {
  event.preventDefault();
  openPalette();
}

export function mountCommandPalette(host: HTMLElement, catalog: PaletteItem[]): void {
  root = host;
  input = host.querySelector<HTMLInputElement>('[data-cmdk-input]');
  listEl = host.querySelector<HTMLElement>('[data-cmdk-list]');
  items = catalog;
  if (!input || !listEl) return;

  if (host.dataset.cmdkReady === 'true') return;
  host.dataset.cmdkReady = 'true';

  if (!bound) {
    bound = true;
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-cmdk-open]')) onOpenClick(event);
    });
  }

  input.oninput = () => {
    activeIndex = 0;
    renderList();
  };
  listEl.onclick = onListClick;
  root.onpointerdown = onBackdropPointer;
  root.querySelectorAll('[data-cmdk-close]').forEach((el) => {
    el.addEventListener('click', () => closePalette());
  });
}
