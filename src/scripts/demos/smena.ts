import { demoLocale, demoProjectLabel, smenaCopy } from '../../i18n/demo-copy';
import { button, clear, el, wait, wantSameCta } from './shared';

type VisitStatus = 'confirmed' | 'arrived' | 'done' | 'noshow';

type Visit = {
  id: string;
  time: string;
  duration: number;
  name: string;
  service: string;
  status: VisitStatus;
};

type Settings = {
  start: string;
  end: string;
  workdays: number[];
};

function mins(t: string): number {
  return Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
}

function hhmm(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function isActive(r: Visit): boolean {
  return r.status !== 'noshow';
}

/** Same idea as shared.mjs freeGaps — busy blocks carve free windows out of the workday. */
function freeGaps(
  records: Visit[],
  settings: Settings,
  from = 0,
  minGap = 15,
): Array<[number, number]> {
  const end = mins(settings.end);
  const out: Array<[number, number]> = [];
  let scanAt = Math.max(mins(settings.start), from);
  const busy = records.filter(isActive).sort((a, b) => a.time.localeCompare(b.time));
  for (const r of busy) {
    const start = Math.min(mins(r.time), end);
    if (start - scanAt >= minGap) out.push([scanAt, start]);
    scanAt = Math.max(scanAt, mins(r.time) + r.duration);
  }
  if (end - scanAt >= minGap) out.push([scanAt, end]);
  return out;
}

const settings: Settings = { start: '10:00', end: '19:00', workdays: [0, 1, 2, 3, 4, 5, 6] };

export function mountSmenaDemo(root: HTMLElement): () => void {
  clear(root);
  const locale = demoLocale();
  const t = smenaCopy(locale);
  const projectLabel = demoProjectLabel[locale].smena;

  const ui = el('div', 'demo-ui smena-demo');
  const tip = el('p', 'smena-demo__tip', t.tip);
  tip.dataset.demoTip = 'true';
  const phone = el('div', 'smena-demo__phone');
  const chrome = el('div', 'smena-demo__chrome');
  chrome.append(el('span', 'smena-demo__dot'), el('p', 'smena-demo__title', t.title));
  const day = el('div', 'smena-demo__day');
  const rail = el('div', 'smena-demo__rail');
  const board = el('div', 'smena-demo__board');
  const actions = el('div', 'demo-ui__row smena-demo__actions');
  const note = el('p', 'demo-ui__meta', t.hint);
  note.setAttribute('role', 'status');
  const share = el('pre', 'smena-demo__share');
  share.hidden = true;

  let records: Visit[] = t.seed.map((r) => ({ ...r }));
  let selectedId: string | null = records.find((r) => r.status === 'confirmed')?.id ?? null;
  let tipVisible = true;

  const hideTip = (): void => {
    if (!tipVisible) return;
    tipVisible = false;
    tip.hidden = true;
  };

  const render = (): void => {
    clear(rail);
    clear(board);
    for (let h = 10; h <= 19; h += 1) {
      rail.append(el('span', 'smena-demo__hour', `${h}:00`));
    }

    const targets: Array<{ start: number; button: HTMLButtonElement }> = [];
    const gaps = freeGaps(records, settings);
    for (const [start, end] of gaps) {
      const slot = el('button', 'smena-demo__gap', `${hhmm(start)}–${hhmm(end)}`);
      slot.type = 'button';
      if (records.some((visit) => !isActive(visit) && mins(visit.time) < end && mins(visit.time) + visit.duration > start)) {
        slot.dataset.overlapsVisit = 'true';
      }
      slot.style.top = `${((start - 600) / 540) * 100}%`;
      slot.style.height = `${((end - start) / 540) * 100}%`;
      slot.addEventListener('click', async () => {
        hideTip();
        slot.disabled = true;
        await wait(200);
        const id = `n-${Date.now()}`;
        records = [
          ...records,
          {
            id,
            time: hhmm(start),
            duration: Math.min(60, end - start),
            name: t.newClient,
            service: t.haircut,
            status: 'confirmed',
          },
        ];
        selectedId = id;
        note.textContent = t.bookedAt(hhmm(start));
        share.hidden = true;
        render();
        board.querySelector<HTMLElement>(`[data-visit-id="${id}"]`)?.focus({ preventScroll: true });
      });
      targets.push({ start, button: slot });
    }

    for (const r of records) {
      const card = el('button', 'smena-demo__visit');
      card.type = 'button';
      card.style.top = `${((mins(r.time) - 600) / 540) * 100}%`;
      card.style.height = `${(r.duration / 540) * 100}%`;
      card.dataset.status = r.status;
      if (!isActive(r) && gaps.some(([start, end]) => mins(r.time) < end && mins(r.time) + r.duration > start)) {
        card.dataset.overlapsGap = 'true';
      }
      card.dataset.visitId = r.id;
      card.setAttribute('aria-pressed', String(r.id === selectedId));
      card.append(
        el('strong', '', r.name),
        el('span', '', `${r.time} · ${r.service}`),
        el('em', '', t.status[r.status]),
      );
      card.addEventListener('click', () => {
        hideTip();
        selectedId = r.id;
        note.textContent = t.selectedNote(r.name, t.status[r.status]);
        render();
        board.querySelector<HTMLElement>(`[data-visit-id="${r.id}"]`)?.focus({ preventScroll: true });
      });
      targets.push({ start: mins(r.time), button: card });
    }

    board.append(...targets.sort((a, b) => a.start - b.start).map((target) => target.button));

    clear(actions);
    const selected = records.find((r) => r.id === selectedId);
    for (const status of ['arrived', 'done', 'noshow'] as const) {
      const btn = button(t.statusBtn[status], { pressed: selected?.status === status });
      btn.disabled = !selected || selected.status === 'done';
      btn.addEventListener('click', async () => {
        if (!selected) return;
        hideTip();
        await wait(120);
        records = records.map((r) => (r.id === selected.id ? { ...r, status } : r));
        note.textContent = t.statusChanged(selected.name, t.status[status]);
        share.hidden = true;
        render();
      });
      actions.append(btn);
    }

    const shareBtn = button(t.shareWindows, { primary: true });
    shareBtn.addEventListener('click', () => {
      hideTip();
      const lines = freeGaps(records, settings)
        .map(([s, e]) => `• ${hhmm(s)}–${hhmm(e)}`)
        .join('\n');
      share.hidden = false;
      share.textContent = t.shareText(lines);
      note.textContent = t.shareNote;
    });
    actions.append(shareBtn);
  };

  day.append(rail, board);
  phone.append(chrome, day, actions, share, note, wantSameCta(projectLabel));
  ui.append(tip, phone);
  root.append(ui);
  render();

  return () => clear(root);
}
