const covers = import.meta.glob<string>('../assets/covers/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export function workCover(path: string): string {
  const match = path.match(/(?:^|\/)(assets\/covers\/[^/]+\.svg)$/);
  const key = match ? `../${match[1]}` : path.replace(/^(\.\.\/)+/, '../');
  const cover = covers[key];
  if (!cover) throw new Error(`Work cover not found: ${path}`);
  return cover;
}
