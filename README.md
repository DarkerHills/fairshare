# Fairshare

A shared chore rota for households of 2 to 6 people, built from the Fairshare PRD.
React + Vite + Tailwind v4 + shadcn/ui (Radix, Maia style), with Motion for animation.

```bash
npm install
npm run dev
```

- `src/lib/engine.ts`: the rotation and fairness rules (effort points, lowest-points-first assignment, tie-breaks, away mode, mid-month joiners)
- `src/lib/store.ts`: saving and syncing. Uses Firebase when `.env.local` is filled in, otherwise this browser's localStorage
- `src/lib/backend/`: the two storage options behind one interface
- `src/screens/`: landing, setup wizard, join and the four household tabs
- `src/components/illustrations/`: the blob housemates and scene illustrations

## Sharing across phones (Firebase, free)

Live at https://fair-share-c0299.web.app (Firebase project `fair-share-c0299`, Spark plan). After changing the code, `npm run deploy` publishes it again.

Fairshare runs on Firebase's free Spark plan: Cloud Firestore for the shared data and Firebase Hosting for the public link. The Spark plan has no payment method attached, so it can't bill you; if a free limit were ever passed, that service pauses until the next month.

1. Create a project at https://console.firebase.google.com and stay on the Spark plan.
2. Sign in to the Firebase CLI: `npx -y firebase-tools@15.34.1 login`
3. Copy `.env.example` to `.env.local` and fill in the web app settings.
4. `npm run deploy` builds the app and publishes the security rules and the site.

Security model: there are no accounts, so the share link is the key. Each house is one document at `houses/{id}` with a 16-character random id; `firestore.rules` allows opening a house by its exact id but never listing houses. "Make a new link" moves the house to a fresh id and locks the old one.
