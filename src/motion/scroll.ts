/**
 * scroll.ts — GSAP + ScrollTrigger backbone for the site.
 *
 * Owns the full lifecycle across Astro View Transitions: builds all scroll
 * choreography on `astro:page-load` and tears it down on `astro:before-swap`,
 * so triggers never leak or reference detached DOM after a client-side navigation.
 *
 * Components never create triggers inline — they call `registerScroll()` (usually
 * via `@motion/reveals`) to add their animations into the managed gsap.context().
 *
 * Hard rule: motion only sets *hidden start states*; the visible end-state is the
 * CSS default. Content is never gated on JS. A 4s safety net force-reveals anything
 * still hidden if an animation never fires (e.g. headless render, hidden tab).
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, onMotionPreferenceChange } from '@motion/env';

gsap.registerPlugin(ScrollTrigger);

export type ScrollInit = (_g: typeof gsap, _ctx: gsap.Context) => void;

const SAFETY_TIMEOUT_MS = 4000;

const registry: ScrollInit[] = [];
let ctx: gsap.Context | null = null;
let wired = false;
let safetyTimer: number | undefined;

/**
 * Register a scroll-choreography callback. Called at module scope by components.
 * If the lifecycle has already initialised, the callback is built immediately.
 */
export function registerScroll(fn: ScrollInit): void {
  registry.push(fn);
  if (ctx !== null) {
    const activeCtx = ctx;
    activeCtx.add(() => fn(gsap, activeCtx));
    ScrollTrigger.refresh();
  }
}

/** Force-reveal any claimed element still hidden — the never-blank safety net. */
function forceReveal(): void {
  const claimed = document.querySelectorAll<HTMLElement>('[data-choreographed="true"]');
  claimed.forEach((el) => {
    if (parseFloat(getComputedStyle(el).opacity) < 0.5) {
      el.style.transition = 'opacity 0.4s, transform 0.4s';
      el.style.opacity = '1';
      el.style.transform = 'none';
    }
  });
}

/** Build all registered choreography into a fresh context. */
function init(): void {
  cleanup();
  if (prefersReducedMotion()) return;
  ctx = gsap.context((self: gsap.Context) => {
    for (const fn of registry) fn(gsap, self);
  });
  ScrollTrigger.refresh();
  safetyTimer = window.setTimeout(forceReveal, SAFETY_TIMEOUT_MS);
}

/** Kill and revert everything — idempotent; safe to call before init or swap. */
function cleanup(): void {
  if (safetyTimer !== undefined) {
    window.clearTimeout(safetyTimer);
    safetyTimer = undefined;
  }
  if (ctx !== null) {
    ctx.revert();
    ctx = null;
  }
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

/** Wire Astro lifecycle listeners exactly once per session. */
export function wireLifecycle(): void {
  if (wired) return;
  wired = true;

  document.addEventListener('astro:page-load', init);
  document.addEventListener('astro:before-swap', cleanup);

  // Re-measure once webfonts settle — font swap shifts layout and pin positions.
  if (document.fonts !== undefined) {
    document.fonts.ready.then((): void => ScrollTrigger.refresh()).catch((): void => undefined);
  }

  // Honour a runtime change of the reduced-motion preference.
  onMotionPreferenceChange((reduced) => (reduced ? cleanup() : init()));
}

wireLifecycle();
