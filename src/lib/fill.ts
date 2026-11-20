const EMPTY_MARKERS = new Set(['', '{{заполнить}}', '—', '-', 'tbd', 'TODO']);

/** True when a CMS/placeholder string should be shown to visitors. */
export function isFilled(value: string | undefined | null): value is string {
  if (value == null) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !EMPTY_MARKERS.has(trimmed);
}

export function filledOrUndefined(value: string | undefined | null): string | undefined {
  return isFilled(value) ? value.trim() : undefined;
}
