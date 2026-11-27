import { demoLocale, demoProjectLabel, shipcrewCopy } from '../../i18n/demo-copy';
import { button, clear, el, wait, wantSameCta } from './shared';

export function mountShipcrewDemo(root: HTMLElement): () => void {
  clear(root);
  const locale = demoLocale();
  const t = shipcrewCopy(locale);
  const projectLabel = demoProjectLabel[locale].shipcrew;

  const ui = el('div', 'demo-ui');
  const controls = el('div', 'demo-ui__row');
  const runBtn = button(t.run, { primary: true });
  const againBtn = button(t.again);
  againBtn.disabled = true;
  controls.append(runBtn, againBtn);

  const logPanel = el('div', 'demo-ui__panel');
  logPanel.append(el('p', 'demo-ui__label', t.logLabel));
  const log = el('pre', 'demo-ui__log', t.idle);
  logPanel.append(log);

  const roles = el('ul', 'demo-ui__list');
  let playing = false;
  let disposed = false;

  const renderRoles = (active = -1, done = -1): void => {
    clear(roles);
    t.steps.forEach((step, index) => {
      const item = el('li', 'demo-ui__item');
      const left = el('div');
      left.append(el('div', '', step.title), el('span', 'demo-ui__meta', step.role));
      let label: string = t.waiting;
      let tone = 'warn';
      if (index < done || (done === t.steps.length && index < t.steps.length)) {
        label = t.done;
        tone = 'ok';
      } else if (index === active) {
        label = t.working;
        tone = 'warn';
      }
      const status = el('span', 'demo-ui__status', label);
      status.dataset.tone = tone;
      item.append(left, status);
      roles.append(item);
    });
  };

  const appendLog = (line: string): void => {
    if (log.textContent === t.idle) log.textContent = '';
    log.textContent += `${line}\n`;
    log.scrollTop = log.scrollHeight;
  };

  const play = async (): Promise<void> => {
    if (playing || disposed) return;
    playing = true;
    runBtn.disabled = true;
    againBtn.disabled = true;
    log.textContent = '';
    appendLog(t.started);
    for (let i = 0; i < t.steps.length; i++) {
      if (disposed) return;
      const step = t.steps[i];
      renderRoles(i, i);
      appendLog(step.logStart);
      await wait(550);
      appendLog(step.logDone);
      if (step.role === 'reviewer') appendLog(t.reviewOk);
      renderRoles(i + 1, i + 1);
      await wait(220);
    }
    appendLog(t.finished);
    renderRoles(-1, t.steps.length);
    playing = false;
    againBtn.disabled = false;
  };

  runBtn.addEventListener('click', () => {
    void play();
  });
  againBtn.addEventListener('click', () => {
    void play();
  });

  const footer = el('div', 'demo-ui__footer');
  footer.append(wantSameCta(projectLabel));

  ui.append(controls, roles, logPanel, footer);
  root.append(ui);
  renderRoles();
  return () => {
    disposed = true;
    clear(root);
  };
}
