/** Clear shared cover VT names so only one source morphs into the case art. */
export function clearCoverVtNames(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.project-cover-wrap, [data-vt-cover]').forEach((el) => {
    el.style.viewTransitionName = 'none';
  });
}

export function assignCoverVtName(cover: HTMLElement, slug: string): void {
  clearCoverVtNames();
  cover.style.viewTransitionName = `work-cover-${slug}`;
}

/** Clone a cover for hover followers without duplicating view-transition-name. */
export function cloneCoverWithoutVt(cover: Element): HTMLElement {
  const clone = cover.cloneNode(true) as HTMLElement;
  clone.style.viewTransitionName = 'none';
  clone.querySelectorAll<HTMLElement>('.project-cover-wrap, [data-vt-cover]').forEach((el) => {
    el.style.viewTransitionName = 'none';
  });
  clone.removeAttribute('data-vt-cover');
  return clone;
}
