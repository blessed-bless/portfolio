import { demoLocale, demoProjectLabel, priemnayaCopy } from '../../i18n/demo-copy';
import { button, clear, el, wait, wantSameCta } from './shared';

type Slot = { id: string; day: string; time: string; free: boolean };
type Visit = { id: string; service: string; slot: string };

function buildWeekSlots(days: readonly string[]): Slot[] {
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
  const locale = demoLocale();
  const t = priemnayaCopy(locale);
  const label = demoProjectLabel[locale].priemnaya;

  const ui = el('div', 'demo-ui');
  const serviceRow = el('div', 'demo-ui__row');
  serviceRow.append(el('p', 'demo-ui__label', t.serviceLabel));
  const slotPanel = el('div', 'demo-ui__panel');
  slotPanel.append(el('p', 'demo-ui__label', t.slotsLabel));
  const slotList = el('div', 'demo-ui__row');
  const schedule = el('div', 'demo-ui__panel');
  schedule.append(el('p', 'demo-ui__label', t.scheduleLabel));
  const visitList = el('ul', 'demo-ui__list');
  schedule.append(visitList);
  const note = el('p', 'demo-ui__meta', t.hint);

  let serviceId = t.services[0].id;
  let slots = buildWeekSlots(t.days);
  const visits: Visit[] = [];

  const renderVisits = (): void => {
    clear(visitList);
    if (!visits.length) {
      visitList.append(el('li', 'demo-ui__meta', t.emptyVisits));
      return;
    }
    for (const visit of visits) {
      const item = el('li', 'demo-ui__item');
      const service = t.services.find((s) => s.id === visit.service);
      item.append(
        el('span', '', `${service?.title ?? visit.service} · ${visit.slot}`),
        el('span', 'demo-ui__status', t.confirmed),
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
        note.textContent = t.booked;
      });
      slotList.append(btn);
    }
    if (!free.length) slotList.append(el('span', 'demo-ui__meta', t.noSlots));
  };

  for (const service of t.services) {
    const btn = button(service.title, { pressed: service.id === serviceId });
    btn.addEventListener('click', () => {
      serviceId = service.id;
      for (const child of serviceRow.querySelectorAll('button')) {
        child.setAttribute('aria-pressed', String(child === btn));
        child.classList.toggle('is-active', child === btn);
      }
      note.textContent = t.withBuffer(service.title, service.minutes);
    });
    if (service.id === serviceId) btn.classList.add('is-active');
    serviceRow.append(btn);
  }

  slotPanel.append(slotList);
  const footer = el('div', 'demo-ui__footer');
  footer.append(wantSameCta(label));

  ui.append(serviceRow, slotPanel, schedule, note, footer);
  root.append(ui);
  renderSlots();
  renderVisits();
  return () => clear(root);
}
