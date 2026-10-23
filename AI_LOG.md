# AI use log — ReadyNet

ReadyNet was designed by Aditi. AI (Claude, by Anthropic) was used to help design the prototype, write documents and write code. This log records who did what, so the use of AI is clear and honest.

## Before the build (design phase)
| Date | What Aditi did / decided | What AI did |
| --- | --- | --- |
| Oct 2026 | Problem from CERT training (Zone 6 canvassing takes hours); principle "greatest good for the greatest number" | Turned the idea into a written submission |
| Oct 2026 | Chose red/yellow/green/white triage, injury and surroundings questions, first-aid focus on heavy bleeding and recovery position | Drafted question wording and first-aid steps for review |
| Oct 2026 | Feedback from Milpitas fire marshal and CERT members: unknown team sizes, teams of 3+, leaders chosen at the cache, simple shared code | Updated the prototype and plan to match |
| Oct 2026 | Removed loved ones, volunteering and supply sharing from scope; asked for people counts, check-in for others, photos at the end, status tracking, merged reports | Built prototype v2 and this handover pack |
| Oct 2026 | Chose the tech stack (React + Firebase) after comparing options | Explained trade-offs |

## Build sessions
| Date | Asked for | Claude Code built | Aditi tested / changed |
| --- | --- | --- | --- |
| Oct 21–22, 2026 | Day 1: Vite + React setup, design tokens, routes, all resident check-in screens with local state (no Firebase yet) | Project setup, tokens.css, / and /responder routes, Alert/Location/Who/counters/questions/Result/Photos/Done screens, question + first-aid text as data, flow/triage/risk/first-aid/zone rules in src/logic/, checks against the §14 triage list | Tested every step on phone. Decided: real GPS now (tested over https after deploy); no zone number when outside zones; clear answers to questions that drop out of the flow (fixes prototype bug); leave 0-hurt vs injured mismatch as is |
