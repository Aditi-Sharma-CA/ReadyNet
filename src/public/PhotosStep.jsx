// Optional photos, after the check-in is sent. Up to 6, taken with the phone camera.
// For now the photos only stay on this screen (local preview).
// Day 2: shrink each photo and upload it to Firebase.
const MAX_PHOTOS = 6;

export default function PhotosStep({ photos, onAddPhoto, onContinue }) {
  function handleFile(event) {
    const file = event.target.files[0];
    if (file) onAddPhoto(URL.createObjectURL(file)); // a temporary link to the picture
    event.target.value = ''; // so the same photo can be picked again
  }

  return (
    <>
      <div className="eyebrow">Last step · Optional</div>
      <h1 className="title" tabIndex={-1}>Add photos for responders</h1>
      <div className="hint">Your check-in is already sent. Photos of damage, blocked roads or a trapped person help teams prepare before they arrive. Only CERT and first responders can see them.</div>
      <div className="photo-grid">
        {photos.map((url, index) => (
          <img key={url} src={url} alt={`Photo ${index + 1}`} className="photo-tile" />
        ))}
        {photos.length < MAX_PHOTOS && (
          // A <label> around a hidden file input: tapping it opens the camera
          <label className="photo-add">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            Take photo
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="visually-hidden" />
          </label>
        )}
      </div>
      <button className="btn btn-primary" onClick={onContinue}>
        {photos.length > 0 ? `Send ${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}` : 'Skip photos'}
      </button>
    </>
  );
}
