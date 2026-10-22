// A counter screen with big − and + buttons (people, hurt, trapped).
// The number has aria-live so screen readers announce each change.
import { COUNTS } from '../data/questions.js';

export default function CountStep({ countKey, counter, value, onChange, onContinue }) {
  const info = COUNTS[countKey];
  return (
    <>
      <div className="eyebrow">{info.section} · {counter}</div>
      <h1 className="title" tabIndex={-1}>{info.text}</h1>
      <div className="hint">{info.hint}</div>
      <div className="counter-box">
        <button className="counter-btn counter-minus" onClick={() => onChange(value - 1)} aria-label="Fewer">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <div className="counter-value" aria-live="polite">{value}</div>
        <button className="counter-btn counter-plus" onClick={() => onChange(value + 1)} aria-label="More">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
      <button className="btn btn-primary" onClick={onContinue}>Continue</button>
    </>
  );
}
