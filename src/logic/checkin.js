// buildCheckIn: turns the resident's answers into the record saved in the database
// (the fields are listed in HANDOVER.md section 5). The color, risk, hazards and
// note are all worked out here on the phone, so no server code is needed.
// ownerUid and the server timestamps are added when it is sent (see saveCheckIn.js).
import { colorFromAnswers } from './triage.js';
import { areaRisk, hazardsFrom, isTrapped } from './risk.js';
import { buildNote } from './note.js';
import { zoneForLocation } from './zone.js';

export function buildCheckIn({ answers, counts, address, location }, clientTime) {
  return {
    forWhom: answers.who === 1 ? 'other' : 'self',
    address: address.trim(),
    location: location || null,
    zone: location ? zoneForLocation(location.lat, location.lng) : null,
    people: counts.people,
    hurt: counts.hurt,
    trappedCount: isTrapped(answers) ? counts.trappedN : 0,
    answers,
    color: colorFromAnswers(answers),
    risk: areaRisk(answers),
    hazards: hazardsFrom(answers),
    note: buildNote(answers, counts),
    photoCount: 0,
    status: 'new',
    teamId: null,
    teamName: null,
    history: [{ status: 'new', at: clientTime, by: 'resident' }],
    clientTime, // phone's clock (ms), so times show even before the server replies
    demo: false,
    schemaVersion: 1,
  };
}
