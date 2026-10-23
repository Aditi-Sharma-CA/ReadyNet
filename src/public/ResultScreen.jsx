// Result screen, shown right after the questions:
// sent banner, rescue banner (if trapped), triage color card, area risk, first-aid guides.
// "result" is worked out in CheckInFlow (color, risk, guides, peopleLine...).
import { TRIAGE, RISK_LABEL } from '../data/results.js';
import { GUIDE_INTRO, GUIDE_FOOTER } from '../data/firstAid.js';

export default function ResultScreen({ result, forOther, trappedCount, onContinue }) {
  const triage = TRIAGE[result.color];
  const guideIntro = GUIDE_INTRO[result.color] || GUIDE_INTRO.other;

  return (
    <>
      {/* Day 2: this banner will say "Saved — will send when you have signal" until Firebase confirms */}
      <div className="banner banner-sent" role="status">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
        <div>Check-in sent to CERT and first responders · {result.peopleLine}</div>
      </div>

      {result.trapped && (
        <div className="banner banner-rescue">
          Rescue alert sent for {trappedCount} {trappedCount === 1 ? 'trapped person' : 'trapped people'}. First responders have the location.
        </div>
      )}

      {/* The color is always written as a word too, never shown by color alone */}
      <div className={`status-card status-${result.color}`}>
        <div className="status-label">{forOther ? 'Their status' : 'Your status'}</div>
        <h1 className="status-name" tabIndex={-1}>{triage.name}</h1>
        <div className="status-meaning">{triage.meaning}</div>
      </div>

      <div className={`risk risk-${result.risk}`}>
        <div className="risk-label">Area</div>
        <div className="risk-value">{RISK_LABEL[result.risk]}</div>
      </div>

      {result.guides.length > 0 && (
        <div className="guides">
          <h2 className="guides-title">What you can do right now</h2>
          <div className="hint">{guideIntro}</div>
          {result.guides.map((guide) => (
            <GuideCard key={guide.title} guide={guide} />
          ))}
          <div className="small-note">{GUIDE_FOOTER}</div>
        </div>
      )}

      <button className="btn btn-primary" onClick={onContinue}>Continue</button>
    </>
  );
}

// One first-aid guide: tag + title, optional "when" line, numbered steps, optional caution.
function GuideCard({ guide }) {
  return (
    <div className={`guide guide-${guide.tone}`}>
      <div className="guide-head">
        <div className="guide-tag">{guide.tag}</div>
        <h3 className="guide-title">{guide.title}</h3>
      </div>
      {guide.when && <div className="small-hint">{guide.when}</div>}
      <ol className="guide-steps">
        {guide.steps.map(([title, body], index) => (
          <li key={title} className="guide-step">
            <div className="guide-num" aria-hidden="true">{index + 1}</div>
            <div>
              <div className="guide-step-title">{title}</div>
              <div className="guide-step-body">{body}</div>
            </div>
          </li>
        ))}
      </ol>
      {guide.caution && <div className="guide-caution">{guide.caution}</div>}
    </div>
  );
}
