/**
 * env.ts — single source of truth for motion capability + user-preference gates.
 * Every motion module (scroll choreography, the 3D hero) checks these before animating.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const REDUCED_DATA_QUERY = '(prefers-reduced-data: reduce)';

/** True when the user asked the OS to minimise motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Subscribe to runtime changes of the reduced-motion preference.
 * Returns an unsubscribe function.
 */
export function onMotionPreferenceChange(callback: (_reduced: boolean) => void): () => void {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  const handler = (event: MediaQueryListEvent): void => callback(event.matches);
  mql.addEventListener('change', handler);
  return (): void => mql.removeEventListener('change', handler);
}

/** True when the user/network asked to save data — skip heavy deferred assets. */
export function prefersReducedData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData === true) return true;
  return window.matchMedia(REDUCED_DATA_QUERY).matches;
}
