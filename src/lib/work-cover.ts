const covers = import.meta.glob<string>('../assets/covers/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export function workCover(path: string): string {
  const cover = covers[path.replace(/^\.\.\/\.\.\//, '../')];
  if (!cover) throw new Error(`Work cover not found: ${path}`);
  return cover;
}
