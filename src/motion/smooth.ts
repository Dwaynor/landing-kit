/**
 * smooth.ts — Lenis smooth scroll, wired into the GSAP/ScrollTrigger lifecycle.
 *
 * Premium scroll feel without breaking accessibility or perf:
 *   - Hard-gated: skipped entirely under prefers-reduced-motion or reduced-data
 *     (and on coarse/touch pointers), so those users get native scrolling.
 *   - Drives ScrollTrigger.update on every Lenis scroll and runs Lenis off the
 *     GSAP ticker, so pinned/scrub triggers stay in sync.
 *   - Self-manages the Astro View-Transitions lifecycle (build on page-load,
 *     destroy before-swap) — mirrors scroll.ts so nothing leaks between routes.
 */

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, prefersReducedData } from '@motion/env';

let lenis: Lenis | null = null;
let wired = false;

function tick(time: number): void {
  // gsap ticker passes seconds; Lenis.raf expects milliseconds.
  lenis?.raf(time * 1000);
}

function initSmooth(): void {
  destroySmooth();
  if (prefersReducedMotion() || prefersReducedData()) return;
  // Smooth wheel only makes sense for fine pointers; leave touch momentum native.
  if (!window.matchMedia('(pointer: fine)').matches) return;

  lenis = new Lenis({
    duration: 1.05,
    easing: (t: number): number => 1 - Math.pow(1 - t, 3), // ease-out cubic
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
}

function destroySmooth(): void {
  if (lenis === null) return;
  gsap.ticker.remove(tick);
  lenis.destroy();
  lenis = null;
}

export function wireSmooth(): void {
  if (wired) return;
  wired = true;
  document.addEventListener('astro:page-load', initSmooth);
  document.addEventListener('astro:before-swap', destroySmooth);
}

wireSmooth();
