// Responder view. Placeholder until Day 3 (access code, Do next, Map, Teams).
// The "responder" class switches to the darker responder colors from tokens.css.
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';

export default function ResponderApp() {
  return (
    <div className="app-column responder">
      <Header />
      <main className="content">
        <h1>Responder view</h1>
        <p>Coming on Day 3.</p>
        <Link to="/">Back to check-in</Link>
      </main>
    </div>
  );
}
