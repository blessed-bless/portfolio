import { serviceOffers } from '../data/order';
import { contactLinks, telegramChannel } from '../data/home';
import { isFilled } from './fill';
import {
  personAlternateName,
  personAlternateNameEn,
  personJobTitle,
  personJobTitleEn,
  personName,
  personNameEn,
  siteName,
  siteNameEn,
  siteUrl,
} from './site';
import { withTrailingSlash } from './paths';
import type { Locale } from '../i18n';

export type ServiceOfferSeed = {
  name: string;
  description: string;
  minPrice: number;
  priceLabel: string;
};

export const personId = `${siteUrl}/#person`;

/** Confirmed: remote work across Russia and CIS — no invented country list. */
export const areaServedLd = [
  { '@type': 'Country', name: 'Russia' },
  { '@type': 'Place', name: 'CIS' },
] as const;

function personSameAs(): string[] {
  return [contactLinks.github, contactLinks.telegram, telegramChannel.href].filter(isFilled);
}

export function personJsonLd(locale: 'ru' | 'en') {
  const email = isFilled(contactLinks.email) ? contactLinks.email : undefined;
  const sameAs = personSameAs();
  return {
    '@type': 'Person',
    '@id': personId,
    name: locale === 'en' ? personNameEn : personName,
    alternateName: locale === 'en' ? personAlternateNameEn : personAlternateName,
    jobTitle: locale === 'en' ? personJobTitleEn : personJobTitle,
    url: `${siteUrl}/`,
    ...(email ? { email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function webSiteJsonLd(locale: 'ru' | 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: locale === 'en' ? siteNameEn : siteName,
    url: locale === 'en' ? `${siteUrl}/en/` : `${siteUrl}/`,
    inLanguage: locale,
    publisher: { '@id': personId },
  };
}

export function serviceOfferJsonLd(locale: 'ru' | 'en', offer: ServiceOfferSeed) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: offer.name,
    description: offer.description,
    provider: { '@id': personId },
    areaServed: [...areaServedLd],
    availableLanguage: ['ru', 'en'],
    offers: {
      '@type': 'Offer',
      description: offer.priceLabel,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceCurrency: 'RUB',
        minPrice: offer.minPrice,
      },
    },
  };
}

export function breadcrumbJsonLd(
  locale: 'ru' | 'en',
  caseTitle: string,
  casePath: string,
) {
  const homeName = locale === 'en' ? 'Home' : 'Главная';
  const workName = locale === 'en' ? 'Work' : 'Работы';
  const homeUrl = locale === 'en' ? `${siteUrl}/en/` : `${siteUrl}/`;
  const workUrl =
    locale === 'en' ? `${siteUrl}/en/work/` : `${siteUrl}/work/`;
  const caseUrl = new URL(withTrailingSlash(casePath), siteUrl).href;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeName,
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: workName,
        item: workUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: caseTitle,
        item: caseUrl,
      },
    ],
  };
}

function homeServiceOffers(locale: Locale): ServiceOfferSeed[] {
  return serviceOffers(locale).map(({ title, description, minPrice, priceLabel }) => ({
    name: title,
    description,
    minPrice,
    priceLabel,
  }));
}

export const homeServiceOffersRu = homeServiceOffers('ru');
export const homeServiceOffersEn = homeServiceOffers('en');
