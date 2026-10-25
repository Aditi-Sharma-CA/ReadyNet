// The responder view (CERT members + first responders).
// Locked until someone signs in with the shared responder account (see AccessScreen).
// Once unlocked, it LISTENS to the check-ins in the database with onSnapshot, so new
// check-ins and status changes appear on every responder's phone within seconds.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import AccessScreen from './AccessScreen.jsx';
import DoNextTab from './DoNextTab.jsx';
import TeamsTab from './TeamsTab.jsx';
import PhotoViewer from './PhotoViewer.jsx';
import TabBar from './TabBar.jsx';
import { formatClock } from '../logic/time.js';

const RESPONDER_EMAIL = import.meta.env.VITE_RESPONDER_EMAIL;
const PREFS_KEY = 'readynet-responder'; // name + zone, remembered on this phone

function loadPrefs() {
  try {
    return { name: '', zone: 6, ...JSON.parse(localStorage.getItem(PREFS_KEY)) };
  } catch {
    return { name: '', zone: 6 };
  }
}

export default function ResponderApp() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined); // undefined = still checking
  const [prefs, setPrefs] = useState(loadPrefs);
  const [checkins, setCheckins] = useState([]);
  const [allTeams, setAllTeams] = useState([]); // includes disbanded teams (for history)
  const [tab, setTab] = useState('todo');
  const [zoneView, setZoneView] = useState('mine'); // 'mine' or 'all'
  const [now, setNow] = useState(Date.now());
  const [viewing, setViewing] = useState(null); // incident whose photos are open

  const unlocked = user && user.email === RESPONDER_EMAIL;

  // Who is signed in on this phone?
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Live list of check-ins (only while unlocked: the rules block everyone else)
  useEffect(() => {
    if (!unlocked) return;
    return onSnapshot(
      collection(db, 'checkins'),
      (snap) => setCheckins(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (error) => console.error('Could not load check-ins', error)
    );
  }, [unlocked]);

  // Live list of teams too
  useEffect(() => {
    if (!unlocked) return;
    return onSnapshot(
      collection(db, 'teams'),
      (snap) => setAllTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (error) => console.error('Could not load teams', error)
    );
  }, [unlocked]);

  // Disbanded teams stay in the database but are hidden; sort Team 1, Team 2...
  const teams = allTeams
    .filter((t) => t.active)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  // Tick every 30 seconds so "Updated 4 min ago" stays correct
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  function savePrefs(newPrefs) {
    setPrefs(newPrefs);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs)); } catch { /* not remembered */ }
  }

  return (
    <div className="app-column responder">
      <header className="r-header">
        <button className="r-header-btn" onClick={() => navigate('/')} aria-label="Back to public check-in">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="r-header-title">
          <div className="r-header-name">ReadyNet Responder</div>
          <div className="r-header-sub">{unlocked ? `${prefs.name} · ${formatClock(now)}` : 'CERT and first responders'}</div>
        </div>
        {unlocked ? (
          <button className="r-header-btn r-signout" onClick={() => signOut(auth)}>Sign out</button>
        ) : (
          <div className="r-header-btn-space" />
        )}
      </header>

      {user === undefined && <main className="r-content"><p className="hint">Loading…</p></main>}

      {user !== undefined && !unlocked && (
        <AccessScreen prefs={prefs} onSavePrefs={savePrefs} responderEmail={RESPONDER_EMAIL} />
      )}

      {unlocked && (
        <>
          <main className="r-content">
            <div className="segmented">
              <button className={zoneView === 'mine' ? 'seg seg-on' : 'seg'} onClick={() => setZoneView('mine')}>Zone {prefs.zone} · yours</button>
              <button className={zoneView === 'all' ? 'seg seg-on' : 'seg'} onClick={() => setZoneView('all')}>All zones</button>
            </div>

            {tab === 'todo' && (
              <DoNextTab checkins={checkins} zone={zoneView === 'mine' ? prefs.zone : 'all'} now={now}
                teams={teams} allTeams={allTeams} responderName={prefs.name} onOpenPhotos={setViewing} />
            )}
            {tab === 'map' && <p className="hint">Map coming on Day 4.</p>}
            {tab === 'teams' && (
              <TeamsTab teams={teams} allTeams={allTeams} checkins={checkins} zone={prefs.zone}
                responderName={prefs.name} now={now} />
            )}
          </main>
          <TabBar tab={tab} onChange={setTab} />
        </>
      )}

      {unlocked && viewing && <PhotoViewer incident={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
