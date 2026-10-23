// Optional photos, after the check-in is sent. Up to 6, taken with the phone camera.
// Each photo is shrunk right away (compressPhoto), so the preview is what responders will see.
import { useState } from 'react';
import { compressPhoto } from './photos.js';

const MAX_PHOTOS = 6;

export default function PhotosStep({ photos, onAddPhoto, onContinue }) {
  const [busy, setBusy] = useState(false);   // true while a photo is being shrunk
  const [error, setError] = useState('');

  async function handleFile(event) {
    const file = event.target.files[0];
    event.target.value = ''; // so the same photo can be picked again
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onAddPhoto(await compressPhoto(file));
    } catch {
      setError('That photo couldn’t be added. Try taking it again.');
    }
    setBusy(false);
  }

  return (
    <>
      <div className="eyebrow">Last step · Optional</div>
      <h1 className="title" tabIndex={-1}>Add photos for responders</h1>
      <div className="hint">Your check-in is already sent. Photos of damage, blocked roads or a trapped person help teams prepare before they arrive. Only CERT and first responders can see them.</div>
      <div className="photo-grid">
        {photos.map((dataUrl, index) => (
          <img key={index} src={dataUrl} alt={`Photo ${index + 1}`} className="photo-tile" />
        ))}
        {photos.length < MAX_PHOTOS && (
          // A <label> around a hidden file input: tapping it opens the camera
          <label className="photo-add">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            {busy ? 'Adding…' : 'Take photo'}
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={busy} className="visually-hidden" />
          </label>
        )}
      </div>
      {error && <div className="banner banner-failed" role="alert">{error}</div>}
      <button className="btn btn-primary" onClick={onContinue} disabled={busy}>
        {photos.length > 0 ? `Send ${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}` : 'Skip photos'}
      </button>
    </>
  );
}
