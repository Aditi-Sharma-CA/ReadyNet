# Approved prototype screens

These two files are the exact source of the approved clickable prototype (ReadyNet Prototype v2), exported from the design canvas.

| File | What it is |
| --- | --- |
| `PublicCheckIn.dc.html` | The resident check-in flow (all steps, questions, triage logic, first-aid guides) |
| `Responder.dc.html` | The CERT / first-responder view (access code, Do next list, map, teams, photo viewer) |

Each screen is 390 × 844 px (phone size).

## How to read them

They are **reference files, not code to copy into the app**. They use a small design-tool template format. They won't run on their own: the `support.js` script they load only exists inside the design tool.

- **Markup** sits inside `<x-dc> … </x-dc>`. All styles are inline, so you can read exact sizes, colors, spacing and wording.
- `{{name}}` inserts a value computed in the script at the bottom (`renderVals()` returns them).
- `<sc-if value="{{flag}}">…</sc-if>` shows a block only when `flag` is true. Each step of the flow is one `sc-if` block (`isAlert`, `isLocation`, `isQuestion`, `isCount`, `isResult`, `isPhotos`, `isDone`).
- `<sc-for list="{{items}}" as="item">…</sc-for>` repeats a block for each item.
- `onClick="{{handler}}"` calls a function returned from `renderVals()`.
- The `<script type="text/x-dc">` block at the bottom has **all the data and logic**: question lists (`COND`, `BLEED`, `INJ`, `ENV`, `COUNTS`), colors, first-aid guide text (`guides()`), sample responder data (`ITEMS`, `TEAMS`, `ZONES`), ranking (`prio`) and the status flow.

In React: each `sc-if` step becomes a component, each `sc-for` becomes `.map()`, the inline styles become CSS classes using the tokens in `HANDOVER.md` §9, and the script logic moves into `src/logic/` and `src/data/`.

## Known things to change (see HANDOVER.md §11)
- The triage score in the prototype includes surroundings answers. Use medical answers only.
- `showWorse` / `markWorse` are left over from a removed button. Ignore them.
- The responder data, teams, grid map and code `1989` are prototype stand-ins for Firestore data, leader-made teams, a Leaflet map and a 6+ character shared code.

To see the screens working, open the live prototype in Claude (ReadyNet Prototype v2) and press Play.
