// areaRisk: "high" if anyone is trapped, or there is fire/smoke/gas,
// collapsed buildings or flooding. Otherwise "low".
// (For every surroundings question, "Yes" is the first option, position 0.)
const YES = 0;

export function areaRisk(answers) {
  const danger = ['trapped', 'fire', 'collapse', 'flood'].some((id) => answers[id] === YES);
  return danger ? 'high' : 'low';
}

// isTrapped: true if "Is anyone trapped?" was answered Yes.
export function isTrapped(answers) {
  return answers.trapped === YES;
}
