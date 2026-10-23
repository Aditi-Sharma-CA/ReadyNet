// Photos: shrinking them on the phone, then saving them with the check-in.
// Photos are stored in the database itself as small JPEG "data URLs" (the picture
// written out as text), because Cloud Storage needs a paid plan (HANDOVER.md section 2).
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

const MAX_SIDE = 1024;          // longest edge, in pixels
const MAX_BYTES = 700 * 1024;   // each photo must be under 700 KB

// compressPhoto: draws the photo smaller on a hidden canvas and saves it as a JPEG.
// If it is still too big, it tries again smaller and at lower quality.
export async function compressPhoto(file) {
  const image = await loadImage(file);
  let side = MAX_SIDE;
  let quality = 0.6;
  for (let attempt = 0; attempt < 4; attempt++) {
    const scale = Math.min(1, side / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length * 0.75 < MAX_BYTES) return dataUrl; // text is ~4/3 the size of the bytes
    side = Math.round(side * 0.75);
    quality -= 0.1;
  }
  throw new Error('Photo is too large');
}

// loadImage: turns the file from the camera into an image we can draw.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read photo')); };
    image.src = url;
  });
}

// sendPhotos: saves each photo under checkins/{id}/photos, then updates photoCount.
// Like check-ins, these wait in the phone's queue if there is no signal.
export function sendPhotos(checkinId, dataUrls) {
  const ownerUid = auth.currentUser.uid;
  dataUrls.forEach((dataUrl) => {
    addDoc(collection(db, 'checkins', checkinId, 'photos'), { dataUrl, ownerUid, createdAt: serverTimestamp() })
      .catch((error) => console.error('Photo was rejected by the server', error));
  });
  updateDoc(doc(db, 'checkins', checkinId), { photoCount: dataUrls.length, updatedAt: serverTimestamp() })
    .catch((error) => console.error('Photo count was rejected by the server', error));
}
