/* One delegated listener: any [data-burst] element fires a single coral star-burst. */

export function initBurst(): void {
  if (typeof document === 'undefined') return;
  const doc = document as Document & { __tdBurst?: boolean };
  if (doc.__tdBurst) return;
  doc.__tdBurst = true;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    const el = target?.closest?.('[data-burst]');
    if (!(el instanceof HTMLElement)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const evt = e as MouseEvent;
    const r = el.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'td-burst';
    s.setAttribute('aria-hidden', 'true');
    s.style.left = `${evt.clientX ? evt.clientX - r.left : r.width / 2}px`;
    s.style.top = `${evt.clientY ? evt.clientY - r.top : r.height / 2}px`;
    s.style.translate = '-50% -50%';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(s);
    window.setTimeout(() => s.remove(), 450);
  });
}
