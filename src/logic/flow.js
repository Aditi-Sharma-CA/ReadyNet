// Flow rules: which screens the resident sees, and in what order.
// The list depends on the answers so far. For example, the bleeding questions
// only appear after "Heavy bleeding" is picked.
import { WHO, INJURIES, BLEEDING, INJURY_CHECK, SURROUNDINGS, COUNTS } from '../data/questions.js';

// Option positions the flow checks (0 = first option in the list)
const HEAVY_BLEEDING = 1; // breath: "Heavy bleeding"
const NOT_INJURED = 3;    // injured: "No"
const TRAPPED_YES = 0;    // trapped: "Yes"

// medicalQuestions: the injury questions that apply to these answers.
export function medicalQuestions(answers) {
  let list = [...INJURIES];
  if (answers.breath === HEAVY_BLEEDING) list = list.concat(BLEEDING);
  if (answers.injured !== undefined && answers.injured !== NOT_INJURED) list = list.concat(INJURY_CHECK);
  return list;
}

// buildSteps: the full ordered list of screens for these answers.
export function buildSteps(answers) {
  const steps = [
    { type: 'alert' },
    { type: 'location' },
    { type: 'question', question: WHO },
    { type: 'count', key: 'people' },
    { type: 'count', key: 'hurt' },
  ];
  medicalQuestions(answers).forEach((q) => steps.push({ type: 'question', question: q }));
  SURROUNDINGS.forEach((q) => {
    steps.push({ type: 'question', question: q });
    // Ask how many are trapped right after "Is anyone trapped?" = Yes
    if (q.id === 'trapped' && answers.trapped === TRAPPED_YES) steps.push({ type: 'count', key: 'trappedN' });
  });
  steps.push({ type: 'result' }, { type: 'photos' }, { type: 'done' });
  return steps;
}

// cleanAnswers: removes answers to questions that are no longer in the flow.
// Example: someone answers the bleeding questions, goes Back and changes
// "Heavy bleeding" to "No". The old bleeding answers are thrown away.
export function cleanAnswers(answers) {
  const stillAsked = buildSteps(answers)
    .filter((s) => s.type === 'question')
    .map((s) => s.question.id);
  const cleaned = {};
  stillAsked.forEach((id) => {
    if (answers[id] !== undefined) cleaned[id] = answers[id];
  });
  return cleaned;
}

// isQuestionStep: true for screens that show the progress bar (questions and counters).
export function isQuestionStep(step) {
  return step.type === 'question' || step.type === 'count';
}

// sectionOf: the section name shown above a question, e.g. "Injuries".
export function sectionOf(step) {
  return step.type === 'question' ? step.question.section : COUNTS[step.key].section;
}

// sectionCounter: "2 of 5" = this screen's position inside its section.
export function sectionCounter(steps, step) {
  const sameSection = steps.filter((s) => isQuestionStep(s) && sectionOf(s) === sectionOf(step));
  return `${sameSection.indexOf(step) + 1} of ${sameSection.length}`;
}

// progressPercent: how far through the questions the resident is (0-100).
export function progressPercent(steps, step) {
  const questionSteps = steps.filter(isQuestionStep);
  const position = questionSteps.indexOf(step);
  return position >= 0 ? Math.round(((position + 1) / questionSteps.length) * 100) : 0;
}
