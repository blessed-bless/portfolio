export const projectServices = [
  { id: 'website', minPrice: 30000, weeks: '2–4', caseSlug: 'gran' },
  { id: 'booking', minPrice: 50000, weeks: '2–4', caseSlug: 'smena' },
  { id: 'bot', minPrice: 25000, weeks: '1–3', caseSlug: 'ai-funnel-ecosystem' },
  { id: 'automation', minPrice: 20000, weeks: null, caseSlug: 'ai-funnel-ecosystem' },
] as const;

type ServiceId = (typeof projectServices)[number]['id'];
type ServiceCopy = { title: string; short: string; description: string; example: string };

const serviceCopy = {
  ru: {
    website: {
      title: 'Сайт для бизнеса', short: 'сайт',
      description: 'Адаптивный сайт с услугами, ценами и понятным следующим шагом. Можно связать его с формой заявки или записью в Telegram.',
      example: 'Вымышленный пример · тестовые данные. На сайте барбершопа «Грань» можно посмотреть работы мастеров и открыть запись с первого экрана.',
    },
    booking: {
      title: 'Онлайн-запись', short: 'онлайн-запись',
      description: 'Клиент выбирает свободное время. Мастер видит расписание, отмечает визиты и может поделиться списком свободных окон.',
      example: 'Тестовые клиенты и расписание. Выберите свободное время: после записи расписание пересчитывается.',
    },
    bot: {
      title: 'Telegram-бот', short: 'бот',
      description: 'Бот принимает обращение, задаёт уточняющие вопросы и передаёт данные менеджеру. Менеджер видит контакт и запрос в очереди мини-CRM и меняет статус заявки.',
      example: 'Вымышленный пример · тестовые данные. Новая заявка появляется в мини-CRM, где можно изменить её статус.',
    },
    automation: {
      title: 'Автоматизация', short: 'автоматизация',
      description: 'Связываю источники заявок, уведомления и очередь менеджера. Можно сохранить источник обращения и пометить заявку по результатам диалога.',
      example: 'В том же демо пройдите диалог до конца и посмотрите, как меняются детали, метки и статус заявки. Используются тестовые данные.',
    },
  },
  en: {
    website: {
      title: 'Business website', short: 'website',
      description: 'A responsive site with services, prices and a clear next step. Connect it to an enquiry form or Telegram booking.',
      example: 'Fictional example · test data. The Gran barbershop site lets you browse the barbers’ work and open booking from the first screen.',
    },
    booking: {
      title: 'Online booking', short: 'online booking',
      description: 'Customers pick an available time. Staff can see their schedule, update visit statuses and share open slots.',
      example: 'Sample customers and schedule. Pick an open time to book it and see the schedule update.',
    },
    bot: {
      title: 'Telegram bot', short: 'bot',
      description: 'The bot takes enquiries, asks follow-up questions and passes the details to a manager. The manager sees the contact and request in the mini-CRM queue and updates its status.',
      example: 'Fictional example · test data. A new enquiry appears in the mini-CRM, where you can change its status.',
    },
    automation: {
      title: 'Automation', short: 'automation',
      description: 'Connect enquiry sources, notifications and the manager’s queue. Keep the enquiry source and tag the request based on the conversation.',
      example: 'Finish the conversation in the same demo to see the enquiry details, tags and status change. The demo uses test data.',
    },
  },
} satisfies Record<'ru' | 'en', Record<ServiceId, ServiceCopy>>;

export function serviceOffers(locale: 'ru' | 'en') {
  return projectServices.map((service) => ({
    ...service,
    ...serviceCopy[locale][service.id],
    priceLabel: locale === 'en'
      ? `from ${service.minPrice.toLocaleString('en-US')} ₽`
      : `от ${service.minPrice.toLocaleString('ru-RU')} ₽`,
    timing: service.weeks
      ? `${service.weeks} ${locale === 'en' ? 'weeks' : 'недели'}`
      : locale === 'en' ? 'timing after assessment' : 'срок после оценки',
  }));
}

export function serviceEstimates(locale: 'ru' | 'en'): string {
  return serviceOffers(locale)
    .map(({ short, priceLabel, timing }) => `${short} ${priceLabel} / ${timing}`)
    .join(', ');
}
