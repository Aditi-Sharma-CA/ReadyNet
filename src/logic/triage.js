// colorFromAnswers: decides the triage color.
// Each medical answer has a score (3 = red, 2 = yellow, 1 = green, 0 = white).
// The color comes from the HIGHEST score, so one serious answer is enough for red.
// Surroundings answers (fire, trapped, flooding...) never change the color:
// they change the area risk instead (see risk.js).
import { medicalQuestions } from './flow.js';

const COLOR_FOR_SCORE = ['white', 'green', 'yellow', 'red'];

export function triageScore(answers) {
  let highest = 0;
  medicalQuestions(answers).forEach((question) => {
    const picked = answers[question.id];
    if (picked !== undefined) highest = Math.max(highest, question.options[picked].score);
  });
  return highest;
}

export function colorFromAnswers(answers) {
  return COLOR_FOR_SCORE[triageScore(answers)];
}
