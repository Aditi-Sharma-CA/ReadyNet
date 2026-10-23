// buildNote: writes a short plain-language note for responders from the answers,
// e.g. "Seriously injured. Heavy bleeding, arm or leg, spurting, not slowing with pressure. 2 trapped."
// Each list gives the phrase for each option (null = say nothing for that answer).
import { isTrapped } from './risk.js';

const PHRASES = {
  injured: ['Seriously injured', 'Injured, can wait', 'Minor injury', null],
  walk: [null, 'Cannot walk'],
  breath: ['Trouble breathing or chest pain', 'Heavy bleeding', null],
  bleedWhere: ['arm or leg', 'head or neck', 'chest, belly or back'],
  bleedType: ['spurting', 'steady flow', 'slow ooze'],
  bleedPress: ['slows with pressure', 'not slowing with pressure'],
  awake: [null, 'Confused or very sleepy', 'Not responding, but breathing'],
  bone: ['Possible broken bone', null],
  meds: ['Needs medicine, oxygen or care now', 'Needs medicine or care within a day', null],
  water: [null, 'No safe water or food for 24 hours'],
};

// phrase: the phrase for one question's answer, or null
function phrase(answers, id) {
  return answers[id] === undefined ? null : PHRASES[id][answers[id]];
}

export function buildNote(answers, counts) {
  const sentences = [
    phrase(answers, 'injured'),
    phrase(answers, 'walk'),
    // Bleeding becomes one sentence: "Heavy bleeding, arm or leg, spurting, ..."
    [phrase(answers, 'breath'), phrase(answers, 'bleedWhere'), phrase(answers, 'bleedType'), phrase(answers, 'bleedPress')]
      .filter(Boolean).join(', '),
    phrase(answers, 'awake'),
    phrase(answers, 'bone'),
    phrase(answers, 'meds'),
    phrase(answers, 'water'),
  ];
  if (isTrapped(answers)) sentences.push(`${counts.trappedN} trapped`);
  if (answers.trapped === 2) sentences.push('Not sure if anyone is trapped');

  const note = sentences.filter(Boolean).map((s) => s + '.').join(' ');
  return note || 'No injuries reported.';
}
