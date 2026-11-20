type DemoId = 'priemnaya' | 'smena' | 'fleetkit' | 'crawlnet' | 'ai-funnel-ecosystem' | 'shipcrew';

const loaders: Record<DemoId, () => Promise<(root: HTMLElement) => () => void>> = {
  priemnaya: async () => (await import('./priemnaya')).mountPriemnayaDemo,
  smena: async () => (await import('./smena')).mountSmenaDemo,
  fleetkit: async () => (await import('./fleetkit')).mountFleetkitDemo,
  crawlnet: async () => (await import('./crawlnet')).mountCrawlnetDemo,
  'ai-funnel-ecosystem': async () => (await import('./ai-funnel')).mountAiFunnelDemo,
  shipcrew: async () => (await import('./shipcrew')).mountShipcrewDemo,
};

const cleanups = new WeakMap<Element, () => void>();

async function mountOne(section: HTMLElement): Promise<void> {
  const id = section.dataset.caseDemo as DemoId | undefined;
  const stage = section.querySelector<HTMLElement>('[data-demo-mount]');
  if (!id || !stage || !(id in loaders)) return;
  if (section.dataset.demoReady === 'true') return;
  section.dataset.demoReady = 'pending';
  try {
    const mount = await loaders[id]();
    cleanups.get(section)?.();
    const dispose = mount(stage);
    cleanups.set(section, dispose);
    section.dataset.demoReady = 'true';
  } catch (error) {
    section.dataset.demoReady = 'error';
    stage.textContent = 'Не удалось загрузить демо.';
    console.warn(`Demo ${id} failed`, error);
  }
}

export function hydrateCaseDemos(root: ParentNode = document): () => void {
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-case-demo]'));
  if (!sections.length) return () => undefined;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const section = entry.target as HTMLElement;
        observer.unobserve(section);
        void mountOne(section);
      }
    },
    { rootMargin: '120px 0px', threshold: 0.05 },
  );

  for (const section of sections) observer.observe(section);

  return () => {
    observer.disconnect();
    for (const section of sections) cleanups.get(section)?.();
  };
}
