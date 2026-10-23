// Ranking: decides the order of the "Do next" list, following CERT triage
// ("the greatest good for the greatest number"):
//   trapped or red first, then yellow, then green;
//   within the same tier: more trapped, then more hurt, then more people.
import { toMillis } from './time.js';

const TIER = { red: 3, yellow: 2, green: 1, white: 0 };

// priority: a bigger number = help sooner. (Same formula as the approved prototype.)
export function priority(incident) {
  return TIER[incident.color] * 1000
    + (incident.trappedCount > 0 ? 3000 : 0)
    + incident.trappedCount * 50
    + incident.hurt * 10
    + incident.people;
}

// byPriority: use with .sort() to put the most urgent first.
export function byPriority(a, b) {
  return priority(b) - priority(a);
}

// toIncident: one check-in on its own, in the same shape as a merged incident
// (so the screens don't care whether reports were merged).
export function toIncident(checkin) {
  const first = toMillis(checkin.createdAt, checkin.clientTime);
  return {
    ...checkin,
    ids: [checkin.id],        // every check-in in this incident
    reports: 1,
    firstReport: first,
    latestReport: first,
    updated: toMillis(checkin.updatedAt, checkin.clientTime),
  };
}

// needsTeam: shown in "Do next" = new, and not "white with nobody trapped"
// (uninjured check-ins only count toward the totals and the map).
export function needsTeam(incident) {
  return incident.status === 'new' && (incident.color !== 'white' || incident.trappedCount > 0);
}

// isOpen: anything not resolved yet
export function isOpen(incident) {
  return incident.status !== 'resolved';
}
