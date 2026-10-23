// Time helpers for the responder view.

// toMillis: turns a Firestore timestamp into milliseconds. A check-in that is still
// waiting in a phone's queue has no server time yet, so we use the phone's time instead.
export function toMillis(timestamp, fallback) {
  return timestamp && timestamp.toMillis ? timestamp.toMillis() : fallback;
}

// minutesAgo: whole minutes between "then" and "now" (both in ms). Never below 0.
export function minutesAgo(then, now) {
  return Math.max(0, Math.floor((now - then) / 60000));
}

// formatClock: 14:18 -> "2:18 PM"
export function formatClock(ms) {
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
