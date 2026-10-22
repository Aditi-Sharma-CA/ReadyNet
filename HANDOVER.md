# ReadyNet — Build Handover

**Owner:** Aditi (9th grade, Milpitas CERT member, CA-17)
**Purpose:** Congressional App Challenge 2026 entry (deadline Monday Oct 26, 2026, 12:00 p.m. ET — confirm on the official site)
**Status of design:** Approved clickable prototype in `prototype/`. Build exactly that, with the changes listed in "Differences from the prototype".

---

## 1. What we are building

ReadyNet is a disaster check-in app for Milpitas, CA. After a major earthquake, 911 is overwhelmed and CERT volunteers would normally walk their zone for hours to find out who is hurt. ReadyNet lets residents check in from their phone in about a minute, and gives CERT volunteers and first responders a ranked list of where to go first, following the triage principle **"the greatest good for the greatest number."**

Two views in one app:

1. **Public check-in (residents):** location, who they're checking in for, how many people / hurt, injury questions, surroundings questions → a triage color (red / yellow / green / white), area risk, and step-by-step first aid they can do while they wait. Optional photos at the very end.
2. **Responder view (CERT + first responders, locked by a shared code):** a ranked "Do next" list of real check-ins, a map, and teams. Each check-in moves New → Assigned → On scene → Resolved with timestamps.

Out of scope for this build: loved-ones features, volunteering sign-up for residents, supply caches/sharing, SMS fallback, individual responder accounts, admin website.

---

## 2. Tech stack (decided)

| Part | Choice | Notes |
| --- | --- | --- |
| App type | Progressive Web App (installable website) | Works on iPhone and Android, no app store |
| Build tool | **Vite** | `npm create vite@latest readynet -- --template react` |
| UI | **React 18, plain JavaScript (no TypeScript)** | Function components + hooks only |
| Styling | Plain CSS with CSS variables (tokens in §9) | No UI library, no Tailwind |
| Database | **Firebase Cloud Firestore** | Live updates via `onSnapshot`; offline queue via persistent cache |
| Auth | **Firebase Authentication**: Anonymous (residents) + one shared Email/Password account (responders) | See §6 |
| Photos | Stored **in Firestore** as small compressed JPEG data URLs in a subcollection | Avoids Cloud Storage, which needs the paid Blaze plan for new projects. Upgrade path in §12 |
| Hosting | **Firebase Hosting** | Free, HTTPS (needed for GPS + install) |
| PWA | `vite-plugin-pwa` | App shell works offline after first load |
| Map | **Leaflet + react-leaflet + OpenStreetMap tiles** | Free, no API key. Tiles need internet; app still works without the map |
| Routing | `react-router-dom` (two routes) | `/` public, `/responder` responder |
| Code hosting | GitHub (private or public repo) | Commit after every working step |

Firebase plan: **Spark (free)**. Everything above works on Spark.

---

## 3. Architecture

```
 Resident phone (PWA)                         Responder phone/laptop (PWA)
 ┌──────────────────────┐                     ┌──────────────────────────┐
 │ React public flow    │                     │ React responder view     │
 │  - questions/state   │                     │  - Do next (ranked)      │
 │  - triage logic (JS) │                     │  - Map (Leaflet)         │
 │  - first-aid guides  │                     │  - Teams                 │
 └─────────┬────────────┘                     └────────────┬─────────────┘
           │ Firebase JS SDK                               │ Firebase JS SDK
           │ (anonymous auth, offline queue)               │ (shared responder login)
           ▼                                               ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │ Firebase                                                            │
 │  Auth: anonymous users + 1 responder account                        │
 │  Firestore: checkins/{id}, checkins/{id}/photos/{pid}, teams/{id}   │
 │  Security rules: residents create + read their own; responders all  │
 │  Hosting: serves the built PWA over HTTPS                           │
 └─────────────────────────────────────────────────────────────────────┘
```

Key ideas:
- **All triage logic runs on the phone** (pure functions in `src/logic/`). The phone saves the result with the check-in. No server code, no Cloud Functions.
- **Offline first:** Firestore persistent local cache queues writes when there is no signal and sends them automatically later. The resident sees "Saved — will send when you have signal" until the server confirms.
- **Live responder view:** responder screens subscribe with `onSnapshot`, so new check-ins and status changes appear within seconds on every responder device.

