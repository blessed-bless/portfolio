export const manifestLines = [
  'Сначала рабочий результат, потом полировка.',
  'Минимум лишнего.',
  'Проверяю, прежде чем сказать «готово».',
] as const;

export type ServiceItem = {
  title: string;
  text: string;
};

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
  email: 'phungngocvuzyuh69739@gmail.com',
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
  'Автоматизация заявок и пропущенных обращений — от хита или звонка до сообщения менеджеру.',
  'Небольшой CRM-контур: лиды, заметки, timeline, выгрузки.',
] as const;
