export type PrivacySection = {
  title: string;
  body: string[];
};

export type PrivacyCopy = {
  title: string;
  description: string;
  heading: string;
  updated: string;
  sections: PrivacySection[];
};

export const privacyRu: PrivacyCopy = {
  title: 'Политика обработки персональных данных — Богдан',
  description:
    'Как Кетасонкс Богдан обрабатывает персональные данные на сайте dubstepmolitva.ru.',
  heading: 'Политика обработки персональных данных',
  updated: 'Редакция от 24.11.2026',
  sections: [
    {
      title: 'Кто оператор',
      body: [
        'Оператор: Кетасонкс Богдан, Швеция.',
        'Почта: bogdan@dubstepmolitva.ru.',
      ],
    },
    {
      title: 'Какие данные собираю',
      body: [
        'Если вы пишете мне в Telegram или на почту, я получаю данные, которые вы укажете в сообщении.',
        'После согласия Яндекс Метрика получает технические данные: cookie, IP-адрес и сведения о браузере. Запись сессий через Вебвизор отключена.',
      ],
    },
    {
      title: 'Зачем',
      body: [
        'Чтобы ответить на сообщение и связаться с вами.',
        'Чтобы считать посещаемость и понимать, как пользуются сайтом.',
      ],
    },
    {
      title: 'На каком основании',
      body: ['Обработка идёт на основании вашего согласия.'],
    },
    {
      title: 'Сколько храню',
      body: [
        'До достижения цели обработки или до отзыва согласия — что наступит раньше.',
      ],
    },
    {
      title: 'Кому передаю',
      body: [
        'При переходе по ссылке Telegram открывается личный чат. Переписка хранится на серверах Telegram.',
        'Обработка через Telegram — трансграничная передача. Написав в Telegram, вы на это соглашаетесь.',
        'ООО «Яндекс» — сервис Яндекс Метрика.',
        'Хостинг Timeweb — размещение сайта.',
      ],
    },
    {
      title: 'Ваши права',
      body: [
        'Можно запросить доступ к данным, исправление, удаление или отозвать согласие.',
        'Для этого напишите на bogdan@dubstepmolitva.ru. Согласие на аналитику можно изменить через «Настройки cookie» в подвале сайта.',
      ],
    },
  ],
};

export const privacyEn: PrivacyCopy = {
  title: 'Personal data processing policy — Bogdan',
  description:
    'How Ketasonx Bogdan processes personal data on dubstepmolitva.ru.',
  heading: 'Personal data processing policy',
  updated: 'Updated 24 Nov 2026',
  sections: [
    {
      title: 'Operator',
      body: [
        'Operator: Ketasonx Bogdan, Sweden.',
        'Email: bogdan@dubstepmolitva.ru.',
      ],
    },
    {
      title: 'What I collect',
      body: [
        'If you message me on Telegram or by email, I receive the details you include in your message.',
        'After you opt in, Yandex Metrica receives technical data such as cookies, IP address, and browser details. Session Replay is disabled.',
      ],
    },
    {
      title: 'Why',
      body: [
        'To reply to your message and get in touch.',
        'To measure traffic and see how the site is used.',
      ],
    },
    {
      title: 'Legal basis',
      body: ['Processing is based on your consent.'],
    },
    {
      title: 'How long I keep it',
      body: [
        'Until the purpose is fulfilled or you withdraw consent — whichever comes first.',
      ],
    },
    {
      title: 'Who else gets it',
      body: [
        'The Telegram link opens a private chat. Telegram stores the conversation on its servers.',
        'Processing via Telegram is a cross-border transfer. By writing on Telegram, you agree to that.',
        'Yandex LLC — Yandex Metrica.',
        'Timeweb hosting — where the site runs.',
      ],
    },
    {
      title: 'Your rights',
      body: [
        'You can ask for access, correction, deletion, or withdraw consent.',
        'Write to bogdan@dubstepmolitva.ru. You can change your analytics choice in Cookie settings in the site footer.',
      ],
    },
  ],
};
