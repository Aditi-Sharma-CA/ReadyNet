// Sending a check-in to Firebase, and finding out when it has arrived.
import { collection, doc, setDoc, waitForPendingWrites, serverTimestamp } from 'firebase/firestore';
import { db, signInResident } from '../firebase.js';

// sendCheckIn: saves the check-in and returns its new id right away.
// We don't wait for the server: with no signal, Firestore keeps the check-in
// in a queue on the phone and sends it automatically when signal comes back.
export async function sendCheckIn(fields) {
  const user = await signInResident(); // needs internet only the very first time
  const ref = doc(collection(db, 'checkins')); // pick a new id
  setDoc(ref, {
    ...fields,
    ownerUid: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch((error) => console.error('Check-in was rejected by the server', error));
  return ref.id;
}

// whenSent: runs onSent() once the phone's queue of unsent writes is empty,
// which means the server has the check-in. (This also works after a reload,
// because the queue is kept on the phone.)
export function whenSent(onSent) {
  let stopped = false;
  waitForPendingWrites(db)
    .then(() => { if (!stopped) onSent(); })
    .catch((error) => console.error('Could not check the check-in status', error));
  return () => { stopped = true; }; // call this to stop listening
}