---

## 4. Project structure

```
readynet/
  index.html
  vite.config.js            # react + VitePWA config (manifest, icons, theme #0B1620)
  firebase.json             # hosting (dist), firestore rules
  firestore.rules
  .env.local                # VITE_FIREBASE_* keys (not committed) + VITE_RESPONDER_EMAIL
  public/icons/             # 192, 512, 512-maskable
  src/
    main.jsx, App.jsx       # routes: "/" public, "/responder"
    firebase.js             # init app, auth, firestore with persistentLocalCache
    styles/tokens.css, base.css
    data/
      questions.js          # all questions + options + scores (§7)
      firstAid.js           # guide text (copy exactly from prototype)
      zones.js              # placeholder zones (from seed/sample-zones.json)
    logic/                  # pure functions, each with a short comment explaining it
      triage.js             # colorFromAnswers()
      risk.js               # areaRisk()
      flow.js               # buildSteps(answers) -> ordered list of steps
      firstAid.js           # guidesFor(answers, color)
      ranking.js            # priority(), groupDuplicates()
      zone.js               # zoneForLocation(lat, lng)
      time.js               # minutesAgo(), formatClock()
    public/                 # resident screens
      CheckInFlow.jsx, AlertScreen.jsx, LocationStep.jsx, WhoStep.jsx,
      CountStep.jsx, QuestionStep.jsx, ResultScreen.jsx, PhotosStep.jsx, DoneScreen.jsx
    responder/
      ResponderApp.jsx, AccessScreen.jsx, DoNextTab.jsx, CheckInCard.jsx,
      MapTab.jsx, TeamsTab.jsx, PhotoViewer.jsx, TabBar.jsx
    components/             # Button, Card, Chip, Counter, Header, ProgressBar
    demo/loadDemoData.js    # writes seed data (demo mode only)
  README.md                 # how to run, deploy, demo script
  AI_LOG.md                 # see §14
```

---

## 5. Firestore data model

### `checkins/{checkinId}`
| Field | Type | Notes |
| --- | --- | --- |
| `ownerUid` | string | resident's anonymous uid |
| `createdAt`, `updatedAt` | timestamp | `serverTimestamp()`; also store `clientTime` (number, ms) for offline display |
| `forWhom` | `'self' \| 'other'` | |
| `address` | string | typed street/landmark (required unless GPS present) |
| `location` | `{lat, lng, accuracyM}` or null | from Geolocation API |
| `zone` | number or null | from `zoneForLocation` |
| `people`, `hurt`, `trappedCount` | number | `trappedCount` = 0 unless trapped = Yes |
| `answers` | map questionId → optionIndex | raw answers |
| `color` | `'red' \| 'yellow' \| 'green' \| 'white'` | computed on device |
| `risk` | `'high' \| 'low'` | computed on device |
| `hazards` | string[] | e.g. "Fire or smoke", "Collapsed building" |
| `note` | string | auto summary, e.g. "Heavy bleeding, arm. Pressure not working." (built from answers) |
| `photoCount` | number | |
| `status` | `'new' \| 'assigned' \| 'reached' \| 'resolved'` | starts `new` |
| `teamId`, `teamName` | string or null | |
| `history` | array of `{status, at (ms), by (responder name)}` | append on every status change |
| `demo` | boolean | true for seeded sample data |
| `schemaVersion` | 1 | |

### `checkins/{checkinId}/photos/{photoId}`
`dataUrl` (JPEG, resized to max 1024 px long edge, quality 0.6, must be < 700 KB), `createdAt`, `ownerUid`.

