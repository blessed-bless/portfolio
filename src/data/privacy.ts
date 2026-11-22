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
  updated: 'Редакция от 22.11.2026',
  sections: [
    {
      title: 'Кто оператор',
      body: [
        'Оператор: Кетасонкс Богдан, самозанятый, г. Омск.',
        'Почта: bogdan@dubstepmolitva.ru.',
      ],
    },
    {
      title: 'Какие данные собираю',
      body: [
        'Из заявки на сайте: имя, контакт (Telegram, телефон или email) и текст сообщения.',
        'Технические данные Яндекс Метрики: cookie, IP-адрес и сведения о браузере.',
      ],
    },
    {
      title: 'Зачем',
      body: [
        'Чтобы ответить на заявку и связаться с вами.',
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
        'Telegram — чтобы доставить заявку ботом.',
        'ООО «Яндекс» — сервис Яндекс Метрика.',
        'Хостинг Timeweb — размещение сайта.',
        'Данные хранятся на серверах в Российской Федерации.',
      ],
    },
    {
      title: 'Ваши права',
      body: [
        'Можно запросить доступ к данным, исправление, удаление или отозвать согласие.',
        'Для этого напишите на bogdan@dubstepmolitva.ru.',
      ],
    },
  ],
};

export const privacyEn: PrivacyCopy = {
  title: 'Personal data processing policy — Bogdan',
  description:
    'How Ketasonx Bogdan processes personal data on dubstepmolitva.ru.',
  heading: 'Personal data processing policy',
  updated: 'Updated 22 Nov 2026',
  sections: [
    {
      title: 'Operator',
      body: [
        'Operator: Ketasonx Bogdan, self-employed, Omsk, Russia.',
        'Email: bogdan@dubstepmolitva.ru.',
      ],
    },
    {
      title: 'What I collect',
      body: [
        'From a site request: name, contact (Telegram, phone, or email), and the message text.',
        'Yandex Metrica technical data: cookies, IP address, and browser details.',
      ],
    },
    {
      title: 'Why',
      body: [
        'To reply to your request and get in touch.',
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
        'Telegram — to deliver the request via a bot.',
        'Yandex LLC — Yandex Metrica.',
        'Timeweb hosting — where the site runs.',
        'Data is stored on servers in the Russian Federation.',
      ],
    },
    {
      title: 'Your rights',
      body: [
        'You can ask for access, correction, deletion, or withdraw consent.',
        'Write to bogdan@dubstepmolitva.ru.',
      ],
    },
  ],
};
