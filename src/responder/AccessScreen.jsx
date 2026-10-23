// Responder sign-in: your name, your zone, and the shared access code.
// The code is really the password of one shared Firebase account
// (responder@readynet-milpitas.app). The CERT coordinator changes the code by
// changing that password in the Firebase console.
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';
import { ZONES } from '../data/zones.js';

export default function AccessScreen({ prefs, onSavePrefs, responderEmail }) {
  const [name, setName] = useState(prefs.name);
  const [zone, setZone] = useState(prefs.zone);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function unlock(event) {
    event.preventDefault(); // stop the form from reloading the page
    setBusy(true);
    setError('');
    onSavePrefs({ name: name.trim(), zone }); // remember name + zone on this phone
    try {
      await signInWithEmailAndPassword(auth, responderEmail, code.trim());
      // Success: ResponderApp notices the sign-in and shows the Do next list.
    } catch (err) {
      setError(err.code === 'auth/network-request-failed'
        ? 'No signal. Responder sign-in needs internet.'
        : 'That code isn’t valid. Check with your CERT leader.');
      setBusy(false);
    }
  }

  const canUnlock = name.trim() !== '' && code.trim() !== '' && !busy;

  return (
    <main className="r-content r-access">
      <div className="r-lock-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
      </div>
      <h1 className="title">Responder access</h1>
      <div className="r-access-text">Only verified CERT members and first responders can see check-ins. Enter your name and the access code from your CERT leader.</div>

      <form className="r-form" onSubmit={unlock}>
        <label htmlFor="r-name" className="r-label">Your name</label>
        <input id="r-name" className="r-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />

        <label htmlFor="r-zone" className="r-label">Your zone</label>
        <select id="r-zone" className="r-input" value={zone} onChange={(e) => setZone(Number(e.target.value))}>
          {ZONES.map((z) => <option key={z.zone} value={z.zone}>Zone {z.zone}</option>)}
        </select>

        <label htmlFor="r-code" className="r-label">Access code</label>
        <input id="r-code" className="r-input r-code" type="password" autoComplete="off" value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }} />

        {error && <div className="r-error" role="alert">{error}</div>}

        <button type="submit" className="btn r-btn-dark" disabled={!canUnlock}>{busy ? 'Checking…' : 'Unlock'}</button>
      </form>
    </main>
  );
}
