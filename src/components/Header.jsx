// The dark bar at the top of every screen: Back button (optional), ReadyNet logo.
// onBack: function to run when Back is tapped. If it's missing, no Back button is shown.
export default function Header({ onBack }) {
  return (
    <header className="header">
      {onBack ? (
        <button className="header-back" onClick={onBack} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      ) : (
        <div className="header-side" />
      )}
      <div className="header-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F08C2E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l9 5v6c0 5-4 8-9 9-5-1-9-4-9-9V7z" /><path d="M12 8v8M8 12h8" /></svg>
        ReadyNet
      </div>
      <div className="header-side" />
    </header>
  );
}
