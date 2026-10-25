// DEMO MODE ONLY: fills the database with the sample data in seed/ so judges can see
// a full responder screen straight away. Everything it writes is marked demo: true,
// and "Clear demo data" removes only those documents.
//
// A sample check-in with "reports: 5" becomes 5 separate check-ins a few meters apart,
// so the app's real merging logic joins them into one card ("5 reports merged").
import {
  collection, doc, writeBatch, addDoc, getDocs, query, where, Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import seedCheckins from '../../seed/sample-checkins.json';
import seedTeams from '../../seed/sample-teams.json';

const MIN = 60000;
const DANGER = ['Collapsed building', 'Fire or smoke', 'Gas smell', 'Flooding'];

// History lines for a sample check-in, from its first report to its last update
function historyFor(status, first, updated) {
  const history = [{ status: 'new', at: first, by: 'resident' }];
  const between = (k, n) => Math.round(first + ((updated - first) * k) / n);
  if (status === 'assigned') history.push({ status: 'assigned', at: updated, by: 'Demo' });
  if (status === 'reached') history.push(
    { status: 'assigned', at: between(1, 2), by: 'Demo' },
    { status: 'reached', at: updated, by: 'Demo' });
  if (status === 'resolved') history.push(
    { status: 'assigned', at: between(1, 3), by: 'Demo' },
    { status: 'reached', at: between(2, 3), by: 'Demo' },
    { status: 'resolved', at: updated, by: 'Demo' });
  return history;
}

// samplePhoto: draws a simple placeholder picture with its caption (clearly labelled as a sample)
function samplePhoto(caption) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  const g = canvas.getContext('2d');
  g.fillStyle = '#3B4C5A';
  g.fillRect(0, 0, 800, 500);
  g.fillStyle = '#C9D4DD';
  g.font = 'bold 30px sans-serif';
  g.fillText('SAMPLE PHOTO', 40, 70);
  g.fillStyle = '#FFFFFF';
  g.font = 'bold 40px sans-serif';
  // wrap the caption onto several lines
  let line = '';
  let y = 260;
  caption.split(' ').forEach((word) => {
    if (g.measureText(line + word).width > 720) { g.fillText(line, 40, y); line = ''; y += 54; }
    line += word + ' ';
  });
  g.fillText(line, 40, y);
  return canvas.toDataURL('image/jpeg', 0.6);
}

export async function loadDemoData() {
  const now = Date.now();
  const uid = auth.currentUser.uid;

  // 1. Teams (the seed refers to teams by name, so remember each new id)
  const teamIds = {};
  const setup = writeBatch(db);
  seedTeams.teams.forEach((t) => {
    const ref = doc(collection(db, 'teams'));
    teamIds[t.name] = ref.id;
    setup.set(ref, {
      name: t.name, members: t.members, cache: t.cache, createdBy: 'Demo',
      createdAt: Timestamp.fromMillis(now - 90 * MIN), lastUpdate: now - 5 * MIN, active: true, demo: true,
    });
  });

  // 2. Check-ins, all created as "new" first (the security rules require that)
  const statusChanges = [];
  const photoJobs = [];
  seedCheckins.checkins.forEach((c) => {
    const first = now - c.firstReportMinutesAgo * MIN;
    const latest = now - c.minutesAgo * MIN;
    for (let k = 0; k < c.reports; k++) {
      const time = c.reports === 1 ? latest : Math.round(first + ((latest - first) * k) / (c.reports - 1));
      const ref = doc(collection(db, 'checkins'));
      setup.set(ref, {
        ownerUid: uid,
        createdAt: Timestamp.fromMillis(time),
        updatedAt: Timestamp.fromMillis(time),
        clientTime: time,
        forWhom: 'self',
        address: c.address,
        location: { lat: c.location.lat + k * 0.00004, lng: c.location.lng, accuracyM: 10 }, // a few meters apart
        zone: c.zone,
        people: c.people,
        hurt: c.hurt,
        trappedCount: c.trappedCount,
        answers: {},
        color: c.color,
        risk: c.trappedCount > 0 || c.hazards.some((h) => DANGER.includes(h)) ? 'high' : 'low',
        hazards: c.hazards,
        note: c.note,
        photoCount: k === 0 ? c.photos.length : 0,
        status: 'new',
        teamId: null,
        teamName: null,
        history: [{ status: 'new', at: time, by: 'resident' }],
        demo: true,
        schemaVersion: 1,
      });
      if (c.status !== 'new') {
        statusChanges.push({ ref, status: c.status, team: c.team, history: historyFor(c.status, first, latest), updated: latest });
      }
      if (k === 0) c.photos.forEach((caption) => photoJobs.push({ ref, caption, time: latest }));
    }
  });
  await setup.commit();

  // 3. Move the sample check-ins along (Assigned / On scene / Resolved), like a responder would
  const moves = writeBatch(db);
  statusChanges.forEach((s) => {
    moves.update(s.ref, {
      status: s.status,
      teamId: teamIds[s.team] || null,
      teamName: s.team,
      history: s.history,
      updatedAt: Timestamp.fromMillis(s.updated),
    });
    if (teamIds[s.team] && s.status !== 'resolved') moves.update(doc(db, 'teams', teamIds[s.team]), { lastUpdate: s.updated });
  });
  await moves.commit();

  // 4. Sample photos (after the check-ins exist, because the rules check the owner)
  await Promise.all(photoJobs.map((p) =>
    addDoc(collection(p.ref, 'photos'), {
      dataUrl: samplePhoto(p.caption), caption: p.caption, ownerUid: uid, createdAt: Timestamp.fromMillis(p.time),
    })));
}

// clearDemoData: deletes every document marked demo: true (and its photos)
export async function clearDemoData() {
  const demoCheckins = await getDocs(query(collection(db, 'checkins'), where('demo', '==', true)));
  // Photos first: the rules check that the parent check-in is demo data
  for (const checkin of demoCheckins.docs) {
    const photos = await getDocs(collection(checkin.ref, 'photos'));
    if (photos.empty) continue;
    const batch = writeBatch(db);
    photos.docs.forEach((p) => batch.delete(p.ref));
    await batch.commit();
  }
  const batch = writeBatch(db);
  demoCheckins.docs.forEach((d) => batch.delete(d.ref));
  const demoTeams = await getDocs(query(collection(db, 'teams'), where('demo', '==', true)));
  demoTeams.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
