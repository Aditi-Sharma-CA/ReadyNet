# Instructions for Claude Code — ReadyNet

You are helping Aditi, a 9th-grade student and Milpitas CERT member, build ReadyNet for the Congressional App Challenge. Aditi must be able to understand and explain every part of the code.

## Read first
1. `HANDOVER.md` — the full spec and technical architecture. It is the source of truth.
2. `prototype/README.md`, then `prototype/PublicCheckIn.dc.html` and `prototype/Responder.dc.html` — the approved screens. Match their layout, wording, colors and behavior, except where `HANDOVER.md` §11 says otherwise.
3. `seed/` — sample data for demo mode only.

## How to work
- Stack is decided: Vite + React 18 + **plain JavaScript** + Firebase (Auth, Firestore, Hosting) + vite-plugin-pwa + Leaflet. Do not switch to TypeScript, Next.js, Tailwind or a UI library.
- Follow the day-by-day plan in `HANDOVER.md` §13. Finish and test one step before starting the next. Commit to git after each working step with a clear message.
- Keep code simple: small function components, one file per screen, all rules in `src/logic/` as pure functions with a short comment at the top explaining what each does in plain English.
- Write question text, options and first-aid text as data (`src/data/`), copied exactly from the prototype.
- Don't add features that aren't in the spec. If something is unclear or the spec seems wrong, stop and ask Aditi.
- Never commit `.env.local` or Firebase secrets.
- After each step, tell Aditi in 3–5 short sentences what you built, how to test it on her phone, and one thing to understand about how it works.
- Add a line to `AI_LOG.md` after each session: date, what was asked, what Claude built, what Aditi decided or changed.

## Commands to support
`npm run dev`, `npm run build`, `npm run preview`, `firebase deploy`.
