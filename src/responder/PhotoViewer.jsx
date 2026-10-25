// Full-screen dark viewer for the photos residents sent with a check-in.
// For a merged incident it shows the photos from every report.
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { toMillis, formatClock } from '../logic/time.js';

export default function PhotoViewer({ incident, onClose }) {
  const [photos, setPhotos] = useState(null); // null = still loading

  useEffect(() => {
    // Load the photos subcollection of each check-in in this incident
    Promise.all(incident.ids.map((id) => getDocs(collection(db, 'checkins', id, 'photos'))))
      .then((results) => {
        const all = results.flatMap((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        all.sort((a, b) => toMillis(a.createdAt, 0) - toMillis(b.createdAt, 0));
        setPhotos(all);
      })
      .catch(() => setPhotos([]));
  }, [incident]);

  return (
    <div className="r-viewer" role="dialog" aria-modal="true" aria-label="Photos from residents">
      <div className="r-viewer-head">
        <div>
          <div className="r-viewer-label">Photos from residents</div>
          <div className="r-viewer-title">{incident.address || 'GPS location'}</div>
        </div>
        <button className="r-viewer-close" onClick={onClose} autoFocus>Close</button>
      </div>
      <div className="r-viewer-list">
        {photos === null && <p>Loading photos…</p>}
        {photos && photos.length === 0 && <p>No photos could be loaded. They may still be on their way.</p>}
        {photos && photos.map((p, index) => (
          <figure key={p.id} className="r-viewer-photo">
            <img src={p.dataUrl} alt={p.caption || `Photo ${index + 1}`} />
            <figcaption>
              {p.caption && <div className="r-viewer-caption">{p.caption}</div>}
              <div className="r-viewer-meta">Sent {formatClock(toMillis(p.createdAt, Date.now()))}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
