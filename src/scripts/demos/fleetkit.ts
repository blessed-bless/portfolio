import { demoLocale, demoProjectLabel, fleetkitCopy } from '../../i18n/demo-copy';
import { button, clear, el, wait, wantSameCta } from './shared';

type WorkerStatus = 'running' | 'paused' | 'offline';
type JobStatus = 'waiting' | 'running' | 'done' | 'error';

type Worker = { id: string; name: string; status: WorkerStatus };
type Job = { id: string; name: string; status: JobStatus; attempt: number };
type DeadLetter = { id: string; jobName: string; error: string; requeued: boolean };

export function mountFleetkitDemo(root: HTMLElement): () => void {
  clear(root);
  const locale = demoLocale();
  const t = fleetkitCopy(locale);
  const projectLabel = demoProjectLabel[locale].fleetkit;

  const ui = el('div', 'demo-ui');
  const workersPanel = el('div', 'demo-ui__panel');
  workersPanel.append(el('p', 'demo-ui__label', t.workers));
  const workersList = el('ul', 'demo-ui__list');
  workersPanel.append(workersList);

  const jobsPanel = el('div', 'demo-ui__panel');
  jobsPanel.append(el('p', 'demo-ui__label', t.queue));
  const jobsList = el('ul', 'demo-ui__list');
  const actions = el('div', 'demo-ui__row');
  jobsPanel.append(actions, jobsList);

  const dlqPanel = el('div', 'demo-ui__panel');
  dlqPanel.append(el('p', 'demo-ui__label', 'Dead letter'));
  const dlqList = el('ul', 'demo-ui__list');
  dlqPanel.append(dlqList);

  const workers: Worker[] = [
    { id: 'w1', name: 'bot-alpha', status: 'running' },
    { id: 'w2', name: 'cron-beta', status: 'running' },
    { id: 'w3', name: 'hook-gamma', status: 'paused' },
  ];
  let seq = 4;
  const jobs: Job[] = [
    { id: 'job-1', name: 'demo.task-1', status: 'waiting', attempt: 0 },
    { id: 'job-2', name: 'demo.task-2', status: 'waiting', attempt: 0 },
    { id: 'job-3', name: 'demo.task-3', status: 'waiting', attempt: 0 },
  ];
  const dlq: DeadLetter[] = [];
  let timer = 0;
  let disposed = false;

  const tone = (status: string): string => {
    if (status === 'running' || status === 'done' || status === 'requeued') return 'ok';
    if (status === 'waiting' || status === 'paused') return 'warn';
    return 'danger';
  };

  const renderWorkers = (): void => {
    clear(workersList);
    for (const worker of workers) {
      const item = el('li', 'demo-ui__item');
      const left = el('div');
      left.append(el('div', '', worker.name), el('span', 'demo-ui__meta', worker.id));
      const right = el('div', 'demo-ui__row');
      const status = el('span', 'demo-ui__status', t.labels[worker.status]);
      status.dataset.tone = tone(worker.status);
      const pause = button(worker.status === 'paused' ? t.resume : t.pause);
      pause.addEventListener('click', () => {
        worker.status = worker.status === 'paused' ? 'running' : 'paused';
        renderWorkers();
      });
      const restart = button(t.restart);
      restart.addEventListener('click', async () => {
        worker.status = 'offline';
        renderWorkers();
        await wait(400);
        worker.status = 'running';
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
      jobsList.append(el('li', 'demo-ui__meta', t.queueEmpty));
      return;
    }
    for (const job of jobs) {
      const item = el('li', 'demo-ui__item');
      const status = el('span', 'demo-ui__status', t.labels[job.status]);
      status.dataset.tone = tone(job.status);
      item.append(el('span', '', t.attempt(job.name, job.attempt)), status);
      jobsList.append(item);
    }
  };

  const renderDlq = (): void => {
    clear(dlqList);
    if (!dlq.length) {
      dlqList.append(el('li', 'demo-ui__meta', t.dlqEmpty));
      return;
    }
    for (const item of dlq) {
      const row = el('li', 'demo-ui__item');
      const left = el('div');
      left.append(el('div', '', item.jobName), el('span', 'demo-ui__meta', item.error));
      const right = el('div', 'demo-ui__row');
      if (!item.requeued) {
        const requeue = button(t.requeue);
        requeue.addEventListener('click', () => {
          item.requeued = true;
          jobs.unshift({
            id: `job-${seq++}`,
            name: item.jobName,
            status: 'waiting',
            attempt: 0,
          });
          renderDlq();
          renderJobs();
        });
        right.append(requeue);
      } else {
        right.append(el('span', 'demo-ui__status', t.labels.requeued));
        right.querySelector('.demo-ui__status')?.setAttribute('data-tone', 'ok');
      }
      row.append(left, right);
      dlqList.append(row);
    }
  };

  const enqueue = (name: string, fail = false): void => {
    jobs.unshift({ id: `job-${seq++}`, name, status: 'waiting', attempt: 0 });
    renderJobs();
    void tick(fail ? name : null);
  };

  const tick = async (forceFailName: string | null = null): Promise<void> => {
    if (disposed) return;
    const online = workers.some((w) => w.status === 'running');
    const job = jobs.find((j) => j.status === 'waiting');
    if (!job || !online) return;
    job.status = 'running';
    job.attempt += 1;
    renderJobs();
    await wait(700);
    if (disposed) return;
    const shouldFail = forceFailName === job.name || (job.name.includes('fail') && job.attempt < 2);
    if (shouldFail && job.attempt >= 1 && (forceFailName === job.name || job.attempt >= 2)) {
      job.status = 'error';
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
      job.status = 'waiting';
      renderJobs();
      await wait(400);
      return tick(null);
    }
    job.status = 'done';
    renderJobs();
  };

  const enqueueBtn = button(t.enqueue, { primary: true });
  enqueueBtn.addEventListener('click', () => enqueue(`demo.task-${seq}`));
  const failBtn = button(t.addFailing);
  failBtn.addEventListener('click', () => enqueue(`demo.fail-${seq}`, true));
  actions.append(enqueueBtn, failBtn);

  const footer = el('div', 'demo-ui__footer');
  footer.append(wantSameCta(projectLabel));

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
