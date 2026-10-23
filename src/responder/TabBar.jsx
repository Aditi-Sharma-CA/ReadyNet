// The three tabs at the bottom of the responder view.
const TABS = [['todo', 'Do next'], ['map', 'Map'], ['teams', 'Teams']];

export default function TabBar({ tab, onChange }) {
  return (
    <nav className="r-tabbar">
      {TABS.map(([id, label]) => (
        <button key={id} className={tab === id ? 'r-tab r-tab-on' : 'r-tab'} aria-current={tab === id ? 'page' : undefined} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </nav>
  );
}
