// Automatic checks for the rules in src/logic/. Run them with: npm test
// Each test gives the rules some answers and checks the result is what the spec says
// (HANDOVER.md section 14, acceptance checklist).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colorFromAnswers } from '../src/logic/triage.js';
import { areaRisk, hazardsFrom } from '../src/logic/risk.js';
import { guidesFor } from '../src/logic/firstAid.js';
import { buildSteps, cleanAnswers } from '../src/logic/flow.js';
import { buildNote } from '../src/logic/note.js';
import { buildCheckIn } from '../src/logic/checkin.js';
import { zoneForLocation } from '../src/logic/zone.js';
import { priority, byPriority, needsTeam, groupDuplicates, metersBetween } from '../src/logic/ranking.js';

// Answers are option positions: 0 = first option. This person is not hurt at all.
const NOT_HURT = { who: 0, injured: 3, walk: 0, breath: 2, water: 0, meds: 2 };
const COUNTS = { people: 4, hurt: 2, trappedN: 2 };

function guideTitles(answers) {
  return guidesFor(answers, colorFromAnswers(answers)).map((g) => g.title);
}

test('triage color', () => {
  assert.equal(colorFromAnswers({ ...NOT_HURT, injured: 0 }), 'red', 'Seriously injured');
  assert.equal(colorFromAnswers({ ...NOT_HURT, breath: 1, bleedWhere: 0, bleedType: 0, bleedPress: 0 }), 'red', 'spurting bleeding');
  assert.equal(colorFromAnswers({ ...NOT_HURT, breath: 1, bleedWhere: 0, bleedType: 1, bleedPress: 0 }), 'yellow', 'steady bleeding that slows with pressure');
  assert.equal(colorFromAnswers({ ...NOT_HURT, injured: 2, awake: 0, bone: 1 }), 'green', 'minor injury');
  assert.equal(colorFromAnswers(NOT_HURT), 'white', 'no injuries');
});

test('surroundings never change the color, only the area risk', () => {
  const everythingBad = { ...NOT_HURT, trapped: 0, fire: 0, collapse: 0, flood: 0, power: 0, roads: 0 };
  assert.equal(colorFromAnswers(everythingBad), 'white');
  assert.equal(areaRisk({ ...NOT_HURT, fire: 0 }), 'high', 'fire');
  assert.equal(areaRisk({ ...NOT_HURT, trapped: 0 }), 'high', 'trapped');
  assert.equal(areaRisk({ ...NOT_HURT, trapped: 1, power: 0, roads: 0 }), 'low', 'power and roads only');
});

test('bleeding guide: tie above the wound only for an arm or leg', () => {
  const arm = guidesFor({ ...NOT_HURT, breath: 1, bleedWhere: 0, bleedType: 0, bleedPress: 0 }, 'red');
  const head = guidesFor({ ...NOT_HURT, breath: 1, bleedWhere: 1, bleedType: 0, bleedPress: 1 }, 'red');
  const stepTitles = (guides) => guides.find((g) => g.title === 'Stop heavy bleeding').steps.map((s) => s[0]);
  assert.ok(stepTitles(arm).includes('Tie above the wound'));
  assert.ok(!stepTitles(head).includes('Tie above the wound'));
});

test('first-aid guides', () => {
  assert.equal(guideTitles({ ...NOT_HURT, injured: 0, awake: 2, bone: 1 })[0], 'Recovery position', 'not responding: recovery first');
  assert.deepEqual(guideTitles({ ...NOT_HURT, injured: 2, awake: 0, bone: 1 }), ['Clean and cover minor wounds']);
  assert.deepEqual(guideTitles({ ...NOT_HURT, walk: 1 }), ['Possible broken bone', 'Signs of shock']);
  assert.deepEqual(guideTitles(NOT_HURT), []);
});

test('flow: follow-up questions appear and disappear', () => {
  const ids = (answers) => buildSteps(answers).map((s) => s.question?.id ?? s.key ?? s.type);
  assert.ok(ids({ breath: 1 }).includes('bleedWhere'), 'heavy bleeding adds bleeding questions');
  assert.ok(!ids({ injured: 3 }).includes('awake'), 'not injured skips the injury check');
  assert.ok(ids({ trapped: 0 }).includes('trappedN'), 'trapped = Yes asks how many');
  // Changing "Heavy bleeding" to "No" throws away the old bleeding answers
  assert.deepEqual(cleanAnswers({ injured: 0, breath: 2, bleedWhere: 0, awake: 2 }), { injured: 0, breath: 2, awake: 2 });
});

