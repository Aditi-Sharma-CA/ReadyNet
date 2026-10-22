// Resident check-in. For now this is a placeholder that proves the "/" route
// and the design tokens work. The real screens come in the next step.
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';

export default function CheckInFlow() {
  return (
    <div className="app-column">
      <Header />
      <main className="content">
        <h1>Resident check-in</h1>
        <p>Screens coming in the next step.</p>
        <Link to="/responder">Open the responder view</Link>
      </main>
    </div>
  );
}