### `teams/{teamId}`
`name` ("Team 1"…), `members` (string[] of first names, **minimum 3**), `cache` (e.g. "Zone 6 cache"), `createdBy`, `createdAt`, `lastUpdate` (ms; updated whenever the team's check-in status changes), `active` (bool).

Team status is derived: if the team has a check-in in `assigned` → "Assigned", `reached` → "On scene", else "Available".

---

## 6. Authentication and security

**Residents:** `signInAnonymously()` automatically on first open (needs internet once; the session persists on the device afterwards).

**Responders:** one shared code, as decided.
- Create one Email/Password user in Firebase Auth, e.g. `responder@readynet-milpitas.app`, with password = the shared code.
- Access screen asks for **Your name** and **Access code**. It calls `signInWithEmailAndPassword(VITE_RESPONDER_EMAIL, code)`. Wrong code → "That code isn't valid. Check with your CERT leader."
- Name is saved in `localStorage` and written as `by` on every status change (so there is a record of who did what).
- Firebase requires passwords of **at least 6 characters**, so the demo code must be ≥ 6 characters (e.g. `ZONE61989`). The prototype's `1989` will not work.
- The coordinator changes the code by changing that account's password in the Firebase console.

**`firestore.rules`** (starting point — keep it this simple):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    function isResponder() {
      return signedIn() && request.auth.token.email == 'responder@readynet-milpitas.app';
    }
    match /checkins/{id} {
      allow create: if signedIn()
        && request.resource.data.ownerUid == request.auth.uid
        && request.resource.data.status == 'new';
      allow read: if isResponder()
        || (signedIn() && resource.data.ownerUid == request.auth.uid);
      allow update: if isResponder()
        || (signedIn() && resource.data.ownerUid == request.auth.uid
            && request.resource.data.diff(resource.data).affectedKeys()
               .hasOnly(['photoCount', 'updatedAt']));
      allow delete: if false;
      match /photos/{pid} {
        allow create: if signedIn()
          && get(/databases/$(db)/documents/checkins/$(id)).data.ownerUid == request.auth.uid;
        allow read: if isResponder();
      }
    }
    match /teams/{id} {
      allow read, write: if isResponder();
    }
  }
}
```
Residents can never see other people's check-ins. Responders see everything.

---

## 7. Public check-in flow (match `prototype/PublicCheckIn.dc.html`)

One question per screen, big buttons, a progress bar, Back button (hidden on Alert, Result and Done). Tapping an answer saves it and moves on. Save the in-progress check-in to `localStorage` after every answer so a reload resumes.

**Step order** (`logic/flow.js` builds this from the answers so far):

1. **Alert** — red card "Earthquake reported in Milpitas", "Check in now" button, line "This app does not replace 911. Keep trying 911 for life-threatening emergencies.", and "Open the responder view" button (→ `/responder`).
2. **Location** — request GPS on this step (not on app load). Show "GPS location found · Zone N" or a clear error. Text field "Street address or landmark" (hint: add house/apartment number; if checking in for someone else, enter where they are). Continue enabled when GPS or address present.
3. **Who** — "Who are you checking in for?" Myself / Someone else.
4. **People count** — "How many people are at this location?" counter (min 1, max 30). Hint: "Count everyone, including you. One check-in can cover a whole household."
5. **Hurt count** — "How many of them are hurt?" counter (min 0, max = people).
6. **Injuries** (always):

| id | Question (self / someone else) | Options → score |
| --- | --- | --- |
| injured | Are you injured? / Are they injured? (hint: "If several people are hurt, answer for the most seriously hurt.") | Seriously→3 · Yes, but it can wait→2 · Minor injury→1 · No→0 |
| walk | Can you walk on your own? / Can they… | Yes→0 · No→2 |
| breath | Any trouble breathing, chest pain or heavy bleeding? | Trouble breathing or chest pain→3 · Heavy bleeding→0 (score from follow-ups) · No→0 |
| water | Do you/they have safe water and food for the next 24 hours? | Yes · No (no score; stored as a need) |
| meds | Does anyone need medicine, oxygen or care they don't have? | Yes, needed now→3 · Within a day→0 · No→0 |

7. **Bleeding** (only if breath = Heavy bleeding): bleedWhere: Arm or leg · Head or neck · Chest, belly or back. bleedType: Spurting or pulsing→3 · Steady flow that soaks a cloth→2 · Slow ooze or seeping→1. bleedPress ("Does it slow down when you press firmly on it?", hint "Press hard with a clean cloth for a few minutes, then answer."): Yes, it slows or stops→0 · No, it keeps bleeding→3.
8. **Injury check** (only if injured ≠ No): awake ("Is the injured person awake and able to talk normally?"): Yes→0 · Confused or very sleepy→3 · Not responding, but breathing→3. bone ("Do you think a bone is broken?", hint with signs): Yes→2 · No→0.
9. **Surroundings** (always): trapped (Is anyone trapped? Yes · No · Not sure) → if Yes, **trapped count** counter (min 1, max 20, "How many people are trapped?"); fire (fire/smoke/gas), collapse (buildings collapsed or badly cracked), flood (flooding or rising water), power (power lines down / power out), roads (roads blocked).
10. **Submit** → write the check-in to Firestore (works offline) → **Result** screen.
11. **Result:** green banner "Check-in sent to CERT and first responders · 4 people, 2 hurt" (or "Saved — will send when you have signal" while pending); red rescue banner if trapped ("Rescue alert sent for N trapped people…"); status card (color name + meaning, label "Your status"/"Their status"); area risk tile; **"What you can do right now"** guides; Continue.
12. **Photos (optional, after submit):** "Add photos for responders", up to 6, camera input `<input type="file" accept="image/*" capture="environment">`, resize + compress, write each to `photos` subcollection, update `photoCount`. Buttons "Send N photos" / "Skip photos".
13. **Done:** summary rows (Checked in for, Status, People, Area, Photos), "See first-aid steps again", "Check in again".

**Triage color (`logic/triage.js`):** the highest score among the answered *medical* questions (injured, walk, breath, meds, bleeding follow-ups, injury-check follow-ups). 3 = red, 2 = yellow, 1 = green, 0 = white. **Surroundings answers do NOT affect the color** (see §11).

**Area risk (`logic/risk.js`):** high if trapped = Yes, or fire, collapse or flood = Yes; otherwise low. Hazard labels go in `hazards`.

**First-aid guides (`logic/firstAid.js`)** — copy the titles, steps and cautions exactly from the prototype:

| Guide | Show when |
| --- | --- |
| Recovery position (tag "Do this first", with neck/back caution) | awake = Not responding, but breathing |
| Stop heavy bleeding (3 steps; + "Tie above the wound" step and band caution if bleedWhere = Arm or leg AND (bleedType = Spurting OR bleedPress = No); head/neck/body caution if bleedWhere is head/neck or body) | breath = Heavy bleeding |
| Trouble breathing or chest pain | breath = Trouble breathing or chest pain |
| Possible broken bone (4 steps incl. splint, circulation) | bone = Yes OR walk = No |
| Signs of shock | awake = Confused OR color is red/yellow |
| Clean and cover minor wounds | color is green and no other guide |

Footer under guides: "These steps don't replace medical care. If someone gets worse, check in again." First-aid text is a placeholder until reviewed by the fire department / a Stop the Bleed instructor — keep it in `data/firstAid.js` so it can be edited without touching logic.

---

## 8. Responder view (match `prototype/Responder.dc.html`)

Field-first: large text (16–21 px), high contrast, buttons ≥ 52 px tall, usable one-handed. Dark header, three tabs at the bottom: **Do next · Map · Teams**. Zone toggle at top: "Zone 6 · yours" / "All zones" (default zone remembered in `localStorage`).

**Access screen:** name + access code (§6). Sign out button in header.

**Do next tab**
- Summary tiles: Need a team · People trapped · People hurt (for the current zone filter, open check-ins only).
- **Merging duplicates (`logic/ranking.js` → `groupDuplicates`)**: open check-ins (not resolved) within **50 m** of each other (or same normalized address) and within **60 minutes** become one incident. Incident values: worst color, max people, max hurt, max trappedCount, union of hazards, all photos, `reports` = number of check-ins, first/latest report time. Show "5 reports merged into one · first 2:18 PM, latest 2:36 PM". Status actions on an incident update **all** its check-ins in one batch write.
- **Ranking (`priority`)**: trapped > 0 or red first, then yellow, then green; within a tier, more trapped, then more hurt, then more people. Formula used in the prototype: `tier*1000 + (trapped>0 ? 3000 : 0) + trapped*50 + hurt*10 + people` with red=3, yellow=2, green=1. White check-ins with no trapped people are not listed (they only feed the counts and the map).
- Sections: **Do next** (status new, ranked, numbered), **In progress** (assigned / on scene), **Show resolved (N)** collapsed.
- **Card** contents: rank number, color badge (word, not color alone), "N TRAPPED" badge, zone, address (large), "4 people · 2 hurt", merged line, auto note, hazard chips, freshness ("Updated 4 min ago"; over 60 min: faded card + "may be out of date" in red), status timeline ("New 2:18 PM → Assigned 2:30 PM · Team 2 (3)"), buttons: **Navigate** (opens `https://www.google.com/maps/search/?api=1&query=` + lat,lng or address + ", Milpitas, CA" in a new tab), **Photos (n)** (opens full-screen photo viewer), primary action:
  - new → **Assign a team** (shows available teams with size; none free → message)
  - assigned → **Mark reached**
  - reached → **Mark resolved**
  Every action appends to `history` with time and responder name, sets `updatedAt`, and updates the team's `lastUpdate`.

