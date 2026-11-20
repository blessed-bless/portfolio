import { button, clear, el, wait } from './shared';

const SEEDS = [
  'https://quotes.toscrape.com/',
  'https://books.toscrape.com/',
  'https://example.com/shop',
] as const;

type Node = { id: string; url: string; depth: number; x: number; y: number };
type Edge = { from: string; to: string };

export function mountCrawlnetDemo(root: HTMLElement): () => void {
  clear(root);
  const ui = el('div', 'demo-ui');
  const controls = el('div', 'demo-ui__row');
  const select = el('select', 'demo-ui__select') as HTMLSelectElement;
  for (const seed of SEEDS) {
    const opt = document.createElement('option');
    opt.value = seed;
    opt.textContent = seed;
    select.append(opt);
  }
  const startBtn = button('Запустить обход', { primary: true });
  const exportBtn = button('Экспорт CSV');
  exportBtn.disabled = true;
  controls.append(el('p', 'demo-ui__label', 'Start URL'), select, startBtn, exportBtn);

  const stats = el('div', 'demo-ui__row');
  const pagesStat = el('span', 'demo-ui__meta', 'pages: 0');
  const errStat = el('span', 'demo-ui__meta', 'errors: 0');
  stats.append(pagesStat, errStat);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'demo-ui__graph');
  svg.setAttribute('viewBox', '0 0 640 360');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Граф обхода');

  const tableWrap = el('div', 'demo-ui__table-wrap');
  const table = el('table', 'demo-ui__table');
  table.innerHTML = '<thead><tr><th>url</th><th>depth</th><th>status</th></tr></thead>';
  const tbody = document.createElement('tbody');
  table.append(tbody);
  tableWrap.append(table);

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const rows: Array<{ url: string; depth: number; status: string }> = [];
  let pages = 0;
  let errors = 0;
  let running = false;

  const paint = (): void => {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    for (const edge of edges) {
      const a = nodes.find((n) => n.id === edge.from);
      const b = nodes.find((n) => n.id === edge.to);
      if (!a || !b) continue;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(a.x));
      line.setAttribute('y1', String(a.y));
      line.setAttribute('x2', String(b.x));
      line.setAttribute('y2', String(b.y));
      line.setAttribute('stroke', 'currentColor');
      line.setAttribute('stroke-opacity', '0.35');
      svg.append(line);
    }
    for (const node of nodes) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(node.x));
      circle.setAttribute('cy', String(node.y));
      circle.setAttribute('r', node.depth === 0 ? '8' : '5');
      circle.setAttribute('fill', 'currentColor');
      svg.append(circle);
    }
    pagesStat.textContent = `pages: ${pages}`;
    errStat.textContent = `errors: ${errors}`;
    clear(tbody);
    for (const row of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.url}</td><td>${row.depth}</td><td>${row.status}</td>`;
      tbody.append(tr);
    }
  };

  const crawl = async (): Promise<void> => {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    exportBtn.disabled = true;
    nodes.length = 0;
    edges.length = 0;
    rows.length = 0;
    pages = 0;
    errors = 0;
    const seed = select.value;
    const rootNode: Node = { id: 'n0', url: seed, depth: 0, x: 320, y: 40 };
    nodes.push(rootNode);
    rows.push({ url: seed, depth: 0, status: 'ok' });
    pages = 1;
    paint();

    const children = [
      `${seed.replace(/\/$/, '')}/page/1`,
      `${seed.replace(/\/$/, '')}/page/2`,
      `${seed.replace(/\/$/, '')}/author/a`,
      `${seed.replace(/\/$/, '')}/tag/life`,
      `${seed.replace(/\/$/, '')}/broken`,
    ];
    for (let i = 0; i < children.length; i++) {
      await wait(320);
      const url = children[i];
      const node: Node = {
        id: `n${i + 1}`,
        url,
        depth: 1,
        x: 80 + i * 120,
        y: 160 + (i % 2) * 40,
      };
      nodes.push(node);
      edges.push({ from: rootNode.id, to: node.id });
      const broken = url.endsWith('/broken');
      if (broken) {
        errors += 1;
        rows.push({ url, depth: 1, status: 'error' });
      } else {
        pages += 1;
        rows.push({ url, depth: 1, status: 'ok' });
        if (i < 2) {
          await wait(220);
          const leaf: Node = {
            id: `n${i + 10}`,
            url: `${url}/item`,
            depth: 2,
            x: node.x,
            y: 280,
          };
          nodes.push(leaf);
          edges.push({ from: node.id, to: leaf.id });
          pages += 1;
          rows.push({ url: leaf.url, depth: 2, status: 'ok' });
        }
      }
      paint();
    }
    running = false;
    startBtn.disabled = false;
    exportBtn.disabled = false;
  };

  startBtn.addEventListener('click', () => {
    void crawl();
  });
  exportBtn.addEventListener('click', () => {
    const csv = ['url,depth,status', ...rows.map((r) => `"${r.url}",${r.depth},${r.status}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'crawlnet-demo.csv';
    a.click();
    URL.revokeObjectURL(href);
  });

  ui.append(controls, stats, svg, tableWrap);
  root.append(ui);
  paint();
  return () => clear(root);
}
