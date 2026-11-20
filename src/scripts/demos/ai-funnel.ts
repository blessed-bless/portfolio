import { button, clear, el, wait, wantSameCta } from './shared';

type LeadStatus = 'новый' | 'квалифицирован' | 'сделка' | 'отказ';

type Lead = {
  id: string;
  name: string;
  source: string;
  need: string;
  tags: string[];
  status: LeadStatus;
};

const SCRIPT: Array<{ from: 'bot' | 'user'; text: string }> = [
  { from: 'bot', text: 'Привет! Чем помочь — сайт, бот или автоматизация заявок?' },
  { from: 'user', text: 'Нужен бот для записи клиентов.' },
  { from: 'bot', text: 'Понял. Какой бюджетный ориентир — до 50к, 50–150к или выше?' },
  { from: 'user', text: '50–150к, старт в этом месяце.' },
  { from: 'bot', text: 'Ок. Передам менеджеру — в CRM появится лид с тегами bot и booking.' },
];

const STATUSES: LeadStatus[] = ['новый', 'квалифицирован', 'сделка', 'отказ'];

export function mountAiFunnelDemo(root: HTMLElement): () => void {
  clear(root);
  const ui = el('div', 'demo-ui');

  const landing = el('div', 'demo-ui__panel');
  landing.append(el('p', 'demo-ui__label', 'Лендинг'));
  landing.append(el('p', '', 'Оставьте заявку — бот уточнит задачу в чате.'));
  const start = button('Оставить заявку', { primary: true });
  landing.append(start);

  const chatPanel = el('div', 'demo-ui__panel');
  chatPanel.append(el('p', 'demo-ui__label', 'Telegram AI-бот'));
  const chat = el('div', 'demo-ui__chat');
  const nextBtn = button('Следующая реплика');
  nextBtn.disabled = true;
  chatPanel.append(chat, nextBtn);

  const crm = el('div', 'demo-ui__panel');
  crm.append(el('p', 'demo-ui__label', 'Мини-CRM'));
  const leadsList = el('ul', 'demo-ui__list');
  crm.append(leadsList);

  let step = -1;
  let lead: Lead | null = null;

  const renderCrm = (): void => {
    clear(leadsList);
    if (!lead) {
      leadsList.append(el('li', 'demo-ui__meta', 'Лидов пока нет.'));
      return;
    }
    const item = el('li', 'demo-ui__item');
    const left = el('div');
    left.append(
      el('div', '', `${lead.name} · ${lead.need}`),
      el('span', 'demo-ui__meta', `${lead.source} · ${lead.tags.join(', ')}`),
    );
    const statusWrap = el('div', 'demo-ui__row');
    for (const status of STATUSES) {
      const btn = button(status, { pressed: lead.status === status });
      if (lead.status === status) btn.classList.add('is-active');
      btn.addEventListener('click', () => {
        if (!lead) return;
        lead.status = status;
        renderCrm();
      });
      statusWrap.append(btn);
    }
    item.append(left, statusWrap);
    leadsList.append(item);
  };

  const pushBubble = (from: 'bot' | 'user', text: string): void => {
    const bubble = el('div', 'demo-ui__bubble', text);
    bubble.dataset.from = from;
    chat.append(bubble);
    chat.scrollTop = chat.scrollHeight;
  };

  start.addEventListener('click', async () => {
    start.disabled = true;
    clear(chat);
    step = -1;
    lead = {
      id: 'lead-1',
      name: 'Анна К.',
      source: 'лендинг',
      need: 'бот для записи',
      tags: ['лендинг'],
      status: 'новый',
    };
    renderCrm();
    await wait(200);
    nextBtn.disabled = false;
    step = 0;
    pushBubble(SCRIPT[0].from, SCRIPT[0].text);
  });

  nextBtn.addEventListener('click', async () => {
    if (step < 0 || step >= SCRIPT.length - 1) return;
    nextBtn.disabled = true;
    step += 1;
    const line = SCRIPT[step];
    await wait(260);
    pushBubble(line.from, line.text);
    if (step === SCRIPT.length - 1 && lead) {
      lead.tags = ['лендинг', 'бот', 'запись'];
      lead.status = 'квалифицирован';
      lead.need = 'бот для записи · бюджет 50–150к';
      renderCrm();
      nextBtn.textContent = 'Сценарий завершён';
      return;
    }
    nextBtn.disabled = false;
  });

  const footer = el('div', 'demo-ui__footer');
  footer.append(wantSameCta('AI Funnel Ecosystem'));

  ui.append(landing, chatPanel, crm, footer);
  root.append(ui);
  renderCrm();
  return () => clear(root);
}
