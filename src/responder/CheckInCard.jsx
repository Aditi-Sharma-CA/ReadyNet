// One check-in (or several merged reports) as a card in the responder list.
// variant: 'need' (full card in Do next), 'progress' (In progress), 'resolved' (small).
import { minutesAgo, formatClock } from '../logic/time.js';

const COLOR_LABEL = { red: 'RED', yellow: 'YELLOW', green: 'GREEN', white: 'WHITE' };
const STATUS_LABEL = { new: 'New', assigned: 'Assigned', reached: 'On scene', resolved: 'Resolved' };
const HISTORY_LABEL = { new: 'New', assigned: 'Assigned', reached: 'Reached', resolved: 'Resolved' };

export default function CheckInCard({ incident, rank, variant, now }) {
  const address = incident.address ||
    (incident.location ? `GPS ${incident.location.lat.toFixed(5)}, ${incident.location.lng.toFixed(5)}` : 'No address');

  // "New 2:18 PM → Assigned 2:30 PM · Team 2"
  const timeline = (incident.history || [])
    .map((h) => `${HISTORY_LABEL[h.status]} ${formatClock(h.at)}`)
    .join('  →  ') + (incident.teamName ? `  ·  ${incident.teamName}` : '');

  if (variant === 'resolved') {
    return (
      <div className="r-card r-card-resolved">
        <div className="r-card-small-title">{address} · Resolved</div>
        <div className="r-timeline">{timeline}</div>
      </div>
    );
  }

  // Older than 60 minutes: faded and marked "may be out of date"
  const age = minutesAgo(incident.updated, now);
  const stale = age > 60;
  const fresh = stale
    ? `Updated ${age} min ago · may be out of date`
    : age === 0 ? 'Updated just now' : `Updated ${age} min ago`;

  const peopleLine = `${incident.people} ${incident.people === 1 ? 'person' : 'people'} · ${incident.hurt} hurt`;

  // Navigate: GPS point if we have one, otherwise the typed address
  const query = incident.location
    ? `${incident.location.lat},${incident.location.lng}`
    : `${incident.address}, Milpitas, CA`;
  const navUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);

  const colorBadge = <span className={`r-badge r-badge-${incident.color}`}>{COLOR_LABEL[incident.color]}</span>;
  const zoneLabel = <span className="r-zone">{incident.zone ? `Zone ${incident.zone}` : 'Zone unknown'}</span>;

  return (
    <div className={'r-card' + (stale ? ' r-card-stale' : '')}>
      <div className="r-card-top">
        {variant === 'need' && <span className="r-rank">{rank}</span>}
        {colorBadge}
        {variant === 'need' && incident.trappedCount > 0 && (
          <span className="r-badge r-badge-trapped">{incident.trappedCount} TRAPPED</span>
        )}
        {variant === 'progress' && (
          <span className={`r-status r-status-${incident.status}`}>{STATUS_LABEL[incident.status]}</span>
        )}
        {zoneLabel}
      </div>

      <div className={variant === 'need' ? 'r-address' : 'r-address r-address-small'}>{address}</div>
      <div className="r-people">{peopleLine}{variant === 'progress' && incident.teamName ? ` · ${incident.teamName}` : ''}</div>

      {variant === 'need' && incident.reports > 1 && (
        <div className="r-merged">
          {incident.reports} reports merged into one · first {formatClock(incident.firstReport)}, latest {formatClock(incident.latestReport)}
        </div>
      )}
      {variant === 'need' && <div className="r-note">{incident.note}</div>}
      {variant === 'need' && incident.hazards.length > 0 && (
        <div className="r-chips">
          {incident.hazards.map((h) => <span key={h} className="r-chip">{h}</span>)}
        </div>
      )}

      <div className={stale ? 'r-fresh r-fresh-stale' : 'r-fresh'}>{fresh}</div>
      <div className="r-timeline">{timeline}</div>

      <div className="r-buttons">
        <a className="r-nav" href={navUrl} target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8z" /></svg>
          Navigate
        </a>
        {variant === 'need' && (
          <button className={incident.photoCount ? 'r-photos' : 'r-photos r-photos-none'} disabled={!incident.photoCount}>
            {incident.photoCount ? `Photos (${incident.photoCount})` : 'No photos'}
          </button>
        )}
      </div>
    </div>
  );
}
