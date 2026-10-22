// Every question the resident sees, copied exactly from the approved prototype.
// Each option has a label and (for medical questions) a score:
//   3 = red, 2 = yellow, 1 = green, 0 = white.
// Answers are saved as the option's position in the list (0 = first option).
// textOther is used instead of text when checking in for someone else.

export const WHO = {
  id: 'who',
  section: 'Who',
  text: 'Who are you checking in for?',
  hint: 'You can check in for a neighbor, family member or anyone near you without a phone.',
  options: [{ label: 'Myself' }, { label: 'Someone else' }],
};

// Always asked
export const INJURIES = [
  {
    id: 'injured',
    section: 'Injuries',
    text: 'Are you injured?',
    textOther: 'Are they injured?',
    hint: 'If several people are hurt, answer for the most seriously hurt.',
    options: [
      { label: 'Seriously', score: 3 },
      { label: 'Yes, but it can wait', score: 2 },
      { label: 'Minor injury', score: 1 },
      { label: 'No', score: 0 },
    ],
  },
  {
    id: 'walk',
    section: 'Injuries',
    text: 'Can you walk on your own?',
    textOther: 'Can they walk on their own?',
    options: [
      { label: 'Yes', score: 0 },
      { label: 'No', score: 2 },
    ],
  },
  {
    id: 'breath',
    section: 'Injuries',
    text: 'Any trouble breathing, chest pain or heavy bleeding?',
    options: [
      { label: 'Trouble breathing or chest pain', score: 3 },
      { label: 'Heavy bleeding', score: 0 }, // scored by the bleeding questions instead
      { label: 'No', score: 0 },
    ],
  },
  {
    id: 'water',
    section: 'Injuries',
    text: 'Do you have safe water and food for the next 24 hours?',
    textOther: 'Do they have safe water and food for the next 24 hours?',
    options: [
      { label: 'Yes', score: 0 },
      { label: 'No', score: 0 }, // not a medical score, saved as a need
    ],
  },
  {
    id: 'meds',
    section: 'Injuries',
    text: 'Does anyone need medicine, oxygen or care they don’t have?',
    options: [
      { label: 'Yes, needed now', score: 3 },
      { label: 'Within a day', score: 0 },
      { label: 'No', score: 0 },
    ],
  },
];

// Only asked if breath = "Heavy bleeding"
export const BLEEDING = [
  {
    id: 'bleedWhere',
    section: 'Bleeding',
    text: 'Where is the bleeding?',
    options: [
      { label: 'Arm or leg', score: 0 },
      { label: 'Head or neck', score: 0 },
      { label: 'Chest, belly or back', score: 0 },
    ],
  },
  {
    id: 'bleedType',
    section: 'Bleeding',
    text: 'What does the bleeding look like?',
    hint: 'Choose the closest match.',
    options: [
      { label: 'Spurting or pulsing', score: 3 },
      { label: 'Steady flow that soaks a cloth', score: 2 },
      { label: 'Slow ooze or seeping', score: 1 },
    ],
  },
  {
    id: 'bleedPress',
    section: 'Bleeding',
    text: 'Does it slow down when you press firmly on it?',
    hint: 'Press hard with a clean cloth for a few minutes, then answer.',
    options: [
      { label: 'Yes, it slows or stops', score: 0 },
      { label: 'No, it keeps bleeding', score: 3 },
    ],
  },
];

// Only asked if injured is not "No"
export const INJURY_CHECK = [
  {
    id: 'awake',
    section: 'Injury check',
    text: 'Is the injured person awake and able to talk normally?',
    options: [
      { label: 'Yes', score: 0 },
      { label: 'Confused or very sleepy', score: 3 },
      { label: 'Not responding, but breathing', score: 3 },
    ],
  },
  {
    id: 'bone',
    section: 'Injury check',
    text: 'Do you think a bone is broken?',
    hint: 'Signs: a limb at an odd angle, swelling, or too painful to move.',
    options: [
      { label: 'Yes', score: 2 },
      { label: 'No', score: 0 },
    ],
  },
];

// Always asked. No scores: surroundings change the area risk, never the triage color.
export const SURROUNDINGS = [
  { id: 'trapped', section: 'Surroundings', text: 'Is anyone trapped?', options: [{ label: 'Yes' }, { label: 'No' }, { label: 'Not sure' }] },
  { id: 'fire', section: 'Surroundings', text: 'Do you see fire or smoke, or smell gas?', options: [{ label: 'Yes' }, { label: 'No' }] },
  { id: 'collapse', section: 'Surroundings', text: 'Are buildings collapsed or badly cracked?', options: [{ label: 'Yes' }, { label: 'No' }] },
  { id: 'flood', section: 'Surroundings', text: 'Is there flooding or rising water?', options: [{ label: 'Yes' }, { label: 'No' }] },
  { id: 'power', section: 'Surroundings', text: 'Are power lines down or is the power out?', options: [{ label: 'Yes' }, { label: 'No' }] },
  { id: 'roads', section: 'Surroundings', text: 'Are roads blocked or impassable?', options: [{ label: 'Yes' }, { label: 'No' }] },
];

// Shown for injury questions without their own "someone else" wording
export const OTHER_PERSON_HINT = 'Answer for the person you’re checking in for.';

// The counter screens (people, hurt, trapped)
export const COUNTS = {
  people: { section: 'People', text: 'How many people are at this location?', hint: 'Count everyone, including you. One check-in can cover a whole household.', min: 1, max: 30 },
  hurt: { section: 'People', text: 'How many of them are hurt?', hint: 'Count anyone with an injury, even a minor one.', min: 0, max: 30 },
  trappedN: { section: 'Surroundings', text: 'How many people are trapped?', hint: 'Your best guess is fine. Responders will confirm.', min: 1, max: 20 },
};
