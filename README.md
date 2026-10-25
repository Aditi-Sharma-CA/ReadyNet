# ReadyNet

**Disaster check-in for Milpitas, CA.** After a major earthquake, residents check in from their phone in about a minute. CERT volunteers and first responders get a live, ranked list of where to go first, following the triage principle **"the greatest good for the greatest number."**

- **Try the app:** https://readynet-f750a.web.app
- **Responder view:** https://readynet-f750a.web.app/responder (needs the responder access code)

Built by Aditi, a 9th grader and Milpitas CERT member, for the 2026 Congressional App Challenge (CA-17).

---

## The problem

After a big earthquake, 911 is overwhelmed. In CERT training, volunteers learn to walk their zone door to door to find out who is hurt, and canvassing one zone can take hours. Meanwhile, nobody knows which house has someone trapped or bleeding.

ReadyNet flips this around: residents report from their phones, and volunteers get one ranked list.

## What it does

**For residents (the public check-in, `/`)**
- Location from GPS, or a typed address or landmark
- Check in for **yourself or someone else**, and count the people and the hurt at that location
- One question per screen about injuries and surroundings
- Get a **triage color** (red / yellow / green / white), the **area risk**, and **step-by-step first aid** to do while waiting (stop heavy bleeding, recovery position, broken bones, shock)
- Optional photos for responders
- **Works with no signal:** the check-in is saved on the phone and sends itself when signal returns

**For CERT volunteers and first responders (`/responder`)**
- Locked with your name and a shared access code
- **Do next:** a live list, most urgent first, numbered (red and trapped first, then where the most people are hurt)
- **Duplicate reports merge** into one card ("5 reports merged into one")
- **Status tracking:** Assign a team → Mark reached → Mark resolved, with the time and responder name recorded
- **Map** of Milpitas with numbered, color-coded markers and CERT zone outlines
- **Teams** made on the day at the cache (3 or more people), with a warning when a team hasn't updated in 30 minutes
- Photo viewer, Navigate button (opens Google Maps), and a 60-minute "may be out of date" warning

**Installable:** ReadyNet is a Progressive Web App. Add it to your home screen and it opens full-screen, even offline.

---

## Try it in 2 minutes

1. **Check in as a resident.** Open https://readynet-f750a.web.app on your phone → **Check in now** → allow location → answer the questions. Try "Heavy bleeding" → "Arm or leg" → "Spurting or pulsing" to see the red result and the bleeding steps.
2. **Open the responder view.** Go to `/responder`, enter your name, pick a zone and enter the access code.
3. **Load the sample data.** Scroll to the bottom of **Do next** → **Load demo data**. The list fills with sample Milpitas check-ins (made-up people), including a 5-report merged incident with photos.
4. **Explore.** Open **Photos**, assign a team, mark it reached and resolved, then open the **Map** and **Teams** tabs.
5. When you're done, tap **Clear demo data**.

### Demo script (for the video)
1. *Phone A (resident):* the earthquake alert → check in for a neighbor → 2 people, 1 hurt → "Seriously" injured, heavy bleeding from the leg that won't stop → trapped: Yes, 1.
2. *Result:* **Red**, "Rescue alert sent", **High risk**, and the first-aid steps, including "Tie above the wound".
3. *Phone B (responder):* the check-in appears at the **top of Do next within seconds**, with no refresh.
4. Show the merged card, its photos, **Assign a team** → **Mark reached**, then the **Map** (tap a dot to jump to its card) and the **Teams** tab.
5. *Offline:* turn on Airplane mode on Phone A, check in again ("Saved — will send when you have signal"), turn it off, and watch it arrive on Phone B.

---

## How it works

```
 Resident phone (PWA)                          Responder phone (PWA)
 questions + triage rules (JavaScript)         live ranked list, map, teams
          │  Firebase SDK                               │  Firebase SDK
          │  anonymous sign-in, offline queue           │  shared responder sign-in
          ▼                                             ▼
 ┌───────────────────────────────────────────────────────────────────┐
 │ Firebase: Authentication · Cloud Firestore · Hosting              │
 │ Security rules: residents create + read their own check-ins;      │
 │ responders read and update everything.                            │
 └───────────────────────────────────────────────────────────────────┘
```

**All the decisions run on the phone** as small, plain JavaScript functions in [`src/logic/`](src/logic/). There is no server code.

### The triage color ([`triage.js`](src/logic/triage.js))
Every medical answer has a score: **3 = red, 2 = yellow, 1 = green, 0 = white**. The color is the **highest** score, so one serious answer is enough for red.

| Example answer | Score |
| --- | --- |
| Injured: "Seriously" · Trouble breathing or chest pain · Bleeding is spurting · Pressure doesn't slow it · Not responding, but breathing | 3 (red) |
| Injured, but it can wait · Can't walk · Steady bleeding that soaks a cloth · Possible broken bone | 2 (yellow) |
| Minor injury · Slow ooze | 1 (green) |
| No injuries | 0 (white) |

Surroundings (fire, collapse, flooding, trapped) **never** change the color. They set the **area risk** instead ([`risk.js`](src/logic/risk.js)), so an uninjured person next to a fire stays white but their area shows **High risk**.

### Ranking the Do next list ([`ranking.js`](src/logic/ranking.js))
```
priority = color tier × 1000  (red 3, yellow 2, green 1)
         + 3000 if anyone is trapped
         + 50 per trapped person + 10 per hurt person + 1 per person
```
The biggest number goes first. Uninjured (white) check-ins with nobody trapped aren't listed; they only count toward the totals.

