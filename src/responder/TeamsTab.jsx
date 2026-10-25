// Teams tab: every active team, its status and where it is, plus "Make team".
// The leader at the cache makes teams on the day (3 or more first names).
import { useState } from 'react';
import { teamJob, teamStatus, overdueMinutes, nextTeamName, MIN_TEAM_SIZE } from '../logic/teams.js';
import { createTeam, disbandTeam } from './actions.js';

const STATUS_CLASS = { Available: 'r-team-available', Assigned: 'r-team-assigned', 'On scene': 'r-team-onscene' };

export default function TeamsTab({ teams, allTeams, checkins, zone, responderName, now }) {
  const [making, setMaking] = useState(false);

  const available = teams.filter((t) => teamStatus(t, checkins) === 'Available');
  const volunteers = teams.reduce((sum, t) => sum + t.members.length, 0);
  const deployed = teams.filter((t) => teamStatus(t, checkins) !== 'Available')
    .reduce((sum, t) => sum + t.members.length, 0);

  return (
    <div className="r-stack">
      <h2 className="r-section">Teams</h2>
      <div className="r-section-hint r-hint-flat">
        {available.length} of {teams.length} teams available · {deployed} of {volunteers} volunteers deployed
      </div>

      {making ? (
        <MakeTeam
          teamName={nextTeamName(allTeams)}
          cache={`Zone ${zone} cache`}
          onCreate={(name, members, cache) => { createTeam(name, members, cache, responderName); setMaking(false); }}
          onCancel={() => setMaking(false)}
        />
      ) : (
        <button className="btn r-btn-action" onClick={() => setMaking(true)}>Make team</button>
      )}

      {teams.map((team) => {
        const status = teamStatus(team, checkins);
        const job = teamJob(team, checkins);
        const overdue = overdueMinutes(team, checkins, now);
        return (
          <div key={team.id} className="r-card r-team">
            <div className="r-team-top">
              <div className="r-team-name">{team.name}</div>
              <span className={`r-status ${STATUS_CLASS[status]}`}>{status}</span>
            </div>
            <div className="r-team-members">{team.members.join(', ')} · {team.members.length} people</div>
            <div className="r-team-where">{job ? job.address || 'GPS location' : `Waiting at ${team.cache}`}</div>
            {overdue && <div className="r-team-warning">No update in {overdue} min</div>}
            {status === 'Available' && (
              <button className="r-small-btn" onClick={() => disbandTeam(team)}>Disband</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// The "Make team" form: add first names one at a time as chips.
function MakeTeam({ teamName, cache, onCreate, onCancel }) {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');

  function addMember(event) {
    event.preventDefault();
    const clean = name.trim();
    if (clean) setMembers([...members, clean]);
    setName('');
  }

  return (
    <div className="r-card r-make-team">
      <div className="r-team-name">New team: {teamName}</div>
      <div className="r-section-hint r-hint-flat">At {cache}. Add each member’s first name. Teams need at least {MIN_TEAM_SIZE} people.</div>
      <form className="r-add-row" onSubmit={addMember}>
        <label htmlFor="member" className="visually-hidden">Member first name</label>
        <input id="member" className="r-input" placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        <button type="submit" className="r-add-btn" disabled={!name.trim()}>Add</button>
      </form>
      {members.length > 0 && (
        <div className="r-chips">
          {members.map((m, index) => (
            <button key={index} className="r-member-chip" onClick={() => setMembers(members.filter((_, k) => k !== index))} aria-label={`Remove ${m}`}>
              {m} ✕
            </button>
          ))}
        </div>
      )}
      <button className="btn r-btn-dark" disabled={members.length < MIN_TEAM_SIZE} onClick={() => onCreate(teamName, members, cache)}>
        {members.length < MIN_TEAM_SIZE ? `Create team (${members.length} of ${MIN_TEAM_SIZE})` : `Create ${teamName}`}
      </button>
      <button className="btn r-btn-light" onClick={onCancel}>Cancel</button>
    </div>
  );
}
