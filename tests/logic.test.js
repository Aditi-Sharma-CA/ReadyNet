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
