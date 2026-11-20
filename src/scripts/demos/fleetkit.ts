import { button, clear, el, wait } from './shared';

type WorkerStatus = 'online' | 'paused' | 'offline';
type JobStatus = 'queued' | 'running' | 'done' | 'failed';

type Worker = { id: string; name: string; status: WorkerStatus };
type Job = { id: string; name: string; status: JobStatus; attempt: number };
type DeadLetter = { id: string; jobName: string; error: string; requeued: boolean };

export function mountFleetkitDemo(root: HTMLElement): () => void {
  clear(root);
  const ui = el('div', 'demo-ui');
  const workersPanel = el('div', 'demo-ui__panel');
  workersPanel.append(el('p', 'demo-ui__label', 'Workers'));
  const workersList = el('ul', 'demo-ui__list');
  workersPanel.append(workersList);

  const jobsPanel = el('div', 'demo-ui__panel');
  jobsPanel.append(el('p', 'demo-ui__label', 'Jobs'));
  const jobsList = el('ul', 'demo-ui__list');
  const actions = el('div', 'demo-ui__row');
  jobsPanel.append(actions, jobsList);

  const dlqPanel = el('div', 'demo-ui__panel');
  dlqPanel.append(el('p', 'demo-ui__label', 'Dead letter'));
  const dlqList = el('ul', 'demo-ui__list');
  dlqPanel.append(dlqList);

  const workers: Worker[] = [
    { id: 'w1', name: 'bot-alpha', status: 'online' },
    { id: 'w2', name: 'cron-beta', status: 'online' },
    { id: 'w3', name: 'hook-gamma', status: 'paused' },
  ];
  const jobs: Job[] = [];
  const dlq: DeadLetter[] = [];
  let seq = 1;
  let timer = 0;
  let disposed = false;

  const tone = (status: string): string => {
    if (status === 'online' || status === 'done') return 'ok';
    if (status === 'running' || status === 'queued' || status === 'paused') return 'warn';
    return 'danger';
  };

  const renderWorkers = (): void => {
    clear(workersList);
    for (const worker of workers) {
      const item = el('li', 'demo-ui__item');
      const left = el('div');
      left.append(el('div', '', worker.name), el('span', 'demo-ui__meta', worker.id));
      const right = el('div', 'demo-ui__row');
      const status = el('span', 'demo-ui__status', worker.status);
      status.dataset.tone = tone(worker.status);
      const pause = button(worker.status === 'paused' ? 'resume' : 'pause');
      pause.addEventListener('click', () => {
        worker.status = worker.status === 'paused' ? 'online' : 'paused';
        renderWorkers();
      });
      const restart = button('restart');
      restart.addEventListener('click', async () => {
        worker.status = 'offline';
        renderWorkers();
        await wait(400);
        worker.status = 'online';
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
      const status = el('span', 'demo-ui__status', job.status);
      status.dataset.tone = tone(job.status);
      item.append(el('span', '', `${job.name} · attempt ${job.attempt}`), status);
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
        const requeue = button('requeue');
        requeue.addEventListener('click', () => {
          item.requeued = true;
          jobs.unshift({
            id: `job-${seq++}`,
            name: item.jobName,
            status: 'queued',
            attempt: 0,
          });
          renderDlq();
          renderJobs();
        });
        right.append(requeue);
      } else {
        right.append(el('span', 'demo-ui__status', 'requeued'));
        right.querySelector('.demo-ui__status')?.setAttribute('data-tone', 'ok');
      }
      row.append(left, right);
      dlqList.append(row);
    }
  };

  const enqueue = (name: string, fail = false): void => {
    jobs.unshift({ id: `job-${seq++}`, name, status: 'queued', attempt: 0 });
    renderJobs();
    void tick(fail ? name : null);
  };

  const tick = async (forceFailName: string | null = null): Promise<void> => {
    if (disposed) return;
    const online = workers.some((w) => w.status === 'online');
    const job = jobs.find((j) => j.status === 'queued');
    if (!job || !online) return;
    job.status = 'running';
    job.attempt += 1;
    renderJobs();
    await wait(700);
    if (disposed) return;
    const shouldFail = forceFailName === job.name || (job.name.includes('fail') && job.attempt < 2);
    if (shouldFail && job.attempt >= 1 && (forceFailName === job.name || job.attempt >= 2)) {
      job.status = 'failed';
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
      job.status = 'queued';
      renderJobs();
      await wait(400);
      return tick(null);
    }
    job.status = 'done';
    renderJobs();
  };

  const enqueueBtn = button('Enqueue job', { primary: true });
  enqueueBtn.addEventListener('click', () => enqueue(`demo.task-${seq}`));
  const failBtn = button('Enqueue failing job');
  failBtn.addEventListener('click', () => enqueue(`demo.fail-${seq}`, true));
  actions.append(enqueueBtn, failBtn);

  ui.append(workersPanel, jobsPanel, dlqPanel);
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
