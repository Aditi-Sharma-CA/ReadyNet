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

// hazardsFrom: the list of hazard labels responders see as chips,
// e.g. ["Fire, smoke or gas", "Collapsed building"].
const HAZARD_LABELS = {
  fire: 'Fire, smoke or gas',
  collapse: 'Collapsed building',
  flood: 'Flooding',
  power: 'Power lines down or power out',
  roads: 'Roads blocked',
};

export function hazardsFrom(answers) {
  return Object.keys(HAZARD_LABELS)
    .filter((id) => answers[id] === YES)
    .map((id) => HAZARD_LABELS[id]);
}
