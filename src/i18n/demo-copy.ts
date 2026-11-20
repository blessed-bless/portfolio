import type { Locale } from './types';

export function demoLocale(): Locale {
  return document.documentElement.lang === 'en' ? 'en' : 'ru';
}

const shell = {
  ru: {
    ariaLabel: 'Интерактивное демо',
    tryTitle: 'Попробовать',
    tryBadge: 'Демо на тестовых данных',
    loading: 'Загружаем демо…',
    loadError: 'Не удалось загрузить демо.',
    copy: 'Копировать',
    copied: 'Скопировано',
    copyFailed: 'Не вышло',
    wantSame: 'Хочу такое же',
    wantSameText: (project: string) =>
      `Привет! Хочу такое же, как «${project}» на портфолио. Расскажи сроки и следующий шаг.`,
  },
  en: {
    ariaLabel: 'Interactive demo',
    tryTitle: 'Try it',
    tryBadge: 'Demo on sample data',
    loading: 'Loading demo…',
    loadError: 'Could not load the demo.',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Failed',
    wantSame: 'Want one like this?',
    wantSameText: (project: string) =>
      `Hi — I want something like ${project} from your portfolio. What’s the next step and timeline?`,
  },
} as const;

export function demoShell(locale: Locale = demoLocale()) {
  return shell[locale];
}

export const demoProjectLabel = {
  ru: {
    priemnaya: 'Приёмная',
    smena: 'Смена',
    fleetkit: 'FleetKit',
    crawlnet: 'crawlnet',
    aiFunnel: 'AI Funnel Ecosystem',
    shipcrew: 'ShipCrew',
  },
  en: {
    priemnaya: 'Reception',
    smena: 'Smena',
    fleetkit: 'FleetKit',
    crawlnet: 'crawlnet',
    aiFunnel: 'AI Funnel Ecosystem',
    shipcrew: 'ShipCrew',
  },
} as const;

const priemnaya = {
  ru: {
    days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const,
    services: [
      { id: 'change', title: 'Сезонная смена', minutes: 40 },
      { id: 'balance', title: 'Балансировка', minutes: 30 },
      { id: 'repair', title: 'Ремонт прокола', minutes: 25 },
    ] as const,
    serviceLabel: 'Услуга',
    slotsLabel: 'Свободные слоты на неделю',
    scheduleLabel: 'Расписание мастера',
    hint: 'Выберите услугу и свободное окно — запись появится в календаре.',
    emptyVisits: 'Пока пусто — подтвердите слот.',
    confirmed: 'подтверждено',
    booked: 'Запись в расписании. Повтор на тот же слот недоступен.',
    noSlots: 'На этой неделе свободных окон нет.',
    withBuffer: (title: string, minutes: number) => `${title} · ${minutes} мин с буфером поста.`,
  },
  en: {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const,
    services: [
      { id: 'change', title: 'Seasonal tire change', minutes: 40 },
      { id: 'balance', title: 'Wheel balancing', minutes: 30 },
      { id: 'repair', title: 'Puncture repair', minutes: 25 },
    ] as const,
    serviceLabel: 'Service',
    slotsLabel: 'Open slots this week',
    scheduleLabel: 'Technician schedule',
    hint: 'Pick a service and an open slot — it lands on the calendar.',
    emptyVisits: 'Empty for now — confirm a slot.',
    confirmed: 'confirmed',
    booked: 'Booked on the schedule. That slot is taken.',
    noSlots: 'No open windows this week.',
    withBuffer: (title: string, minutes: number) => `${title} · ${minutes} min with a post buffer.`,
  },
} as const;

export function priemnayaCopy(locale: Locale = demoLocale()) {
  return priemnaya[locale];
}

