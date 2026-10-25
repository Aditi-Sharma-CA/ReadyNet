// guidesFor: picks which first-aid guides to show, in order, from the answers and color.
//   Recovery position  -> not responding but breathing (shown first)
//   Stop heavy bleeding -> heavy bleeding (firm pressure only; no tourniquet advice)
//   Trouble breathing   -> trouble breathing or chest pain
//   Broken bone         -> thinks a bone is broken, or can't walk
//   Signs of shock      -> confused, or the color is red or yellow
//   Minor wounds        -> green, and nothing else applies
import { GUIDES } from '../data/firstAid.js';

// Option positions (0 = first option in the list)
const TROUBLE_BREATHING = 0, HEAVY_BLEEDING = 1;        // breath
const ARM_OR_LEG = 0;                                   // bleedWhere
const CONFUSED = 1, NOT_RESPONDING = 2;                 // awake
const BONE_YES = 0;                                     // bone
const CANNOT_WALK = 1;                                  // walk

export function guidesFor(answers, color) {
  const out = [];

  if (answers.awake === NOT_RESPONDING) out.push(GUIDES.recovery);

  if (answers.breath === HEAVY_BLEEDING) {
    const guide = { ...GUIDES.bleeding, steps: [...GUIDES.bleeding.steps] };
    if (color === 'red') guide.tag = 'Do this first';
    if (answers.bleedWhere !== undefined && answers.bleedWhere !== ARM_OR_LEG) {
      guide.caution = GUIDES.bleedingBodyCaution; // head, neck or body: never tie
    }
    out.push(guide);
  }

  if (answers.breath === TROUBLE_BREATHING) out.push(GUIDES.breathing);

  if (answers.bone === BONE_YES || answers.walk === CANNOT_WALK) out.push(GUIDES.bone);

  if (answers.awake === CONFUSED || color === 'red' || color === 'yellow') out.push(GUIDES.shock);

  if (out.length === 0 && color === 'green') out.push(GUIDES.minorWounds);

  return out;
}
