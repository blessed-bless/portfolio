type ShowcaseCopy = {
  category: string;
  scenario: string;
  action: string;
};

export const featuredWorkCopy: Record<string, Record<'ru' | 'en', ShowcaseCopy>> = {
  smena: {
    ru: {
      category: 'Онлайн-запись',
      scenario: 'Займите свободное окно в демо и посмотрите, как меняется расписание мастера.',
      action: 'Попробовать запись',
    },
    en: {
      category: 'Online booking',
      scenario: 'Book a slot in the demo and see the schedule update.',
      action: 'Try booking',
    },
  },
  gran: {
    ru: {
      category: 'Сайт для бизнеса',
      scenario: 'Посмотрите работы мастеров и откройте запись с первого экрана сайта барбершопа.',
      action: 'Открыть сайт',
    },
    en: {
      category: 'Business website',
      scenario: 'Browse the barbers’ work, then open booking directly from the home page.',
      action: 'Open the website',
    },
  },
  'ai-funnel-ecosystem': {
    ru: {
      category: 'Заявки и мини-CRM',
      scenario: 'Создайте тестовую заявку и измените её статус в очереди менеджера.',
      action: 'Попробовать мини-CRM',
    },
    en: {
      category: 'Enquiries and mini-CRM',
      scenario: 'Create a test enquiry and change its status in the manager’s queue.',
      action: 'Try the mini-CRM',
    },
  },
};