const smena = {
  ru: {
    title: 'Смена · сегодня',
    hint: 'Тап по свободному окну — запись. Статусы и «Поделиться окнами» без сети.',
    status: {
      confirmed: 'ожидает',
      arrived: 'пришёл',
      done: 'завершён',
      noshow: 'не пришёл',
    },
    statusBtn: {
      arrived: 'Пришёл',
      done: 'Завершён',
      noshow: 'Не пришёл',
    },
    seed: [
      { id: '1', time: '10:00', duration: 60, name: 'Алексей М.', service: 'Мужская стрижка', status: 'done' as const },
      { id: '2', time: '11:30', duration: 90, name: 'Дмитрий В.', service: 'Стрижка и борода', status: 'confirmed' as const },
      { id: '3', time: '14:00', duration: 60, name: 'Михаил С.', service: 'Мужская стрижка', status: 'confirmed' as const },
      { id: '4', time: '16:30', duration: 30, name: 'Артём Б.', service: 'Оформление бороды', status: 'confirmed' as const },
    ],
    newClient: 'Новый клиент',
    haircut: 'Мужская стрижка',
    bookedAt: (time: string) => `Запись на ${time}. Свободные окна пересчитаны.`,
    shareWindows: 'Поделиться окнами',
    shareText: (lines: string) => `Свободно сегодня:\n${lines || '• окон нет'}\n\nНапишите, какое время удобно.`,
    shareNote: 'Текст для клиента — можно скопировать из блока ниже.',
    selectedNote: (name: string, status: string) => `${name}: ${status}.`,
    statusChanged: (name: string, status: string) => `${name} → ${status}.`,
  },
  en: {
    title: 'Smena · today',
    hint: 'Tap a free window to book. Statuses and “Share windows” work offline.',
    status: {
      confirmed: 'waiting',
      arrived: 'arrived',
      done: 'done',
      noshow: 'no-show',
    },
    statusBtn: {
      arrived: 'Arrived',
      done: 'Done',
      noshow: 'No-show',
    },
    seed: [
      { id: '1', time: '10:00', duration: 60, name: 'Alex M.', service: "Men's haircut", status: 'done' as const },
      { id: '2', time: '11:30', duration: 90, name: 'Dmitry V.', service: 'Haircut and beard', status: 'confirmed' as const },
      { id: '3', time: '14:00', duration: 60, name: 'Michael S.', service: "Men's haircut", status: 'confirmed' as const },
      { id: '4', time: '16:30', duration: 30, name: 'Artem B.', service: 'Beard trim', status: 'confirmed' as const },
    ],
    newClient: 'New client',
    haircut: "Men's haircut",
    bookedAt: (time: string) => `Booked at ${time}. Free windows recalculated.`,
    shareWindows: 'Share windows',
    shareText: (lines: string) => `Free today:\n${lines || '• none'}\n\nReply with a time that works.`,
    shareNote: 'Client-facing text — copy from the block below.',
    selectedNote: (name: string, status: string) => `${name}: ${status}.`,
    statusChanged: (name: string, status: string) => `${name} → ${status}.`,
  },
} as const;

export function smenaCopy(locale: Locale = demoLocale()) {
  return smena[locale];
}

const fleetkit = {
  ru: {
    workers: 'Воркеры',
    queue: 'Очередь',
    labels: {
      running: 'работает',
      paused: 'пауза',
      offline: 'офлайн',
      waiting: 'ожидает',
      done: 'готово',
      error: 'ошибка',
      requeued: 'вернули',
    },
    pause: 'Пауза',
    resume: 'Продолжить',
    restart: 'Перезапустить',
    queueEmpty: 'Очередь пуста.',
    attempt: (name: string, n: number) => `${name} · попытка ${n}`,
    dlqEmpty: 'DLQ пуст.',
    requeue: 'Вернуть в очередь',
    enqueue: 'В очередь',
    addFailing: 'Добавить падающую задачу',
  },
  en: {
    workers: 'Workers',
    queue: 'Queue',
    labels: {
      running: 'running',
      paused: 'paused',
      offline: 'offline',
      waiting: 'waiting',
      done: 'done',
      error: 'error',
      requeued: 'requeued',
    },
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Restart',
    queueEmpty: 'Queue is empty.',
    attempt: (name: string, n: number) => `${name} · attempt ${n}`,
    dlqEmpty: 'DLQ is empty.',
    requeue: 'Requeue',
    enqueue: 'Enqueue',
    addFailing: 'Add a failing job',
  },
} as const;

export function fleetkitCopy(locale: Locale = demoLocale()) {
  return fleetkit[locale];
}

const shipcrew = {
  ru: {
    run: 'Запустить миссию',
    again: 'Запустить снова',
    logLabel: 'Журнал событий',
    idle: 'Нажмите «Запустить миссию».',
    waiting: 'ожидает',
    done: 'готово',
    working: 'работает',
    started: 'Миссия запущена',
    reviewOk: 'Повторное ревью не нужно — всё одобрено',
    finished: 'Миссия завершена: бандл shipcrew-demo.zip готов',
    steps: [
      {
        role: 'pm',
        title: 'PM',
        logStart: 'PM приступил к брифу',
        logDone: 'PM собрал бриф: API gateway и общая доска агентов',
      },
      {
        role: 'architect',
        title: 'Architect',
        logStart: 'Архитектор проектирует стек',
        logDone: 'Архитектор наметил FastAPI, React UI и zip-бандл',
      },
      {
        role: 'engineer',
        title: 'Engineer',
        logStart: 'Инженер пишет код',
        logDone: 'Инженер сгенерировал сервисы и каркас фронта',
      },
      {
        role: 'reviewer',
        title: 'Reviewer',
        logStart: 'Ревьюер проверяет результат',
        logDone: 'Ревьюер одобрил без правок',
      },
      {
        role: 'devops',
        title: 'DevOps',
        logStart: 'DevOps собирает релиз',
        logDone: 'DevOps собрал prod zip и проверил /api/health',
      },
    ],
  },
  en: {
    run: 'Run mission',
    again: 'Run again',
    logLabel: 'Event log',
    idle: 'Press “Run mission”.',
    waiting: 'waiting',
    done: 'done',
    working: 'working',
    started: 'Mission started',
    reviewOk: 'No second review needed — approved',
    finished: 'Mission done: shipcrew-demo.zip is ready',
    steps: [
      {
        role: 'pm',
        title: 'PM',
        logStart: 'PM started the brief',
        logDone: 'PM wrote the brief: API gateway and a shared agent board',
      },
      {
        role: 'architect',
        title: 'Architect',
        logStart: 'Architect designs the stack',
        logDone: 'Architect sketched FastAPI, React UI, and a zip ship bundle',
      },
      {
        role: 'engineer',
        title: 'Engineer',
        logStart: 'Engineer writes code',
        logDone: 'Engineer generated services and a front-end shell',
      },
      {
        role: 'reviewer',
        title: 'Reviewer',
        logStart: 'Reviewer checks the result',
        logDone: 'Reviewer approved with no fixes',
      },
      {
        role: 'devops',
        title: 'DevOps',
        logStart: 'DevOps builds the release',
        logDone: 'DevOps packed the prod zip and checked /api/health',
      },
    ],
  },
} as const;

