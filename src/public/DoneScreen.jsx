// Last screen: a summary of the check-in, plus "See first-aid steps again" and "Check in again".
import { TRIAGE, RISK_LABEL } from '../data/results.js';

export default function DoneScreen({ result, forOther, zone, photoCount, onShowGuides, onRestart }) {
  const rows = [
    ['Checked in for', forOther ? 'Someone else' : 'Myself'],
    ['Status', TRIAGE[result.color].name],
    ['People', result.peopleLine],
    ['Area', RISK_LABEL[result.risk]],
    ['Photos', photoCount > 0 ? `${photoCount} sent` : 'None'],
  ];

  return (
    <>
      <div className="done-check" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
      </div>
      <h1 className="title" tabIndex={-1}>Check-in complete</h1>
      <div className="hint">
        {/* Only name the zone if GPS put the location inside one */}
        Your check-in is on the CERT and first-responder list{zone ? ` for Zone ${zone}` : ''}. Check in again if anything changes.
      </div>
      <div className="card">
        {rows.map(([label, value]) => (
          <div key={label} className="summary-row">
            <div className="summary-label">{label}</div>
            <div className="summary-value">{value}</div>
          </div>
        ))}
      </div>
      {result.guides.length > 0 && (
        <button className="btn btn-outline" onClick={onShowGuides}>See first-aid steps again</button>
      )}
      <button className="btn btn-plain" onClick={onRestart}>Check in again</button>
    </>
  );
}
