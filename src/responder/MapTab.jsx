// Map tab: a real map of Milpitas (Leaflet + free OpenStreetMap tiles, no API key).
//   "Who needs help": a numbered dot for each open incident, in its triage color,
//                     with a thick dark ring if anyone is trapped. 1 = most urgent.
//   "Hazards":        purple dots where residents reported fire, collapse, flooding...
// Tapping a dot opens that card in the Do next tab.
// The map pictures need internet; if they fail, the Do next list still works.
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZONES } from '../data/zones.js';
import { groupDuplicates, isOpen, byPriority } from '../logic/ranking.js';

// The map opens fitted to all 8 zones (the whole of Milpitas), on any screen size
const ALL_ZONES = [
  [Math.min(...ZONES.map((z) => z.south)), Math.min(...ZONES.map((z) => z.west))],
  [Math.max(...ZONES.map((z) => z.north)), Math.max(...ZONES.map((z) => z.east))],
];

// zoneLabel: "Zone 6" text pinned inside the top-left corner of each zone
function zoneLabel(n) {
  return L.divIcon({ className: '', html: `<div class="map-zone-label">Zone ${n}</div>`, iconSize: null, iconAnchor: [-4, -4] });
}

// dotIcon: a round numbered marker drawn with HTML/CSS (styles in responder.css)
function dotIcon(label, kind, trapped) {
  return L.divIcon({
    className: '', // no default Leaflet styling
    html: `<div class="map-dot map-dot-${kind}${trapped ? ' map-dot-trapped' : ''}">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export default function MapTab({ checkins, zone, myZone, onPick }) {
  const [layer, setLayer] = useState('help'); // 'help' or 'hazards'
  const [tilesFailed, setTilesFailed] = useState(false);

  // Same incidents and order as the list: merged, open, most urgent first
  const open = groupDuplicates(checkins)
    .filter(isOpen)
    .filter((i) => zone === 'all' || i.zone === zone || i.zone == null)
    .sort(byPriority);
  const onMap = open.filter((i) => i.location);
  const shown = layer === 'help' ? onMap : onMap.filter((i) => i.hazards.length > 0);
  const noGps = open.length - onMap.length;

  return (
    <div className="r-stack">
      <div className="segmented">
        <button className={layer === 'help' ? 'seg seg-on' : 'seg'} onClick={() => setLayer('help')}>Who needs help</button>
        <button className={layer === 'hazards' ? 'seg seg-on' : 'seg'} onClick={() => setLayer('hazards')}>Hazards</button>
      </div>

      {tilesFailed && (
        <div className="r-error" role="status">The map needs internet to load. The Do next list still works.</div>
      )}

      <div className="r-map">
        <MapContainer bounds={ALL_ZONES} zoomSnap={0.25} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            eventHandlers={{ tileerror: () => setTilesFailed(true) }}
          />

          {/* Zone outlines (placeholder rectangles); your zone is drawn thicker */}
          {ZONES.map((z) => (
            <Rectangle
              key={z.zone}
              bounds={[[z.south, z.west], [z.north, z.east]]}
              pathOptions={{ color: '#0B1620', weight: z.zone === myZone ? 3 : 1, opacity: z.zone === myZone ? 0.9 : 0.4, fill: false }}
            />
          ))}
          {ZONES.map((z) => (
            <Marker key={'label' + z.zone} position={[z.north, z.west]} icon={zoneLabel(z.zone)} interactive={false} keyboard={false} />
          ))}

          {shown.map((incident) => {
            const number = open.indexOf(incident) + 1; // priority number
            const kind = layer === 'help' ? incident.color : 'hazard';
            return (
              <Marker
                key={incident.id}
                position={[incident.location.lat, incident.location.lng]}
                icon={dotIcon(number, kind, layer === 'help' && incident.trappedCount > 0)}
                title={`${number}. ${incident.address || 'GPS location'}, ${incident.color}` +
                  (incident.trappedCount ? `, ${incident.trappedCount} trapped` : '')}
                eventHandlers={{ click: () => onPick(incident) }}
              />
            );
          })}
        </MapContainer>
      </div>

      <div className="r-section-hint r-hint-flat">
        {layer === 'help'
          ? 'Dots are open check-ins, numbered by priority. A dark ring means someone is trapped. Tap one to open it in Do next.'
          : 'Purple dots are check-ins that reported fire, gas, collapse, flooding, power lines or blocked roads. Tap one to open it.'}
        {noGps > 0 && ` ${noGps} check-in${noGps === 1 ? ' has' : 's have'} no GPS and ${noGps === 1 ? 'is' : 'are'} only in the list.`}
      </div>
    </div>
  );
}
