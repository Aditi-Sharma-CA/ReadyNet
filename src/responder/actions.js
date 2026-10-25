// Database writes made by responders: moving a check-in along
// (New -> Assigned -> On scene -> Resolved) and making or disbanding teams.
// Like resident check-ins, these work offline: they wait in the phone's queue.
import { collection, doc, addDoc, updateDoc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

// changeStatus: updates EVERY check-in in a (possibly merged) incident in one batch,
// adds a line to each one's history (status, time, responder name), and marks
// the team as just updated.
//   team: { id, name } when assigning, otherwise the team already on the incident
export function changeStatus(incident, newStatus, team, responderName) {
  const now = Date.now();
  const batch = writeBatch(db); // all-or-nothing: every report changes together
  incident.ids.forEach((id) => {
    batch.update(doc(db, 'checkins', id), {
      status: newStatus,
      teamId: team ? team.id : null,
      teamName: team ? team.name : null,
      updatedAt: serverTimestamp(),
      history: arrayUnion({ status: newStatus, at: now, by: responderName }),
    });
  });
  if (team) batch.update(doc(db, 'teams', team.id), { lastUpdate: now });
  batch.commit().catch((error) => console.error('Status change was rejected', error));
}

// createTeam: a new team made at the cache (members = first names, 3 or more)
export function createTeam(name, members, cache, responderName) {
  addDoc(collection(db, 'teams'), {
    name,
    members,
    cache,
    createdBy: responderName,
    createdAt: serverTimestamp(),
    lastUpdate: Date.now(),
    active: true,
  }).catch((error) => console.error('Team was not saved', error));
}

// disbandTeam: hides the team (kept in the database so the history still makes sense)
export function disbandTeam(team) {
  updateDoc(doc(db, 'teams', team.id), { active: false })
    .catch((error) => console.error('Team was not disbanded', error));
}
