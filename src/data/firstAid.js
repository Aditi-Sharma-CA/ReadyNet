// First-aid guide text, copied exactly from the approved prototype.
// PLACEHOLDER: to be reviewed by the fire department / a Stop the Bleed instructor.
// Edit the wording here; the rules for WHEN each guide shows are in src/logic/firstAid.js.
//
// tone sets the card color: red = urgent, blue = you can do this, gray = watch for.
// Each step is [short title, longer explanation].

export const GUIDES = {
  recovery: {
    tone: 'red',
    tag: 'Do this first',
    title: 'Recovery position',
    when: 'For someone who is not responding but is breathing. It keeps their airway open.',
    steps: [
      ['Check breathing', 'Look at the chest, listen and feel for breath for 10 seconds. If they are not breathing, shout for help and start CPR if you are trained.'],
      ['Arm out', 'Kneel beside them. Place the arm nearest you straight out at a right angle to their body.'],
      ['Hand to cheek', 'Bring their far arm across their chest and hold the back of their hand against the cheek nearest you.'],
      ['Bend the knee and roll', 'Bend their far knee up, then pull gently on that knee to roll them toward you onto their side.'],
      ['Open the airway', 'Tilt their head back slightly and keep the bent knee in front so they don’t roll over. Check their breathing every minute until help arrives.'],
    ],
    caution: 'If you think their neck or back is hurt, only roll them if they are vomiting or struggling to breathe.',
  },

  bleeding: {
    tone: 'red',
    tag: 'You can do this', // becomes "Do this first" when the color is red
    title: 'Stop heavy bleeding',
    steps: [
      ['Press hard', 'Put a clean cloth, shirt or towel on the wound and press firmly with both hands. Don’t lift it to check.'],
      ['Add, don’t remove', 'If blood soaks through, put more cloth on top and keep pressing.'],
      ['Hold it in place', 'Wrap a strip of blanket, a scarf or clothing tightly around the cloth so the pressure stays on.'],
    ],
  },
  // Extra step + caution for an arm or leg that is spurting or won't stop
  bleedingTieStep: ['Tie above the wound', 'Arm or leg still bleeding? Tie a belt or blanket strip tightly 2–3 inches above the wound, not on a joint. Twist it with a stick until the bleeding stops. Note the time and don’t loosen it.'],
  bleedingTieCaution: 'Tell responders a band is tied and what time you tied it.',
  // Caution for head, neck or body wounds
  bleedingBodyCaution: 'Head, neck or body wound: keep firm pressure only. Never tie anything around the neck.',

  breathing: {
    tone: 'red',
    tag: 'Do this first',
    title: 'Trouble breathing or chest pain',
    steps: [
      ['Sit them up', 'Help them sit leaning slightly forward. Loosen tight clothing.'],
      ['Use their medicine', 'If they have an inhaler or prescribed heart medicine, help them take it.'],
      ['Stay with them', 'Keep them calm and still. If they stop breathing, start CPR if you are trained.'],
    ],
  },

  bone: {
    tone: 'blue',
    tag: 'You can do this',
    title: 'Possible broken bone',
    steps: [
      ['Don’t straighten it', 'Leave the limb in the position you found it.'],
      ['Keep it still', 'Support it with rolled clothes, towels or blankets on both sides.'],
      ['Make a splint', 'Tie a rolled magazine or flat board along it, above and below the injury. Tie snug, not tight.'],
      ['Check circulation', 'Fingers or toes should stay warm and pink. If they turn pale, blue or numb, loosen the ties.'],
    ],
  },

  shock: {
    tone: 'gray',
    tag: 'Watch for',
    title: 'Signs of shock',
    when: 'Pale, cold, sweaty skin, fast breathing, or confusion.',
    steps: [
      ['Lie them down', 'Have them lie flat and keep them still.'],
      ['Keep them warm', 'Cover them with a blanket or coat.'],
      ['No food or drink', 'Don’t give food or water if they are badly hurt.'],
    ],
  },

  minorWounds: {
    tone: 'blue',
    tag: 'You can do this',
    title: 'Clean and cover minor wounds',
    steps: [
      ['Rinse', 'Rinse with clean water if you have it.'],
      ['Cover', 'Cover with a clean cloth or bandage and keep it dry.'],
    ],
  },
};

// The sentence above the guides, depending on the triage color
export const GUIDE_INTRO = {
  red: 'Help is on the way. These steps can save a life while you wait.',
  yellow: 'CERT volunteers reach the most serious injuries first. You can start these steps yourself.',
  other: 'You can take care of this yourself while volunteers help the most serious injuries.',
};

export const GUIDE_FOOTER = 'These steps don’t replace medical care. If someone gets worse, check in again.';
