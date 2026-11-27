export const manifestLines = [
  'Сначала рабочий результат, потом полировка.',
  'Минимум лишнего.',
  'Проверяю, прежде чем сказать «готово».',
] as const;

export type ServiceItem = {
  title: string;
  text: string;
};

/** Legacy service blurbs. Home offers come from the order catalogue. */
export const services: ServiceItem[] = [
  {
    title: 'Веб-продукты',
    text: 'Интерфейсы и страницы, которые можно отдать пользователю без оговорок.',
  },
  {
    title: 'Бэкенд и интеграции',
    text: 'API, формы, платежи, CRM — чтобы данные ходили туда, куда нужно.',
  },
  {
    title: 'Автоматизация и AI',
    text: 'Скрипты, боты и пайплайны, которые снимают рутину с команды.',
  },
  {
    title: 'Сайты для бизнеса',
    text: 'Лендинги и витрины под заявки, запись и понятный следующий шаг.',
  },
];

export const businessOffers = [
  {
    title: 'Сайт для бизнеса',
    text: 'Витрина с записью на первом экране — как «Грань», со связкой на Telegram Mini App «Смена». На Tilda — если контент правите сами.',
    href: '/work/gran/',
    secondaryHref: '/work/zerno/',
    secondaryLabel: 'на Tilda',
  },
  {
    title: 'Запись и напоминания',
    text: 'День мастера в Telegram: слоты, статусы визитов и текст свободных окон.',
    href: '/work/smena/#demo',
  },
  {
    title: 'Бот, принимающий заявки',
    text: 'Telegram-бот принимает лид, уточняет детали и отдаёт менеджеру. Мониторинг сайтов — как Pingo.',
    href: '/work/ai-funnel-ecosystem/#demo',
    secondaryHref: '/work/pingo/',
    secondaryLabel: 'Pingo',
  },
] as const;

export const processSteps = [
  {
    title: 'Бриф',
    text: 'Уточняем, что должен сделать клиент и куда будет приходить заявка или запись.',
    timing: '{{заполнить}}',
  },
  {
    title: 'Прототип',
    text: 'Показываю версию, на которой уже можно отправить заявку и увидеть, как она доходит до команды.',
    timing: '{{заполнить}}',
  },
  {
    title: 'Проверка',
    text: 'Проверяю основные действия, тексты и возможные ошибки. Готовлю проект к запуску.',
    timing: '{{заполнить}}',
  },
  {
    title: 'Запуск',
    text: 'Отдаю инструкцию, доступы и короткий чек-лист поддержки.',
    timing: '{{заполнить}}',
  },
] as const;

export const pricingFrom = [
  { label: 'Сайт с записью', price: '{{заполнить}}' },
  { label: 'Telegram-бот под заявки', price: '{{заполнить}}' },
  { label: 'Мини-CRM / воронка', price: '{{заполнить}}' },
] as const;

export const stackRowA = [
  'TypeScript',
  'Astro',
  'React',
  'Python',
  'FastAPI',
  'Node',
  'PostgreSQL',
  'Telegram',
] as const;

export const stackRowB = [
  'Three.js',
  'GSAP',
  'Playwright',
  'Docker',
  'Redis',
  'OpenAI API',
  'Vite',
  'Linux',
] as const;

/** Leave empty or `{{заполнить}}` — Contact hides unfilled links. */
export const contactLinks = {
  telegram: 'https://t.me/ketasonx',
  github: 'https://github.com/blessed-bless',
  email: 'bogdan@dubstepmolitva.ru',
} as const;

/** Public channel (not DM). Used in header/footer/cmdk and home feed. */
export const telegramChannel = {
  href: 'https://t.me/molitva_deploy',
  preview: 'https://t.me/s/molitva_deploy',
  handle: 'molitva_deploy',
} as const;

export const aboutIntro = [
  'Пишу бэкенд на Python, ботов и автоматизацию, плюс веб-интерфейсы к ним — от API и очередей до дашборда или формы записи.',
  'Мне важно довести задачу до работающего результата: то, что можно запустить, проверить и отдать, а не только описать в коде.',
] as const;

export const aboutPrinciples = [
  {
    title: 'Сначала рабочий результат',
    text: 'Сначала сценарий от начала до конца, потом полировка. Без украшательства на пустом месте.',
  },
  {
    title: 'Минимальные изменения',
    text: 'Трогаю только то, что нужно задаче. Без рефакторинга «заодно».',
  },
  {
    title: 'Проверка перед «готово»',
    text: 'Сборка, сценарий глазами, потом уже сдача — не наоборот.',
  },
  {
    title: 'Читаемый код',
    text: 'Пишу так, чтобы через месяцы можно было открыть файл и понять, что происходит, без лишних слоёв.',
  },
] as const;

/** Only tech that appears in case repos / this site’s package.json. */
export const aboutStackGroups = [
  {
    title: 'Языки',
    items: ['Python 3.12', 'TypeScript'],
  },
  {
    title: 'Бэкенд и данные',
    items: ['FastAPI', 'SQLAlchemy', 'PostgreSQL', 'SQLite', 'Redis', 'Drizzle', 'pg-boss', 'Alembic'],
  },
  {
    title: 'Фронт',
    items: ['React', 'Vite', 'Next.js', 'Astro'],
  },
  {
    title: 'Боты и infra',
    items: ['aiogram 3', 'Telegram', 'Docker / Compose', 'asyncio', 'httpx'],
  },
] as const;

export const aboutHire = [
  'Сайты и боты для бизнеса: запись, заявки, уведомления в Telegram.',
  'Автоматизация заявок и пропущенных обращений — от заявки на сайте или звонка до сообщения менеджеру.',
  'Небольшой CRM-контур: лиды, заметки, timeline, выгрузки.',
] as const;

