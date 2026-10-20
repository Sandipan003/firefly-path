/**
 * Analytics events (build prompt §6). Phase 6 sends these to Firebase
 * Analytics; until then they are only printed in development.
 */
export type EventName =
  | 'level_start'
  | 'level_complete'
  | 'level_fail'
  | 'show_again_used'
  | 'hint_used'
  | 'ad_impression'
  | 'rewarded_earned'
  | 'daily_complete';

export function logEvent(name: EventName, params: Record<string, string | number | boolean> = {}): void {
  if (__DEV__) console.log(`[analytics] ${name}`, params);
}
