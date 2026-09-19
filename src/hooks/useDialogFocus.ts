'use client';

import { useEffect, useRef, type RefObject } from 'react';

interface UseDialogFocusOptions {
  /** Called on Escape. When omitted, Escape does nothing. */
  onClose?: () => void;
  /** Set false when the dialog is closed so mount effects don't run. */
  enabled?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    // Respect programmatic untabbability (e.g. honeypot traps with tabIndex={-1}).
    if (el.tabIndex < 0) return false;
    if (el.closest('[aria-hidden="true"]')) return false;
    // Skip zero-size (visually hidden) nodes; off-screen-but-scrollable keeps its rect.
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

/**
 * Dialog a11y primitive: focus trap + Esc-close + scroll-lock + focus return.
 * SSR-safe (guards `document`). Stores the close callback in a ref so the
 * keydown listener subscribes once per mount.
 */
export function useDialogFocus(
  containerRef: RefObject<HTMLElement | null>,
  { onClose, enabled = true }: UseDialogFocusOptions = {},
): void {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const prevActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const addedTabindex = !container.hasAttribute('tabindex');
    if (addedTabindex) container.setAttribute('tabindex', '-1');
    const initial = getFocusable(container);
    (initial[0] ?? container).focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Inner-most dialog wins when sheets nest inside portals.
        e.stopImmediatePropagation();
        closeRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusable(container);
      if (items.length === 0) {
        e.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !container.contains(active))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        e.stopImmediatePropagation();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (addedTabindex) container.removeAttribute('tabindex');
      if (prevActive && typeof prevActive.focus === 'function' && document.contains(prevActive)) {
        prevActive.focus({ preventScroll: true });
      }
    };
  }, [containerRef, enabled]);
}