**Map tab**
- Leaflet map centered on Milpitas (≈ 37.4323, -121.8996, zoom 13), OpenStreetMap tiles.
- Toggle: **Who needs help** / **Hazards**. Who needs help: circle markers for open incidents, filled with triage color, numbered by priority, thick dark ring if trapped. Hazards: purple markers for check-ins with hazards. Optional: `leaflet.heat` heat layer weighted by hurt × color weight.
- Zone rectangles from `data/zones.js` drawn as thin outlines with labels; your zone thicker.
- Tap a marker → switch to Do next and highlight that card.
- If tiles fail to load (offline), show a message and keep the list usable.

**Teams tab** (simple, leader-run — different from prototype, see §11)
- Summary: "2 of 4 teams available · 6 of 12 volunteers deployed".
- Each team card: name, member names, size, status (Available / Assigned / On scene), where (address or "Waiting at Zone 6 cache"), and a warning in red if `lastUpdate` is over 30 minutes while assigned/on scene ("No update in 34 min").
- **Make team** button: enter member first names as chips; the Create button stays disabled until **3 or more** names; auto-names "Team N". Disband only when Available.

**Photo viewer:** full-screen dark overlay, address title, photos stacked large, time sent, Close button.

**Demo mode:** Responder header menu → "Load demo data" (writes `seed/` files with `demo: true`, positions from the seed lat/lng, times relative to now) and "Clear demo data". Hide behind a `VITE_DEMO=true` flag or a small menu so judges can see a full screen instantly.

