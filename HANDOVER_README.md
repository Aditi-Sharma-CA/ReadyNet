# ReadyNet handover pack

Everything Claude Code needs to build ReadyNet from the approved prototype.

| File | What it's for |
| --- | --- |
| `CLAUDE.md` | Standing instructions Claude Code reads automatically |
| `HANDOVER.md` | Full spec: scope, tech stack, architecture, data model, security rules, every screen, logic, design tokens, build plan, checklist |
| `prototype/` | The approved prototype screens (source) + how to read them |
| `seed/` | Sample check-ins, teams and placeholder zones for demo mode |
| `AI_LOG.md` | Record of what you decided and what AI built |

## How to start
1. Make a new empty folder called `readynet` on your computer and copy everything in this pack into it.
2. Create a Firebase project at console.firebase.google.com (free Spark plan). Turn on **Authentication** (Anonymous + Email/Password), **Firestore** and **Hosting**. Add a Web app and copy its config.
3. In Firebase Authentication, add one user: `responder@readynet-milpitas.app` with a password of **at least 6 characters**. That password is your shared responder code.
4. Open the folder in Claude Code and say:
   > Read CLAUDE.md and HANDOVER.md, then start Day 1 of the build plan. Ask me for the Firebase config when you need it.
5. Test on your phone after every step, and add to `AI_LOG.md` as you go.

Deadline: Congressional App Challenge, Monday Oct 26, 2026, 12:00 p.m. ET (confirm on the official site). Submit early.
