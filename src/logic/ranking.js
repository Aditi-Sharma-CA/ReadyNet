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

// ---------- Merging duplicate reports ----------
// After an earthquake, several neighbors may report the same collapsed house.
// groupDuplicates joins open check-ins that are close together into one incident:
//   within 50 m of each other (or the same address), AND within 60 minutes.
// The incident takes the worst color, the biggest counts, all hazards and photos,
// and the status that is furthest along. Resolved check-ins are never merged.

const MERGE_METERS = 50;
const MERGE_MINUTES = 60;
const STATUS_ORDER = ['new', 'assigned', 'reached', 'resolved'];

// metersBetween: distance between two GPS points ("haversine" formula for a round Earth)
export function metersBetween(a, b) {
  const R = 6371000; // Earth's radius in meters
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// normalizeAddress: "1450 Oak St." and "1450  oak st" become the same text
function normalizeAddress(address) {
  return (address || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// sameIncident: are these two check-ins reports of the same emergency?
function sameIncident(a, b) {
  const minutesApart = Math.abs(a.firstReport - b.firstReport) / 60000;
  if (minutesApart > MERGE_MINUTES) return false;
  const close = a.location && b.location && metersBetween(a.location, b.location) <= MERGE_METERS;
  const sameAddress = normalizeAddress(a.address) !== '' && normalizeAddress(a.address) === normalizeAddress(b.address);
  return Boolean(close || sameAddress);
}

// combine: turns a group of single-check-in incidents into one merged incident
function combine(group) {
  if (group.length === 1) return group[0];
  // The "lead" report: furthest-along status, then most urgent. Its team and history are shown.
  const lead = [...group].sort((a, b) =>
    STATUS_ORDER.indexOf(b.status) - STATUS_ORDER.indexOf(a.status) || priority(b) - priority(a))[0];
  const worst = [...group].sort(byPriority)[0];
  const maxOf = (field) => Math.max(...group.map((i) => i[field]));
  return {
    ...lead,
    color: [...group].sort((a, b) => TIER[b.color] - TIER[a.color])[0].color,
    people: maxOf('people'),
    hurt: maxOf('hurt'),
    trappedCount: maxOf('trappedCount'),
    hazards: [...new Set(group.flatMap((i) => i.hazards || []))],
    photoCount: group.reduce((sum, i) => sum + (i.photoCount || 0), 0),
    note: worst.note,
    address: lead.address || group.find((i) => i.address)?.address || '',
    location: lead.location || group.find((i) => i.location)?.location || null,
    zone: lead.zone ?? group.find((i) => i.zone != null)?.zone ?? null,
    ids: group.flatMap((i) => i.ids),
    reports: group.length,
    firstReport: Math.min(...group.map((i) => i.firstReport)),
    latestReport: Math.max(...group.map((i) => i.latestReport)),
    updated: maxOf('updated'),
  };
}

// groupDuplicates: the full list of incidents to show (merged where needed).
export function groupDuplicates(checkins) {
  const all = checkins.map(toIncident);
  const open = all.filter(isOpen);
  const resolved = all.filter((i) => !isOpen(i));

  // Put each open check-in into the first group it matches. If it matches several
  // groups, those groups are joined too (A near B, B near C -> A, B, C together).
  const groups = [];
  open.forEach((incident) => {
    const matching = groups.filter((g) => g.some((other) => sameIncident(incident, other)));
    const joined = [incident, ...matching.flat()];
    matching.forEach((g) => groups.splice(groups.indexOf(g), 1));
    groups.push(joined);
  });

  return [...groups.map(combine), ...resolved];
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
