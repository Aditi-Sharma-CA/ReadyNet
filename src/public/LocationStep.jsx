// Location screen: asks the phone for GPS when this screen opens (not when the app loads),
// and lets the resident type a street address or landmark.
// Continue works once there is a GPS location OR a typed address.
import { useEffect, useState } from 'react';
import { zoneForLocation } from '../logic/zone.js';

export default function LocationStep({ location, address, onLocation, onAddress, onContinue }) {
  // gps is one of: 'finding', 'found', 'denied', 'error'
  const [gps, setGps] = useState(location ? 'found' : 'finding');

  useEffect(() => {
    if (location) return; // already have it from earlier
    // Phones only share GPS with secure (https) pages.
    if (!navigator.geolocation || !window.isSecureContext) {
      setGps('error');
      return;
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        onLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: Math.round(pos.coords.accuracy),
        });
        setGps('found');
      },
      (err) => {
        if (cancelled) return;
        setGps(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
    return () => { cancelled = true; };
  }, []); // [] = run once, when this screen opens

  const zone = location ? zoneForLocation(location.lat, location.lng) : null;
  const gpsText = {
    finding: 'Finding your GPS location…',
    found: zone ? `GPS location found · Zone ${zone}` : 'GPS location found',
    denied: 'Location permission is off. Type the address below.',
    error: 'Couldn’t get your GPS location. Type the address below.',
  }[gps];

  const canContinue = Boolean(location) || address.trim() !== '';

  return (
    <>
      <div className="eyebrow">Location</div>
      <h1 className="title" tabIndex={-1}>Where is help needed?</h1>
      <div className={'gps-box' + (gps === 'denied' || gps === 'error' ? ' gps-box-error' : '')} role="status">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-6 7-12a7 7 0 10-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
        <div>{gpsText}</div>
      </div>
      <label htmlFor="addr" className="label">Street address or landmark</label>
      <input
        id="addr"
        className="text-input"
        value={address}
        onChange={(e) => onAddress(e.target.value)}
        autoComplete="street-address"
      />
      <div className="small-hint">Add a house or apartment number so teams can find the right door. Checking in for someone else? Enter where they are.</div>
      <button className="btn btn-primary" onClick={onContinue} disabled={!canContinue}>Continue</button>
    </>
  );
}
