// Demo mode buttons (only shown when VITE_DEMO=true): load or clear the sample data.
import { useState } from 'react';
import { loadDemoData, clearDemoData } from '../demo/loadDemoData.js';

export default function DemoControls() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action, doneText) {
    setBusy(true);
    setMessage('Working…');
    try {
      await action();
      setMessage(doneText);
    } catch (error) {
      console.error(error);
      setMessage('That didn’t work. Check the internet connection and try again.');
    }
    setBusy(false);
  }

  return (
    <div className="r-demo">
      <div className="r-demo-title">Demo mode</div>
      <div className="r-section-hint r-hint-flat">Sample check-ins and teams for showing ReadyNet. Not real people.</div>
      <div className="r-buttons">
        <button className="r-small-btn r-demo-btn" disabled={busy} onClick={() => run(loadDemoData, 'Demo data loaded.')}>Load demo data</button>
        <button className="r-small-btn r-demo-btn" disabled={busy} onClick={() => run(clearDemoData, 'Demo data cleared.')}>Clear demo data</button>
      </div>
      {message && <div className="r-demo-msg" role="status">{message}</div>}
    </div>
  );
}
