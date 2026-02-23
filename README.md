# Milo Meal Log (PWA prototype)

Mobile-first (iPhone-first) Progressive Web App for tracking cats' food/snack intake with Stockholm-time day logic.

## Product Decisions

- **Household-first data partitioning**: all records are nested under a `households/{householdId}` root for simple, secure data sharing for two equal-permission users.
- **Single merged timeline source of truth**: portions and snacks are both represented as `events` and always rendered in one strict timestamp-sorted chronology for puke investigation.
- **Stockholm day interpretation**: timestamps are stored as ISO UTC (`eventAt`) and grouped by `stockholmDate` generated in app logic.
- **In-app reminders only (v1)**: CTA logic runs on app open / render; no background push.
- **Prototype storage layer**: current code uses an in-memory store for rapid UX validation; Firestore integration points are mapped in the data model and rules below.

## 1) Firestore data model (collections/docs)

```text
households/{householdId}
  name: string
  createdAt: ISO
  createdBy: uid

households/{householdId}/members/{uid}
  email: string
  role: 'member'        // equal permissions in v1
  joinedAt: ISO

households/{householdId}/cats/{catId}
  name: string
  photoUrl?: string
  createdAt: ISO

households/{householdId}/catalog/{itemId}
  kind: 'food' | 'snack'
  name: string
  imageUrl?: string
  active: boolean
  createdAt: ISO
  createdBy: uid

households/{householdId}/dailyPlans/{catId_YYYY-MM-DD}
  catId: string
  stockholmDate: 'YYYY-MM-DD'
  defaultFoodId?: string
  defaultFoodName?: string
  startedAt?: ISO
  plannedSlots: {
    portion1?: eventId,
    portion2?: eventId,
    portion3?: eventId
  }
  updatedAt: ISO

households/{householdId}/events/{eventId}
  catId: string
  eventType: 'portion' | 'snack'
  slot?: 'portion1'|'portion2'|'portion3'|'extra'
  itemId: string
  itemName: string
  amountChip?: '1/4'|'1/3'|'1/2'|'1/1'
  amountText?: string
  note?: string
  eventAt: ISO  // UTC instant
  stockholmDate: 'YYYY-MM-DD'
  createdAt: ISO
  createdBy: uid
  updatedAt?: ISO
```

### Recommended indexes

- `events`: composite index on `(catId asc, eventAt desc)`.
- `events`: composite index on `(catId asc, stockholmDate asc, eventAt desc)`.

## 2) Firestore security rules

See [`firestore.rules`](./firestore.rules). Highlights:

- Require auth for all reads/writes.
- Authorize access only if requesting user has a member document in the same household.
- Protect all subcollections (`cats`, `catalog`, `dailyPlans`, `events`) with membership check.

## 3) Today CTA + yesterday-incomplete state machine

State machine implemented in `src/lib/todayStateMachine.ts`.

### Inputs

- `todayPlan` for selected cat/day
- today's events (Stockholm day)
- Stockholm local hour
- `yesterdayMissing` + `todayStarted`

### CTA transitions

1. If no default food or Portion 1 missing => `Choose today's food`.
2. Else if hour >= 17 and Portion 2 missing => `Log Portion 2`.
3. Else if hour >= 20 and Portion 3 missing => `Log Portion 3`.
4. Else => no CTA.
5. After Portion 3 is logged (planned complete), show a small secondary **Log extra portion** button under the timer until day end.

### Yesterday modal transitions

- Show modal only when `yesterdayMissing && !todayStarted`.
- Actions:
  - **Finish yesterday** -> deep link to History filtered to yesterday.
  - **Start fresh today** -> choose default food and proceed.
- Once today starts (`startedAt` set), modal no longer appears on Today.

## 4) Implemented prototype (routes/components)

- `Today` dashboard with:
  - prominent “since last meal” timer,
  - latest event summary,
  - inline latest-event comment save,
  - **Recent timeline** (last 8 merged events, portions+snacks),
  - small secondary **Log extra portion** button appears after Portion 3 is logged,
  - CTA driven by state machine,
  - yesterday-incomplete modal.
- `Choose Food`: grid picker + add-new placeholder.
- `Log Portion`: slot (1/2/3/extra), food confirm, amount chips/free text, editable time.
- `Log Snack`: snack select, time, optional note.
- `History`: timeline-first view (merged portions+snacks), day filter, event-type toggles, edit/delete placeholders.
- `Settings`: cats/members/catalog placeholders.

## 5) Deployment steps + env vars

### Environment variables (`.env`)

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Firebase setup

1. Create Firebase project.
2. Enable **Authentication > Email link (passwordless)**.
3. Create Firestore database.
4. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Create Storage bucket for cat/item images and apply matching membership-based rules.

### Hosting

- Build app: `npm run build`
- Deploy via Firebase Hosting:
  ```bash
  firebase deploy --only hosting
  ```

### Notes

- Add Firestore offline persistence using `enableIndexedDbPersistence` for better disconnected usage.
- Replace mock store with Firestore listeners for real-time multi-user sync.


### Timeline guarantee

- Timeline lists are always rendered from one merged event stream and sorted by `eventAt` descending.
- This applies to both Today's Recent timeline and the History timeline mode.
