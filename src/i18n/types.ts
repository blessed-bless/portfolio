export type Locale = 'ru' | 'en';

export type UiDict = {
  locale: Locale;
  localeName: string;
  skipToContent: string;
  brand: string;
  nav: {
    home: string;
    work: string;
    about: string;
    notes: string;
    contact: string;
    uses: string;
  };
  header: {
    openMenu: string;
    closeMenu: string;
    menuLabel: string;
    mobileNav: string;
    cmdk: string;
    cmdkShort: string;
    discuss: string;
    themeLight: string;
    themeDark: string;
  };
  footer: {
    top: string;
    uses: string;
    lessMotion: string;
    lessMotionOn: string;
  };
  personName: string;
  personAlt: string;
  home: {
    title: string;
    description: string;
    heroHeadline: string;
    heroSubtitle: string;
    heroCta: string;
    heroWork: string;
    featuredEyebrow: string;
    featuredTitle: string;
    offersEyebrow: string;
    offersTitle: string;
    processEyebrow: string;
    processTitle: string;
    contactTitle: string;
    contactWrite: string;
    contactPending: string;
    copied: string;
    stackEyebrow: string;
    stackTitle: string;
    carouselNav: string;
    carouselPrev: string;
    carouselNext: string;
    carouselHint: string;
  };
  work: {
    title: string;
    description: string;
    eyebrow: string;
    heading: string;
    list: string;
    grid: string;
    tagsAll: string;
    soon: string;
  };
  about: {
    title: string;
    description: string;
    eyebrow: string;
    how: string;
    stack: string;
    hire: string;
    contacts: string;
    resume: string;
  };
  uses: {
    title: string;
    description: string;
    eyebrow: string;
    heading: string;
    lead: string;
    empty: string;
  };
  case: {
    role: string;
    year: string;
    stack: string;
    status: string;
    next: string;
    demo: string;
    github: string;
  };
  cmdk: {
    label: string;
    placeholder: string;
    empty: string;
    pages: string;
    projects: string;
    actions: string;
    theme: string;
    copyEmail: string;
    openTelegram: string;
    openGithub: string;
    switchLocale: string;
    resume: string;
    lessMotion: string;
    lessMotionOn: string;
  };
  demo: {
    ariaLabel: string;
    tryTitle: string;
    tryBadge: string;
    loading: string;
    wantSame: string;
    wantSameText: (project: string) => string;
  };
  offers: Array<{ title: string; text: string; href: string }>;
  process: Array<{ title: string; text: string; timing: string }>;
  aboutIntro: string[];
  aboutPrinciples: Array<{ title: string; text: string }>;
  aboutHire: string[];
  aboutStackGroups: Array<{ title: string; items: string[] }>;
};