test('responder note and hazards', () => {
  const answers = { ...NOT_HURT, injured: 0, breath: 1, bleedWhere: 0, bleedType: 0, bleedPress: 1, awake: 2, bone: 1, trapped: 0, fire: 0 };
  assert.equal(
    buildNote(answers, COUNTS),
    'Seriously injured. Heavy bleeding, arm or leg, spurting, not slowing with pressure. Not responding, but breathing. 2 trapped.'
  );
  assert.equal(buildNote(NOT_HURT, COUNTS), 'No injuries reported.');
  assert.deepEqual(hazardsFrom({ fire: 0, collapse: 0, flood: 1, power: 0 }), ['Fire, smoke or gas', 'Collapsed building', 'Power lines down or power out']);
});

test('check-in record', () => {
  const record = buildCheckIn({
    answers: { ...NOT_HURT, trapped: 1 },
    counts: COUNTS,
    address: ' 1450 Oak St ',
    location: { lat: 37.42767, lng: -121.883, accuracyM: 10 },
  }, 1000);
  assert.equal(record.address, '1450 Oak St');
  assert.equal(record.zone, 6);
  assert.equal(record.trappedCount, 0, 'trapped count is 0 unless trapped = Yes');
  assert.equal(record.status, 'new');
  assert.equal(record.forWhom, 'self');
  assert.equal(zoneForLocation(37.77, -122.42), null, 'outside Milpitas has no zone');
});

test('ranking: trapped or red first, then yellow, then green', () => {
  const card = (color, trappedCount, hurt, people) => ({ color, trappedCount, hurt, people, status: 'new' });
  const list = [
    card('green', 0, 3, 5),
    card('yellow', 0, 4, 8),
    card('red', 0, 1, 1),
    card('yellow', 1, 1, 3),  // trapped jumps above red-without-trapped
    card('red', 2, 2, 4),
  ];
  const order = [...list].sort(byPriority).map((c) => `${c.color}/${c.trappedCount}`);
  assert.deepEqual(order, ['red/2', 'yellow/1', 'red/0', 'yellow/0', 'green/0']);
  assert.ok(priority(card('red', 0, 3, 3)) > priority(card('red', 0, 2, 9)), 'more hurt beats more people');
  assert.equal(needsTeam(card('white', 0, 0, 2)), false, 'white with nobody trapped is not listed');
  assert.equal(needsTeam(card('white', 1, 0, 2)), true, 'white but trapped is listed');
});

test('merging duplicate reports', () => {
  const MIN = 60000;
  const T = 1_800_000_000_000; // a fixed time, in ms
  const report = (id, extra) => ({
    id, color: 'yellow', people: 2, hurt: 1, trappedCount: 0, hazards: [], photoCount: 0,
    status: 'new', address: '', location: null, zone: 6, note: id, clientTime: T, ...extra,
  });
  const oak = { lat: 37.42767, lng: -121.883 };
  const oak20m = { lat: 37.42785, lng: -121.883 };   // about 20 m north
  const far = { lat: 37.42950, lng: -121.883 };      // about 200 m north

  assert.ok(Math.abs(metersBetween(oak, oak20m) - 20) < 2, 'distance is about 20 m');

  const merged = groupDuplicates([
    report('a', { location: oak, people: 4, hazards: ['Collapsed building'], photoCount: 2 }),
    report('b', { location: oak20m, color: 'red', trappedCount: 2, hazards: ['Fire, smoke or gas'], clientTime: T + 18 * MIN, photoCount: 1 }),
    report('c', { location: far }),                                    // too far: separate
    report('d', { location: oak, clientTime: T + 90 * MIN }),          // too late: separate
  ]);
  assert.equal(merged.length, 3);
  const big = merged.find((i) => i.reports === 2);
  assert.equal(big.color, 'red', 'worst color');
  assert.equal(big.people, 4, 'biggest people count');
  assert.equal(big.trappedCount, 2, 'biggest trapped count');
  assert.deepEqual(big.hazards, ['Fire, smoke or gas', 'Collapsed building'], 'all hazards');
  assert.equal(big.photoCount, 3, 'all photos');
  assert.equal(big.latestReport - big.firstReport, 18 * MIN, 'first and latest report');

  // Same typed address merges even without GPS
  assert.equal(groupDuplicates([report('e', { address: '1450 Oak St.' }), report('f', { address: '1450  oak st' })]).length, 1);

  // A new report joins an incident that already has a team: status stays "assigned"
  const withTeam = groupDuplicates([
    report('g', { location: oak, status: 'assigned', teamName: 'Team 2' }),
    report('h', { location: oak20m, clientTime: T + 5 * MIN }),
  ]);
  assert.equal(withTeam.length, 1);
  assert.equal(withTeam[0].status, 'assigned');
  assert.deepEqual(withTeam[0].ids.sort(), ['g', 'h'], 'both check-ins update together');

  // Resolved check-ins are never merged
  assert.equal(groupDuplicates([report('i', { location: oak, status: 'resolved' }), report('j', { location: oak })]).length, 2);
});
