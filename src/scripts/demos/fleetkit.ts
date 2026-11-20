import { button, clear, el, wait, wantSameCta } from './shared';

type WorkerStatus = 'работает' | 'пауза' | 'офлайн';
type JobStatus = 'ожидает' | 'работает' | 'готово' | 'ошибка';

type Worker = { id: string; name: string; status: WorkerStatus };
type Job = { id: string; name: string; status: JobStatus; attempt: number };
type DeadLetter = { id: string; jobName: string; error: string; requeued: boolean };

const STATUS_LABEL: Record<JobStatus | WorkerStatus | 'вернули', string> = {
  работает: 'работает',
  пауза: 'пауза',
  офлайн: 'офлайн',
  ожидает: 'ожидает',
  готово: 'готово',
  ошибка: 'ошибка',
  вернули: 'вернули',
};

export function mountFleetkitDemo(root: HTMLElement): () => void {
  clear(root);
  const ui = el('div', 'demo-ui');
  const workersPanel = el('div', 'demo-ui__panel');
  workersPanel.append(el('p', 'demo-ui__label', 'Воркеры'));
  const workersList = el('ul', 'demo-ui__list');
  workersPanel.append(workersList);

  const jobsPanel = el('div', 'demo-ui__panel');
  jobsPanel.append(el('p', 'demo-ui__label', 'Очередь'));
  const jobsList = el('ul', 'demo-ui__list');
  const actions = el('div', 'demo-ui__row');
  jobsPanel.append(actions, jobsList);

  const dlqPanel = el('div', 'demo-ui__panel');
  dlqPanel.append(el('p', 'demo-ui__label', 'Dead letter'));
  const dlqList = el('ul', 'demo-ui__list');
  dlqPanel.append(dlqList);

  const workers: Worker[] = [
    { id: 'w1', name: 'bot-alpha', status: 'работает' },
    { id: 'w2', name: 'cron-beta', status: 'работает' },
    { id: 'w3', name: 'hook-gamma', status: 'пауза' },
  ];
  let seq = 4;
  const jobs: Job[] = [
    { id: 'job-1', name: 'demo.task-1', status: 'ожидает', attempt: 0 },
    { id: 'job-2', name: 'demo.task-2', status: 'ожидает', attempt: 0 },
    { id: 'job-3', name: 'demo.task-3', status: 'ожидает', attempt: 0 },
  ];
  const dlq: DeadLetter[] = [];
  let timer = 0;
  let disposed = false;

  const tone = (status: string): string => {
    if (status === 'работает' || status === 'готово' || status === 'вернули') return 'ok';
    if (status === 'ожидает' || status === 'пауза') return 'warn';
    return 'danger';
  };

  const renderWorkers = (): void => {
    clear(workersList);
    for (const worker of workers) {
      const item = el('li', 'demo-ui__item');
      const left = el('div');
      left.append(el('div', '', worker.name), el('span', 'demo-ui__meta', worker.id));
      const right = el('div', 'demo-ui__row');
      const status = el('span', 'demo-ui__status', STATUS_LABEL[worker.status]);
      status.dataset.tone = tone(worker.status);
      const pause = button(worker.status === 'пауза' ? 'Продолжить' : 'Пауза');
      pause.addEventListener('click', () => {
        worker.status = worker.status === 'пауза' ? 'работает' : 'пауза';
        renderWorkers();
      });
      const restart = button('Перезапустить');
      restart.addEventListener('click', async () => {
        worker.status = 'офлайн';
        renderWorkers();
        await wait(400);
        worker.status = 'работает';
        renderWorkers();
      });
      right.append(status, pause, restart);
      item.append(left, right);
      workersList.append(item);
    }
  };

  const renderJobs = (): void => {
    clear(jobsList);
    if (!jobs.length) {
      jobsList.append(el('li', 'demo-ui__meta', 'Очередь пуста.'));
      return;
    }
    for (const job of jobs) {
      const item = el('li', 'demo-ui__item');
      const status = el('span', 'demo-ui__status', STATUS_LABEL[job.status]);
      status.dataset.tone = tone(job.status);
      item.append(el('span', '', `${job.name} · попытка ${job.attempt}`), status);
      jobsList.append(item);
    }
  };

  const renderDlq = (): void => {
    clear(dlqList);
    if (!dlq.length) {
      dlqList.append(el('li', 'demo-ui__meta', 'DLQ пуст.'));
      return;
    }
    for (const item of dlq) {
      const row = el('li', 'demo-ui__item');
      const left = el('div');
      left.append(el('div', '', item.jobName), el('span', 'demo-ui__meta', item.error));
      const right = el('div', 'demo-ui__row');
      if (!item.requeued) {
        const requeue = button('Вернуть в очередь');
        requeue.addEventListener('click', () => {
          item.requeued = true;
          jobs.unshift({
            id: `job-${seq++}`,
            name: item.jobName,
            status: 'ожидает',
            attempt: 0,
          });
          renderDlq();
          renderJobs();
        });
        right.append(requeue);
      } else {
        right.append(el('span', 'demo-ui__status', STATUS_LABEL.вернули));
        right.querySelector('.demo-ui__status')?.setAttribute('data-tone', 'ok');
      }
      row.append(left, right);
      dlqList.append(row);
    }
  };

  const enqueue = (name: string, fail = false): void => {
    jobs.unshift({ id: `job-${seq++}`, name, status: 'ожидает', attempt: 0 });
    renderJobs();
    void tick(fail ? name : null);
  };

  const tick = async (forceFailName: string | null = null): Promise<void> => {
    if (disposed) return;
    const online = workers.some((w) => w.status === 'работает');
    const job = jobs.find((j) => j.status === 'ожидает');
    if (!job || !online) return;
    job.status = 'работает';
    job.attempt += 1;
    renderJobs();
    await wait(700);
    if (disposed) return;
    const shouldFail = forceFailName === job.name || (job.name.includes('fail') && job.attempt < 2);
    if (shouldFail && job.attempt >= 1 && (forceFailName === job.name || job.attempt >= 2)) {
      job.status = 'ошибка';
      renderJobs();
      await wait(350);
      dlq.unshift({
        id: `dlq-${seq++}`,
        jobName: job.name,
        error: 'timeout after worker claim',
        requeued: false,
      });
      const idx = jobs.indexOf(job);
      if (idx >= 0) jobs.splice(idx, 1);
      renderJobs();
      renderDlq();
      return;
    }
    if (job.name.includes('fail') && job.attempt === 1) {
      job.status = 'ожидает';
      renderJobs();
      await wait(400);
      return tick(null);
    }
    job.status = 'готово';
    renderJobs();
  };

  const enqueueBtn = button('В очередь', { primary: true });
  enqueueBtn.addEventListener('click', () => enqueue(`demo.task-${seq}`));
  const failBtn = button('Добавить падающую задачу');
  failBtn.addEventListener('click', () => enqueue(`demo.fail-${seq}`, true));
  actions.append(enqueueBtn, failBtn);

  const footer = el('div', 'demo-ui__footer');
  footer.append(wantSameCta('FleetKit'));

  ui.append(workersPanel, jobsPanel, dlqPanel, footer);
  root.append(ui);
  renderWorkers();
  renderJobs();
  renderDlq();

  timer = window.setInterval(() => {
    void tick(null);
  }, 1600);

  return () => {
    disposed = true;
    window.clearInterval(timer);
    clear(root);
  };
}
