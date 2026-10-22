// zoneForLocation: given a GPS point, returns the CERT zone number it falls inside,
// or null if it is outside every zone (for example, outside Milpitas).
import { ZONES } from '../data/zones.js';

export function zoneForLocation(lat, lng) {
  const match = ZONES.find(
    (z) => lat <= z.north && lat >= z.south && lng >= z.west && lng <= z.east
  );
  return match ? match.zone : null;
}