### Merging duplicates
Open check-ins **within 50 m of each other (or with the same address) and within 60 minutes** become one incident. It takes the worst color, the biggest counts, all hazards and all photos. Each resident's check-in is still stored separately, and the status buttons update all of them together in one batch write.

### Offline first
- The app itself is saved on the phone by a **service worker**, so it opens with no signal after the first visit.
- Check-ins are written to Firestore's **queue on the phone**, which sends them automatically when signal returns. The resident sees "Saved — will send when you have signal" until `waitForPendingWrites()` confirms the server has it.

### Live updates
The responder view subscribes to the database with `onSnapshot`. Whenever any check-in is added or changed, every responder phone gets the new list within seconds.

### Privacy and security ([`firestore.rules`](firestore.rules))
- Residents sign in **anonymously**, so no name, email or phone number is collected.
- A resident can create check-ins and read **only their own**. Responders can read and update everything.
- Check-ins can't be deleted, except sample data marked `demo: true`.
- Photos are shrunk on the phone (max 1024 px, under 700 KB) and only responders can see them.
- No analytics or tracking.

---

## Tech stack

| Part | Choice |
| --- | --- |
| App | React 18 + Vite, plain JavaScript, plain CSS with design tokens |
| Database | Firebase Cloud Firestore (live updates + offline persistence) |
| Sign-in | Firebase Authentication (anonymous for residents, one shared account for responders) |
| Hosting | Firebase Hosting (HTTPS, needed for GPS and installing) |
| Installable app | vite-plugin-pwa (manifest + service worker) |
| Map | Leaflet + react-leaflet + OpenStreetMap tiles (free, no API key) |
| Font | Atkinson Hyperlegible, designed for low-vision readability, bundled for offline use |
| Tests | Node's built-in test runner (`npm test`) |

Everything runs on Firebase's free Spark plan.

## Project structure

```
src/
  main.jsx, App.jsx        routes: "/" resident, "/responder" responder
  firebase.js              Firebase setup, anonymous sign-in, offline cache
  data/                    question text, first-aid text, zones (edit wording here)
  logic/                   all the rules as small pure functions (triage, risk, flow,
                           first aid, ranking + merging, teams, notes, zones, time)
  public/                  resident screens (one file per screen)
  responder/               responder screens (access, Do next, card, map, teams, photos)
  demo/loadDemoData.js     loads seed/ sample data (demo mode only)
  styles/                  tokens.css (colors), base.css, responder.css
tests/logic.test.js        automatic tests for src/logic/
seed/                      sample check-ins, teams and placeholder zones
prototype/                 the approved design prototype screens
HANDOVER.md                full specification
AI_LOG.md                  record of what Aditi decided and what AI built
```

---

## Run it yourself

You need **Node.js 20+** and a **Firebase project** on the free Spark plan.

1. **Install**
   ```bash
   npm install
   ```
2. **Set up Firebase** (console.firebase.google.com)
   - Add a **Web app** and copy its config.
   - **Firestore Database:** create it (production mode).
   - **Authentication** (under *Security*): enable **Anonymous** and **Email/Password**.
   - Add one user, `responder@readynet-milpitas.app`. Its password is the shared responder code (6+ characters).
3. **Create `.env.local`** in the project folder. It's never committed:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_RESPONDER_EMAIL=responder@readynet-milpitas.app
   VITE_DEMO=true            # shows the Load / Clear demo data buttons
   ```
4. **Run**

   | Command | What it does |
   | --- | --- |
   | `npm run dev` | Development server (also on your Wi-Fi, for testing on a phone) |
   | `npm test` | Runs the automatic tests for the rules |
   | `npm run build` | Builds the app into `dist/` |
   | `npm run preview` | Serves the built app locally |
   | `npx firebase deploy` | Uploads the security rules and the app to Firebase Hosting |

   If you use your own Firebase project, put its ID in `.firebaserc`.

---

## Limitations and next steps

Being honest about what's not finished:

- **First-aid text is a placeholder.** It needs review by the fire department or a Stop the Bleed instructor before real use. The wording lives in [`src/data/firstAid.js`](src/data/firstAid.js), so it can be changed without touching the logic.
- **CERT zones are placeholder rectangles.** They should be replaced with the official Milpitas CERT zone map.
- **One shared responder code.** Next: individual responder accounts from the CERT coordinator, so one person can be turned off without changing the code for everyone.
- Photos are stored in Firestore to stay on the free plan. Cloud Storage would be better at scale.
- Later ideas: an SMS fallback when data networks are down, translations (Chinese, Vietnamese, Tagalog, Spanish, Hindi), and supply sharing at city caches.

---

## Honest use of AI

Aditi designed ReadyNet: the problem (from her CERT training), the questions, the triage approach, the changes after feedback from the Milpitas fire marshal and CERT members, and every design decision. She used **Claude (AI, by Anthropic)** to help design the prototype, write documents and write the code. [`AI_LOG.md`](AI_LOG.md) records, session by session, what Aditi asked for and decided and what the AI built.

## Credits

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, drawn with [Leaflet](https://leafletjs.com/)
- [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) font by the Braille Institute
- Built with [React](https://react.dev/), [Vite](https://vitejs.dev/) and [Firebase](https://firebase.google.com/)
