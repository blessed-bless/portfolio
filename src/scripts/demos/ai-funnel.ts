import { aiFunnelCopy, demoLocale, demoProjectLabel } from '../../i18n/demo-copy';
import { button, clear, el, wait, wantSameCta } from './shared';

export function mountAiFunnelDemo(root: HTMLElement): () => void {
  clear(root);
  const locale = demoLocale();
  const t = aiFunnelCopy(locale);
  const projectLabel = demoProjectLabel[locale].aiFunnel;

  type LeadStatus = (typeof t.statuses)[number];
  type Lead = {
    id: string;
    name: string;
    source: string;
    need: string;
    tags: string[];
    status: LeadStatus;
  };

  const ui = el('div', 'demo-ui');

  const landing = el('div', 'demo-ui__panel');
  landing.append(el('p', 'demo-ui__label', t.landing));
  landing.append(el('p', '', t.landingText));
  const start = button(t.leaveLead, { primary: true });
  landing.append(start);

  const chatPanel = el('div', 'demo-ui__panel');
  chatPanel.append(el('p', 'demo-ui__label', t.chatLabel));
  const chat = el('div', 'demo-ui__chat');
  const nextBtn = button(t.nextLine);
  nextBtn.disabled = true;
  chatPanel.append(chat, nextBtn);

  const crm = el('div', 'demo-ui__panel');
  crm.append(el('p', 'demo-ui__label', t.crm));
  const leadsList = el('ul', 'demo-ui__list');
  crm.append(leadsList);

  let step = -1;
  let lead: Lead | null = null;

  const renderCrm = (): void => {
    clear(leadsList);
    if (!lead) {
      leadsList.append(el('li', 'demo-ui__meta', t.noLeads));
      return;
    }
    const item = el('li', 'demo-ui__item');
    const left = el('div');
    left.append(
      el('div', '', `${lead.name} · ${lead.need}`),
      el('span', 'demo-ui__meta', `${lead.source} · ${lead.tags.join(', ')}`),
    );
    const statusWrap = el('div', 'demo-ui__row');
    for (const status of t.statuses) {
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
      name: t.lead.name,
      source: t.lead.source,
      need: t.lead.need,
      tags: [...t.lead.tags],
      status: t.lead.statusNew,
    };
    renderCrm();
    await wait(200);
    nextBtn.disabled = false;
    step = 0;
    pushBubble(t.script[0].from, t.script[0].text);
  });

  nextBtn.addEventListener('click', async () => {
    if (step < 0 || step >= t.script.length - 1) return;
    nextBtn.disabled = true;
    step += 1;
    const line = t.script[step];
    await wait(260);
    pushBubble(line.from, line.text);
    if (step === t.script.length - 1 && lead) {
      lead.tags = [...t.lead.qualifiedTags];
      lead.status = t.lead.statusQualified;
      lead.need = t.lead.qualifiedNeed;
      renderCrm();
      nextBtn.textContent = t.done;
      return;
    }
    nextBtn.disabled = false;
  });

  const footer = el('div', 'demo-ui__footer');
  footer.append(wantSameCta(projectLabel));

  ui.append(landing, chatPanel, crm, footer);
  root.append(ui);
  renderCrm();
  return () => clear(root);
}
