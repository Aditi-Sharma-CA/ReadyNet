// The app has two pages ("routes"):
//   "/"           -> the resident check-in
//   "/responder"  -> the CERT / first-responder view
// Any other address goes back to "/".
import { Routes, Route, Navigate } from 'react-router-dom';
import CheckInFlow from './public/CheckInFlow.jsx';
import ResponderApp from './responder/ResponderApp.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CheckInFlow />} />
      <Route path="/responder" element={<ResponderApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