export function shipcrewCopy(locale: Locale = demoLocale()) {
  return shipcrew[locale];
}

const aiFunnel = {
  ru: {
    landing: 'Лендинг',
    landingText: 'Оставьте заявку — бот уточнит задачу в чате.',
    leaveLead: 'Оставить заявку',
    chatLabel: 'Telegram AI-бот',
    nextLine: 'Следующая реплика',
    crm: 'Мини-CRM',
    noLeads: 'Лидов пока нет.',
    done: 'Сценарий завершён',
    statuses: ['новый', 'квалифицирован', 'сделка', 'отказ'] as const,
    script: [
      { from: 'bot' as const, text: 'Привет! Чем помочь — сайт, бот или автоматизация заявок?' },
      { from: 'user' as const, text: 'Нужен бот для записи клиентов.' },
      { from: 'bot' as const, text: 'Понял. Какой бюджетный ориентир — до 50к, 50–150к или выше?' },
      { from: 'user' as const, text: '50–150к, старт в этом месяце.' },
      { from: 'bot' as const, text: 'Ок. Передам менеджеру — в CRM появится лид с тегами bot и booking.' },
    ],
    lead: {
      name: 'Анна К.',
      source: 'лендинг',
      need: 'бот для записи',
      tags: ['лендинг'],
      qualifiedTags: ['лендинг', 'бот', 'запись'],
      qualifiedNeed: 'бот для записи · бюджет 50–150к',
      statusNew: 'новый' as const,
      statusQualified: 'квалифицирован' as const,
    },
  },
  en: {
    landing: 'Landing',
    landingText: 'Leave a request — the bot clarifies the job in chat.',
    leaveLead: 'Leave a request',
    chatLabel: 'Telegram AI bot',
    nextLine: 'Next reply',
    crm: 'Mini CRM',
    noLeads: 'No leads yet.',
    done: 'Scenario finished',
    statuses: ['new', 'qualified', 'won', 'lost'] as const,
    script: [
      { from: 'bot' as const, text: 'Hi! What do you need — a site, a bot, or lead automation?' },
      { from: 'user' as const, text: 'A bot for client bookings.' },
      { from: 'bot' as const, text: 'Got it. Budget range — under 50k, 50–150k, or higher?' },
      { from: 'user' as const, text: '50–150k, start this month.' },
      { from: 'bot' as const, text: 'Ok. I’ll pass it to a manager — a lead with bot and booking tags will show up in the CRM.' },
    ],
    lead: {
      name: 'Anna K.',
      source: 'landing',
      need: 'booking bot',
      tags: ['landing'],
      qualifiedTags: ['landing', 'bot', 'booking'],
      qualifiedNeed: 'booking bot · budget 50–150k',
      statusNew: 'new' as const,
      statusQualified: 'qualified' as const,
    },
  },
} as const;

export function aiFunnelCopy(locale: Locale = demoLocale()) {
  return aiFunnel[locale];
}

const crawlnet = {
  ru: {
    startUrl: 'Стартовый URL',
    start: 'Запустить обход',
    exportCsv: 'Экспорт CSV',
    pages: (n: number) => `страниц: ${n}`,
    errors: (n: number) => `ошибок: ${n}`,
    graphLabel: 'Граф обхода',
    depth: 'глубина',
    status: 'статус',
    ok: 'ок',
    error: 'ошибка',
  },
  en: {
    startUrl: 'Seed URL',
    start: 'Start crawl',
    exportCsv: 'Export CSV',
    pages: (n: number) => `pages: ${n}`,
    errors: (n: number) => `errors: ${n}`,
    graphLabel: 'Crawl graph',
    depth: 'depth',
    status: 'status',
    ok: 'ok',
    error: 'error',
  },
} as const;

export function crawlnetCopy(locale: Locale = demoLocale()) {
  return crawlnet[locale];
}
