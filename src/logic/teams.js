// Team rules for the responder view. Teams are made on the day by the leader at
// each cache (minimum 3 people). A team's status is never typed in: it is worked
// out from the check-ins it is assigned to.

export const MIN_TEAM_SIZE = 3;
const OVERDUE_MINUTES = 30;

// teamJob: the open check-in this team is working on (assigned or on scene), or null
export function teamJob(team, checkins) {
  return checkins.find((c) => c.teamId === team.id && (c.status === 'assigned' || c.status === 'reached')) || null;
}

// teamStatus: "Assigned", "On scene" or "Available"
export function teamStatus(team, checkins) {
  const job = teamJob(team, checkins);
  if (!job) return 'Available';
  return job.status === 'reached' ? 'On scene' : 'Assigned';
}

// overdueMinutes: if a busy team hasn't updated for over 30 minutes, returns
// how many minutes (so the card can warn "No update in 34 min"). Otherwise null.
export function overdueMinutes(team, checkins, now) {
  if (teamStatus(team, checkins) === 'Available') return null;
  const minutes = Math.floor((now - team.lastUpdate) / 60000);
  return minutes > OVERDUE_MINUTES ? minutes : null;
}

// nextTeamName: "Team 1", "Team 2"... one more than the highest number used so far
export function nextTeamName(teams) {
  const numbers = teams.map((t) => parseInt(String(t.name).replace(/\D/g, ''), 10) || 0);
  return `Team ${Math.max(0, ...numbers) + 1}`;
}

// NEXT_STEP: what the main button on a card does at each status
export const NEXT_STEP = {
  new: { label: 'Assign a team', next: 'assigned' },
  assigned: { label: 'Mark reached', next: 'reached' },
  reached: { label: 'Mark resolved', next: 'resolved' },
};
