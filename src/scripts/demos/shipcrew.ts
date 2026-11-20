import { button, clear, el, wait } from './shared';

const PIPELINE = [
  {
    role: 'pm',
    title: 'PM',
    summary: 'Собрал бриф: API gateway + агенты с общим blackboard.',
  },
  {
    role: 'architect',
    title: 'Architect',
    summary: 'Наметил FastAPI + React UI + zip ship bundle.',
  },
  {
    role: 'engineer',
    title: 'Engineer',
    summary: 'Сгенерировал код сервисов и каркас фронта.',
  },
  {
    role: 'reviewer',
    title: 'Reviewer',
    summary: 'approved=true, required_fixes=[].',
  },
  {
    role: 'devops',
    title: 'DevOps',
    summary: 'Собрал prod zip и проверил /api/health.',
  },
] as const;

export function mountShipcrewDemo(root: HTMLElement): () => void {
  clear(root);
  const ui = el('div', 'demo-ui');
  const controls = el('div', 'demo-ui__row');
  const runBtn = button('Запустить миссию', { primary: true });
  const againBtn = button('Запустить снова');
  againBtn.disabled = true;
  controls.append(runBtn, againBtn);

  const logPanel = el('div', 'demo-ui__panel');
  logPanel.append(el('p', 'demo-ui__label', 'Event log'));
  const log = el('pre', 'demo-ui__log', 'Нажмите «Запустить миссию».');
  logPanel.append(log);

  const roles = el('ul', 'demo-ui__list');
  let playing = false;
  let disposed = false;

  const renderRoles = (active = -1, done = -1): void => {
    clear(roles);
    PIPELINE.forEach((step, index) => {
      const item = el('li', 'demo-ui__item');
      const left = el('div');
      left.append(el('div', '', step.title), el('span', 'demo-ui__meta', step.role));
      let label = 'waiting';
      let tone = 'warn';
      if (index < done || (done === PIPELINE.length && index < PIPELINE.length)) {
        label = 'finished';
        tone = 'ok';
      } else if (index === active) {
        label = 'running';
        tone = 'warn';
      }
      const status = el('span', 'demo-ui__status', label);
      status.dataset.tone = tone;
      item.append(left, status);
      roles.append(item);
    });
  };

  const appendLog = (line: string): void => {
    if (log.textContent === 'Нажмите «Запустить миссию».') log.textContent = '';
    log.textContent += `${line}\n`;
    log.scrollTop = log.scrollHeight;
  };

  const play = async (): Promise<void> => {
    if (playing || disposed) return;
    playing = true;
    runBtn.disabled = true;
    againBtn.disabled = true;
    log.textContent = '';
    appendLog('mission_started status=running');
    for (let i = 0; i < PIPELINE.length; i++) {
      if (disposed) return;
      const step = PIPELINE[i];
      renderRoles(i, i);
      appendLog(`agent_started role=${step.role}`);
      await wait(550);
      appendLog(`agent_finished role=${step.role} summary="${step.summary}"`);
      if (step.role === 'reviewer') appendLog('review_retry skipped approved=true');
      renderRoles(i + 1, i + 1);
      await wait(220);
    }
    appendLog('mission_finished bundle=shipcrew-demo.zip');
    renderRoles(-1, PIPELINE.length);
    playing = false;
    againBtn.disabled = false;
  };

  runBtn.addEventListener('click', () => {
    void play();
  });
  againBtn.addEventListener('click', () => {
    void play();
  });

  ui.append(controls, roles, logPanel);
  root.append(ui);
  renderRoles();
  return () => {
    disposed = true;
    clear(root);
  };
}
