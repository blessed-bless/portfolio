import { getCollection, render, type CollectionEntry } from 'astro:content';

export type NoteEntry = CollectionEntry<'notes'>;

export async function getPublishedNotes(): Promise<NoteEntry[]> {
  const entries = await getCollection('notes', ({ data }) => !data.draft);
  return entries.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getAllNotes(): Promise<NoteEntry[]> {
  const entries = await getCollection('notes');
  return entries.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getNote(id: string): Promise<NoteEntry | undefined> {
  const entries = await getAllNotes();
  return entries.find((entry) => entry.id === id || noteSlug(entry) === id);
}

export function noteSlug(entry: NoteEntry): string {
  return entry.id.replace(/\.(md|mdx)$/i, '');
}

export async function renderNote(entry: NoteEntry) {
  return render(entry);
}

export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export async function hasPublishedNotes(): Promise<boolean> {
  const notes = await getPublishedNotes();
  return notes.length > 0;
}
