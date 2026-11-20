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

export const contactLinks = {
  telegram: '{{заполнить}}',
  github: '{{заполнить}}',
  email: '{{заполнить}}',
} as const;
