import {button, clear, el, wait, wantSameCta} from './shared';

type Visit = {
  id: string;
  time: string;
  duration: number;
  name: string;
  service: string;
  status: 'confirmed' | 'arrived' | 'done' | 'noshow';
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

const seed: Visit[] = [
  {id: '1', time: '10:00', duration: 60, name: 'Алексей М.', service: 'Мужская стрижка', status: 'done'},
  {id: '2', time: '11:30', duration: 90, name: 'Дмитрий В.', service: 'Стрижка и борода', status: 'confirmed'},
  {id: '3', time: '14:00', duration: 60, name: 'Михаил С.', service: 'Мужская стрижка', status: 'confirmed'},
  {id: '4', time: '16:30', duration: 30, name: 'Артём Б.', service: 'Оформление бороды', status: 'confirmed'},
];

const settings: Settings = {start: '10:00', end: '19:00', workdays: [0, 1, 2, 3, 4, 5, 6]};

export function mountSmenaDemo(root: HTMLElement): () => void {
  clear(root);
  const ui = el('div', 'demo-ui smena-demo');
  const phone = el('div', 'smena-demo__phone');
  const chrome = el('div', 'smena-demo__chrome');
  chrome.append(el('span', 'smena-demo__dot'), el('p', 'smena-demo__title', 'Смена · сегодня'));
  const day = el('div', 'smena-demo__day');
  const rail = el('div', 'smena-demo__rail');
  const board = el('div', 'smena-demo__board');
  const actions = el('div', 'demo-ui__row smena-demo__actions');
  const note = el('p', 'demo-ui__meta', 'Тап по свободному окну — запись. Статусы и «Поделиться окнами» без сети.');
  const share = el('pre', 'smena-demo__share');
  share.hidden = true;

  let records = seed.map((r) => ({...r}));
  let selectedId: string | null = records.find((r) => r.status === 'confirmed')?.id ?? null;

  const statusLabel: Record<Visit['status'], string> = {
    confirmed: 'ожидает',
    arrived: 'пришёл',
    done: 'завершён',
    noshow: 'не пришёл',
  };

  const render = (): void => {
    clear(rail);
    clear(board);
    for (let h = 10; h <= 19; h += 1) {
      rail.append(el('span', 'smena-demo__hour', `${h}:00`));
    }

    const gaps = freeGaps(records, settings);
    for (const [start, end] of gaps) {
      const slot = button(`${hhmm(start)}–${hhmm(end)}`);
      slot.classList.add('smena-demo__gap');
      slot.style.top = `${((start - 600) / 540) * 100}%`;
      slot.style.height = `${((end - start) / 540) * 100}%`;
      slot.addEventListener('click', async () => {
        slot.disabled = true;
        await wait(200);
        const id = `n-${Date.now()}`;
        records = [
          ...records,
          {
            id,
            time: hhmm(start),
            duration: Math.min(60, end - start),
            name: 'Новый клиент',
            service: 'Мужская стрижка',
            status: 'confirmed',
          },
        ];
        selectedId = id;
        note.textContent = `Запись на ${hhmm(start)}. Свободные окна пересчитаны.`;
        share.hidden = true;
        render();
      });
      board.append(slot);
    }

    for (const r of records) {
      const card = el('button', 'smena-demo__visit');
      card.type = 'button';
      card.style.top = `${((mins(r.time) - 600) / 540) * 100}%`;
      card.style.height = `${(r.duration / 540) * 100}%`;
      card.dataset.status = r.status;
      card.setAttribute('aria-pressed', String(r.id === selectedId));
      card.append(
        el('strong', '', r.name),
        el('span', '', `${r.time} · ${r.service}`),
        el('em', '', statusLabel[r.status]),
      );
      card.addEventListener('click', () => {
        selectedId = r.id;
        note.textContent = `${r.name}: ${statusLabel[r.status]}.`;
        render();
      });
      board.append(card);
    }

    clear(actions);
    const selected = records.find((r) => r.id === selectedId);
    for (const [status, label] of [
      ['arrived', 'Пришёл'],
      ['done', 'Завершён'],
      ['noshow', 'Не пришёл'],
    ] as const) {
      const btn = button(label, {pressed: selected?.status === status});
      btn.disabled = !selected || selected.status === 'done';
      btn.addEventListener('click', async () => {
        if (!selected) return;
        await wait(120);
        records = records.map((r) => (r.id === selected.id ? {...r, status} : r));
        note.textContent = `${selected.name} → ${statusLabel[status]}.`;
        share.hidden = true;
        render();
      });
      actions.append(btn);
    }

    const shareBtn = button('Поделиться окнами', {primary: true});
    shareBtn.addEventListener('click', () => {
      const lines = freeGaps(records, settings)
        .map(([s, e]) => `• ${hhmm(s)}–${hhmm(e)}`)
        .join('\n');
      share.hidden = false;
      share.textContent = `Свободно сегодня:\n${lines || '• окон нет'}\n\nНапишите, какое время удобно.`;
      note.textContent = 'Текст для клиента — можно скопировать из блока ниже.';
    });
    actions.append(shareBtn);
  };

  day.append(rail, board);
  phone.append(chrome, day, actions, share, note, wantSameCta('Смена'));
  ui.append(phone);
  root.append(ui);
  render();

  return () => clear(root);
}
