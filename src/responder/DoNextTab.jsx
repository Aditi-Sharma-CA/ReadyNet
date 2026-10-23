// "Do next" tab: summary tiles, then three sections:
//   Do next      = new check-ins that need a team, most urgent first (numbered)
//   In progress  = a team is assigned or on scene
//   Resolved     = done (hidden until "Show resolved" is tapped)
import { useState } from 'react';
import CheckInCard from './CheckInCard.jsx';
import { toIncident, needsTeam, isOpen, byPriority } from '../logic/ranking.js';

export default function DoNextTab({ checkins, zone, now }) {
  const [showResolved, setShowResolved] = useState(false);

  const incidents = checkins.map(toIncident);

  // Zone filter. Check-ins with no zone (no GPS) show in every zone, so none are missed.
  const visible = incidents.filter((i) => zone === 'all' || i.zone === zone || i.zone == null);

  const needList = visible.filter(needsTeam).sort(byPriority);
  const inProgress = visible.filter((i) => i.status === 'assigned' || i.status === 'reached').sort(byPriority);
  const resolved = visible.filter((i) => i.status === 'resolved');
  const open = visible.filter(isOpen);

  const trapped = open.reduce((sum, i) => sum + i.trappedCount, 0);
  const hurt = open.reduce((sum, i) => sum + i.hurt, 0);

  return (
    <div className="r-stack">
      <div className="r-tiles">
        <div className="r-tile"><span className="r-tile-num">{needList.length}</span><span className="r-tile-label">Need a team</span></div>
        <div className="r-tile r-tile-red"><span className="r-tile-num">{trapped}</span><span className="r-tile-label">People trapped</span></div>
        <div className="r-tile"><span className="r-tile-num">{hurt}</span><span className="r-tile-label">People hurt</span></div>
      </div>

      <h2 className="r-section">Do next</h2>
      <div className="r-section-hint">Red and trapped first, then where the most people are hurt.</div>
      {needList.map((incident, index) => (
        <CheckInCard key={incident.id} incident={incident} rank={index + 1} variant="need" now={now} />
      ))}
      {needList.length === 0 && (
        <div className="r-empty">Every check-in here has a team. Check In progress below.</div>
      )}

      <h2 className="r-section">In progress</h2>
      {inProgress.map((incident) => (
        <CheckInCard key={incident.id} incident={incident} variant="progress" now={now} />
      ))}

      <button className="btn r-btn-light" onClick={() => setShowResolved(!showResolved)}>
        {showResolved ? 'Hide resolved' : 'Show resolved'} ({resolved.length})
      </button>
      {showResolved && resolved.map((incident) => (
        <CheckInCard key={incident.id} incident={incident} variant="resolved" now={now} />
      ))}
    </div>
  );
}
