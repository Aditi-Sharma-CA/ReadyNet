// First screen: the emergency alert, "Check in now", and the link to the responder view.
export default function AlertScreen({ onStart, onOpenResponder }) {
  return (
    <>
      <div className="alert-card">
        <div className="alert-eyebrow">Emergency alert</div>
        <h1 className="alert-title" tabIndex={-1}>Earthquake reported in Milpitas</h1>
        <div className="alert-body">Check in so CERT volunteers and first responders know where help is needed most.</div>
      </div>
      <div className="card">
        <div className="card-title">Takes about 1 minute</div>
        <div className="hint">Share your location, how many people are with you, and answer questions about injuries and your surroundings. You can also check in for someone else.</div>
      </div>
      <button className="btn btn-action" onClick={onStart}>Check in now</button>
      <div className="small-note center">This app does not replace 911. Keep trying 911 for life-threatening emergencies.</div>
      <div className="divider-section">
        <div className="hint">CERT member or first responder?</div>
        <button className="btn btn-outline" onClick={onOpenResponder}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
          Open the responder view
        </button>
      </div>
    </>
  );
}