---

## 9. Design system (match the prototype)

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | #12212E (public) / #0B1620 (responder) | text, headers, primary buttons |
| `--ink-2` | #3B4C5A | secondary text |
| `--line` | #D5DDE4 | borders |
| `--bg` | #F4F6F8 (public) / #EEF1F4 (responder) | page background |
| `--action` | #D9480F | main call to action, progress fill |
| `--info` | #1F4E79 / `--info-bg` #E3ECF5 | Navigate button, info boxes, selected answer |
| `--red` | #B3261E | red triage, rescue alerts |
| `--yellow` | #F2B705 (dark text on it) | yellow triage |
| `--green` | #2E7D32 | green triage, success |
| white triage | #FFFFFF with 2 px `--ink` border | |
| `--hazard` | #4E2A84 on #F1ECF6 | hazard chips, high-risk team |
| risk high | #FBE0DE / #8C1D17 | |
| risk low | #DDEFE0 / #1B5E20 | |

- Font: **Atkinson Hyperlegible** 400/700 (self-host in `public/fonts` so it works offline).
- Phone-first at 390 px; on wide screens center a 480 px column.
- Accessibility: real `<button>`/`<input>`/`<label>`; triage never shown by color alone; contrast ≥ 4.5:1; focus moves to each new question heading; `aria-live` on counters; works at 200% text zoom.

---

## 10. PWA and offline

- `vite-plugin-pwa` with `registerType: 'autoUpdate'`; manifest: name "ReadyNet", short_name "ReadyNet", `display: standalone`, theme `#0B1620`, background `#F4F6F8`, icons 192/512/maskable.
- Precache app shell + fonts + icons.
- Firestore: `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`.
- Resident: after submit, use `waitForPendingWrites()` / snapshot `metadata.hasPendingWrites` to show "Saved — will send when you have signal" vs "Sent".
- Show an Online/Offline pill in the header (`navigator.onLine` + events).

---

