# Frontend — MMU Smart Parking System

Next.js (App Router) admin dashboard showing live parking occupancy, recent entry/exit events, and operator controls.

## What it does

- **Occupancy overview** — live slot grid (occupied/available) driven by backend state
- **Summary cards** — current count, capacity, last-updated timestamp
- **Recent events** — rolling entry/exit detection log
- **Manual correction** — operators can override the occupancy count when detection drifts (calls `POST /events/set-count`); the system treats CV imperfection as a first-class concern
- **Prototype info** — explains the 4-slot, entry/exit-camera setup to viewers

## Structure

```
app/
  dashboard/
    page.tsx                  # Dashboard route
    components/
      DashboardHeader.tsx
      SummaryCards.tsx
      OccupancyGrid.tsx       # Live slot visualisation
      RecentEvents.tsx        # Entry/exit event log
      ManualCorrection.tsx    # Operator count override
      PrototypeInfo.tsx
hooks/
  useParkingStats.ts          # Polls backend for occupancy state
  useRecentEvents.ts          # Polls backend for event history
lib/
  api.ts                      # Backend API client
  parking.config.ts           # Zone/capacity configuration
  firebase.ts                 # Firebase client config
```

State comes from the NestJS backend via API polling (migrated from direct Firestore listeners to centralize state ownership — see root README, "Engineering decisions").

## Run

```bash
npm install
npm run dev        # http://localhost:3000/dashboard
```

Requires the [backend](../backend/) running on port 5000/5001 and Firebase keys in `.env.local`.
