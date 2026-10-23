// Small "Online" / "Offline" pill in the header, so people know if the phone has signal.
// The browser fires "online" and "offline" events whenever the connection changes.
import { useEffect, useState } from 'react';

export default function OnlinePill() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className={'online-pill' + (online ? '' : ' online-pill-off')} role="status">
      <span className="online-dot" aria-hidden="true" />
      {online ? 'Online' : 'Offline'}
    </div>
  );
}
