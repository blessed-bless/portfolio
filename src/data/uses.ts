import { isFilled } from '../lib/fill';
import type { Locale } from '../i18n';

export type UsesItem = {
  label: string;
  value: string;
};

export type UsesGroup = {
  title: string;
  items: UsesItem[];
};

const usesRu: UsesGroup[] = [
  {
    title: 'Редактор',
    items: [
      { label: 'IDE', value: 'Cursor' },
      { label: 'Тема', value: '{{заполнить}}' },
      { label: 'Шрифт кода', value: '{{заполнить}}' },
    ],
  },
  {
    title: 'Терминал',
    items: [
      { label: 'Shell', value: 'PowerShell / bash' },
      { label: 'Терминал', value: '{{заполнить}}' },
      { label: 'Менеджер версий Node', value: '{{заполнить}}' },
    ],
  },
  {
    title: 'Железо',
    items: [
      { label: 'Ноутбук', value: '{{заполнить}}' },
      { label: 'Монитор', value: '{{заполнить}}' },
      { label: 'Клавиатура', value: '{{заполнить}}' },
      { label: 'Наушники', value: '{{заполнить}}' },
    ],
  },
  {
    title: 'Сервисы',
    items: [
      { label: 'Хостинг', value: 'Timeweb Cloud' },
      { label: 'Git', value: 'GitHub' },
      { label: 'DNS / домен', value: '{{заполнить}}' },
      { label: 'Аналитика', value: 'Яндекс.Метрика' },
      { label: 'Почта', value: 'bogdan@dubstepmolitva.ru' },
    ],
  },
];

const usesEn: UsesGroup[] = [
  {
    title: 'Editor',
    items: [
      { label: 'IDE', value: 'Cursor' },
      { label: 'Theme', value: '{{заполнить}}' },
      { label: 'Code font', value: '{{заполнить}}' },
    ],
  },
  {
    title: 'Terminal',
    items: [
      { label: 'Shell', value: 'PowerShell / bash' },
      { label: 'Terminal app', value: '{{заполнить}}' },
      { label: 'Node version manager', value: '{{заполнить}}' },
    ],
  },
  {
    title: 'Hardware',
    items: [
      { label: 'Laptop', value: '{{заполнить}}' },
      { label: 'Monitor', value: '{{заполнить}}' },
      { label: 'Keyboard', value: '{{заполнить}}' },
      { label: 'Headphones', value: '{{заполнить}}' },
    ],
  },
  {
    title: 'Services',
    items: [
      { label: 'Hosting', value: 'Timeweb Cloud' },
      { label: 'Git', value: 'GitHub' },
      { label: 'DNS / domain', value: '{{заполнить}}' },
      { label: 'Analytics', value: 'Yandex Metrika' },
      { label: 'Email', value: 'bogdan@dubstepmolitva.ru' },
    ],
  },
];

/** Fill values later — empty / {{заполнить}} items are not rendered. */
export const usesGroups = usesRu;

export function filledUsesGroups(locale: Locale = 'ru'): UsesGroup[] {
  const groups = locale === 'en' ? usesEn : usesRu;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isFilled(item.value)),
    }))
    .filter((group) => group.items.length > 0);
}
