import { button, clear, el, wait, wantSameCta } from './shared';

const SERVICES = [
  { id: 'change', title: 'Сезонная смена', minutes: 40 },
  { id: 'balance', title: 'Балансировка', minutes: 30 },
  { id: 'repair', title: 'Ремонт прокола', minutes: 25 },
] as const;

type Slot = { id: string; day: string; time: string; free: boolean };
type Visit = { id: string; service: string; slot: string };

function buildWeekSlots(): Slot[] {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const times = ['10:00', '11:30', '13:00', '15:00', '17:00'];
  const slots: Slot[] = [];
  let n = 0;
  for (const day of days) {
    for (const time of times) {
      n += 1;
      slots.push({
        id: `${day}-${time}`,
        day,
        time,
        free: n % 4 !== 0,
      });
    }
  }
  return slots;
}

export function mountPriemnayaDemo(root: HTMLElement): () => void {
  clear(root);
  const ui = el('div', 'demo-ui');
  const serviceRow = el('div', 'demo-ui__row');
  serviceRow.append(el('p', 'demo-ui__label', 'Услуга'));
  const slotPanel = el('div', 'demo-ui__panel');
  slotPanel.append(el('p', 'demo-ui__label', 'Свободные слоты на неделю'));
  const slotList = el('div', 'demo-ui__row');
  const schedule = el('div', 'demo-ui__panel');
  schedule.append(el('p', 'demo-ui__label', 'Расписание мастера'));
  const visitList = el('ul', 'demo-ui__list');
  schedule.append(visitList);
  const note = el('p', 'demo-ui__meta', 'Выберите услугу и свободное окно — запись появится в календаре.');

  let serviceId = SERVICES[0].id;
  let slots = buildWeekSlots();
  const visits: Visit[] = [];

  const renderVisits = (): void => {
    clear(visitList);
    if (!visits.length) {
      visitList.append(el('li', 'demo-ui__meta', 'Пока пусто — подтвердите слот.'));
      return;
    }
    for (const visit of visits) {
      const item = el('li', 'demo-ui__item');
      const service = SERVICES.find((s) => s.id === visit.service);
      item.append(
        el('span', '', `${service?.title ?? visit.service} · ${visit.slot}`),
        el('span', 'demo-ui__status', 'подтверждено'),
      );
      item.querySelector('.demo-ui__status')?.setAttribute('data-tone', 'ok');
      visitList.append(item);
    }
  };

  const renderSlots = (): void => {
    clear(slotList);
    const free = slots.filter((s) => s.free);
    for (const slot of free.slice(0, 10)) {
      const btn = button(`${slot.day} ${slot.time}`);
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        await wait(280);
        slots = slots.map((s) => (s.id === slot.id ? { ...s, free: false } : s));
        visits.unshift({
          id: `v-${Date.now()}`,
          service: serviceId,
          slot: `${slot.day} ${slot.time}`,
        });
        renderSlots();
        renderVisits();
        note.textContent = 'Запись в расписании. Повтор на тот же слот недоступен.';
      });
      slotList.append(btn);
    }
    if (!free.length) slotList.append(el('span', 'demo-ui__meta', 'На этой неделе свободных окон нет.'));
  };

  for (const service of SERVICES) {
    const btn = button(service.title, { pressed: service.id === serviceId });
    btn.addEventListener('click', () => {
      serviceId = service.id;
      for (const child of serviceRow.querySelectorAll('button')) {
        child.setAttribute('aria-pressed', String(child === btn));
        child.classList.toggle('is-active', child === btn);
      }
      note.textContent = `${service.title} · ${service.minutes} мин с буфером поста.`;
    });
    if (service.id === serviceId) btn.classList.add('is-active');
    serviceRow.append(btn);
  }

  slotPanel.append(slotList);
  const footer = el('div', 'demo-ui__footer');
  footer.append(wantSameCta('Приёмная'));

  ui.append(serviceRow, slotPanel, schedule, note, footer);
  root.append(ui);
  renderSlots();
  renderVisits();
  return () => clear(root);
}