## 11. Differences from the prototype (build these, not the prototype)

1. **Triage color uses medical answers only.** In the prototype, a "Yes" to fire/collapse/flood/trapped could turn an uninjured person green. Surroundings answers affect area risk and alerts only.
2. **Access code:** shared code ≥ 6 characters (Firebase rule) plus the responder's name. Prototype used `1989` with no name.
3. **Teams:** created on the day by the cache leader, minimum 3 people (prototype shows fixed sample teams).
4. **Map:** real Leaflet map with real coordinates instead of the prototype's grid heat map. Zones are placeholder rectangles until the official CERT zone map is available.
5. **Real data:** check-ins come from Firestore. Sample data only via demo mode.
6. **"It's getting worse — alert again" button is removed.** Ignore the leftover `showWorse`/`markWorse` variables in the prototype script.
7. **Check-in note:** generate a short plain-language note from answers for responders (e.g. "Heavy bleeding, arm, not slowing with pressure. 1 not responding, breathing.").

---

## 12. Later (not for the competition — mention in the write-up)

- Individual responder accounts via invites from the CERT coordinator; turn off one person without changing the code.
- Photos in Cloud Storage (needs Blaze plan) instead of Firestore.
- Official Milpitas CERT zone boundaries (GeoJSON) and point-in-polygon zone lookup.
- SMS fallback when data networks are down.
- Translations (Chinese, Vietnamese, Tagalog, Spanish, Hindi).
- Supply-sharing at city caches.
- Medical review of all first-aid content.

---

## 13. Build plan (6 days)

| Day | Goal | Done when |
| --- | --- | --- |
| 1 | Vite + React + routes, tokens, Firebase project, anonymous auth, GitHub repo; public flow screens with local state | You can tap through every resident screen on a phone |
| 2 | `logic/` functions + quick tests; submit to Firestore with offline queue; Result + first aid + Photos + Done | A check-in appears in the Firestore console, also after going offline and back |
| 3 | Responder access + Do next tab live with `onSnapshot`, ranking, merging, status actions, photo viewer | A check-in from phone A appears on phone B within seconds; status changes sync |
| 4 | Map tab, Teams tab, demo data loader, PWA install, deploy to Firebase Hosting | Judges' link works on iPhone + Android; installable |
| 5 | Real-phone testing with CERT friends; fix issues; record demo video; write answers | Video recorded |
| 6 | Final fixes, submit early | Submitted before Oct 26, 12:00 p.m. ET |

---

## 14. Acceptance checklist

- [ ] Resident can complete a check-in in about a minute, including for someone else
- [ ] People, hurt and trapped counts are saved and shown to responders
- [ ] "Seriously" injured → Red; spurting bleeding → Red; steady bleeding that slows with pressure → Yellow; "Minor injury" → Green; no injuries → White; fire alone does **not** change the color
- [ ] Arm/leg spurting bleeding shows the tie-above-the-wound step; head/neck never does
- [ ] Not responding but breathing shows the recovery position first
- [ ] Trapped = Yes shows the rescue banner and makes the area High risk
- [ ] Airplane mode: check-in still completes, says it will send later, and arrives after reconnecting
- [ ] Photos (optional, after submit) appear in the responder photo viewer
- [ ] Responder view requires the code; wrong code shows an error; name recorded on actions
- [ ] Do next list is ranked red/trapped first; duplicates within 50 m / 60 min merge with a report count
- [ ] Status moves New → Assigned → On scene → Resolved with times and team, live on all responder devices
- [ ] Check-ins older than 60 min are faded and marked "may be out of date"
- [ ] Teams need 3+ members; teams with no update in 30 min show a warning
- [ ] Map shows numbered markers; tapping one opens its card
- [ ] App installs to the home screen and loads offline after the first visit
- [ ] Residents cannot read other residents' check-ins (test with Firestore rules)

---

## 15. Honest use of AI

Aditi designed the app (problem from CERT training, questions, triage approach, feedback from the Milpitas fire marshal and CERT members, every design decision) and used Claude (AI) to help design the prototype and write the code. Keep `AI_LOG.md` updated during the build. Keep the code simple and commented so Aditi can explain how the triage color is decided, how a check-in reaches the responder screen, and how the list is ranked.
