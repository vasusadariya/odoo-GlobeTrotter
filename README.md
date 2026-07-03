# GlobeTrotter — Travel Planning Application

Live demo video: https://www.youtube.com/watch?v=Z6XR_HXK9Wg

A full-stack travel planning app: build multi-city itineraries by hand or with AI, track group expenses, get weather-aware packing nudges, collaborate with co-travelers, and browse/publish trips to a community feed.

## Tech Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS — plain JSX, no TypeScript
- **Backend**: Next.js Route Handlers, MongoDB with Mongoose
- **Authentication**: NextAuth.js (JWT sessions) — Credentials (email/password) and Google OAuth
- **AI**: Google Gemini (`gemini-2.5-flash`) for itinerary generation and weather-based packing suggestions
- **Maps/Places**: Google Places & Maps APIs
- **Weather**: OpenWeatherMap
- **Routing**: OpenRouteService (driving distance), with a haversine fallback
- **Email**: Nodemailer (password reset, trip invites, weather nudges)
- **Scheduling**: Vercel Cron (daily weather-nudge job)
- **Rich text**: react-quill-new (community post editor)

## Features

### Accounts & Auth
- Email/password registration and login, with bcrypt password hashing
- Google OAuth sign-in (auto-links to an existing account by email, or creates a new one)
- Forgot/reset password via emailed token (bcrypt-hashed, 10-minute expiry)
- Per-user preferences: currency, language, email/push/marketing notification toggles, profile/trip visibility

### Trip Planning
- **Create a trip**: name, description, dates, budget, one or more destinations, privacy (private/public)
- **My Trips**: list, filter, and manage your trips
- **Trip detail page**: overview, budget summary, destinations, quick actions (publish, invite, readiness, optimize)
- **Itinerary builder**: add/reorder/edit day-by-day sections manually, with live place search (Google Places) for each location
- **AI itinerary generation** (Gemini): generate a full day-by-day itinerary from your trip's dates, destinations, and budget
- **Scoped AI regeneration**: regenerate a single day/item in place without touching the rest of the itinerary — useful for "I don't like this one activity" without a full re-roll
- **Itinerary view**: a visual, flowchart-style read view of the full trip

### Route Optimization
- Reorders itinerary stops using a nearest-neighbor heuristic to minimize backtracking
- Splits legs into flights (>100mi, straight-line distance) vs. driving (real driving distance via OpenRouteService, haversine fallback if that call fails)
- Estimates distance saved, money saved, and CO2 saved
- **Non-mutating preview**: see the optimized route and its savings before committing — the trip is only updated if you explicitly apply it
- A separate route-preview endpoint lets the itinerary *builder* show live route/CO2 estimates while you're still adding destinations, before anything is saved

### Group Collaboration
- Invite collaborators or viewers by email (tokenized invite links, 7-day expiry)
- Role-based permissions: owners and collaborators can edit the itinerary; viewers (and the public, on public trips) can view it
- Per-item comments and quick emoji reactions on any itinerary entry, visible to every traveler on the trip

### Expense Tracking
- Log real expenses against any itinerary item (category, amount, currency, who paid, who it's split between)
- Automatic equal-split default across current trip travelers
- Per-traveler balance summary: total paid, total owed, net balance
- Actual-spend view sits alongside the trip's planned budget

### Weather-Aware Planning
- Per-day weather forecast (OpenWeatherMap) matched against the trip's itinerary
- AI-generated packing list and outdoor/indoor activity conflict warnings (Gemini), with a full rule-based fallback if the AI call fails or returns unusable data
- **Proactive email nudges**: a daily cron job checks trips starting within 7 days, computes weather conflicts, and emails the owner a packing list / reschedule suggestion — throttled to once per 20 hours per trip, and gated on the user's notification preference

### Trip Readiness Dashboard
- One page pulling together: days until departure, a deduplicated packing list, unresolved weather conflicts, and current budget status (planned vs. actual spend) — a single "are we ready to go" view

### Destination Discovery
- **City guide**: a curated, real destination store (region, cost index, tags, images) that grows automatically as real destinations get added to trips
- **Recommendations**: personalized destination suggestions based on your trip history — countries you haven't been, boosted toward your home country, with a cold-start fallback to overall popularity
- Search cities directly (Google Places-backed), with "Add to Trip" when arriving from a trip context
- Homepage destination search with filters (region, cost level, tags)

### Community
- Publish a finished trip as a public community post (auto-generates a title/summary/tags from the trip's itinerary and destinations)
- Browse and read community posts, with a link back to the original trip
- Create original posts with a rich-text editor, cover image, and tags
- Unpublish a trip's post at any time (owner-only)

## Environment Variables

See `.env.example` for the full list. Only `MONGODB_URI`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` are strictly required to run the app — everything else degrades gracefully when unset (mock/rule-based fallbacks, or that specific feature just doesn't activate).

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | Database connection |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Yes | Auth/session |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | No | Google OAuth login |
| `EMAIL_SERVER_HOST/PORT/USER/PASSWORD` | No | Password reset, trip invites, weather nudge emails |
| `GEMINI_API` | No | AI itinerary generation, weather packing suggestions |
| `GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`, `GOOGLE_MAPS_API_KEY` | No | Place search/details |
| `OPENWEATHER_API_KEY` | No | Weather forecasts |
| `ORS_API_KEY` | No | Real driving distances (falls back to haversine) |
| `NEXT_PUBLIC_BASE_URL` | No | Absolute links (invite emails, shareable URLs) |
| `CRON_SECRET` | No | Authenticates the Vercel Cron weather-nudge job |

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB database (local or Atlas)
- Optional: Google OAuth credentials, Gemini API key, Google Places/Maps key, OpenWeatherMap key, ORS key, SMTP credentials

### Installation

```bash
npm install
cp .env.example .env.local   # then fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
npm run dev      # start dev server (localhost:3000, Turbopack)
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint
```

There is no automated test suite — verify changes by running the app and exercising the flow you touched.

### Google OAuth Setup (optional)
1. [Google Cloud Console](https://console.cloud.google.com/) → create/select a project
2. APIs & Services → OAuth consent screen → add yourself as a test user if the app is in "Testing" mode
3. Credentials → Create OAuth client ID (Web application)
4. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Put the client ID/secret in `.env.local`

### Email Setup (optional, for Gmail)
1. Enable 2-factor authentication on the Google account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use that (not your normal password) as `EMAIL_SERVER_PASSWORD`

## Project Structure

```
/app
  /api/auth/                    # register, login (NextAuth), forgot/reset password
  /api/trips/                   # trip CRUD, itinerary, invites, comments, expenses,
                                 # readiness, weather-suggestions, route-preview, publish
  /api/generate-and-view/       # AI itinerary generation (full + scoped)
  /api/optimize/                # route optimization
  /api/cities/, /api/destinations/recommended/  # city guide + recommendations
  /api/community/               # community posts
  /api/places/                  # place search (Google Places)
  /api/cron/weather-nudges/     # scheduled weather-nudge emails
  /api/user/                    # profile/settings

  /auth/                        # login, register, forgot/reset password pages
  /trips/                       # trip list, create, detail, itinerary builder/view, readiness
  /community/                   # browse, create, view posts
  /destinations/, /search/cities/  # destination discovery
  /dashboard/, /settings/       # user dashboard, preferences

/components
  /ui/                          # Button_1, Input_1 (hand-built, not full shadcn)
  /layout/                      # Header, Footer
  InviteCollaboratorModal.jsx, ItineraryComments.jsx, ExpenseTracker.jsx,
  TopRegionalCities.jsx, ...

/lib
  mongodb.js                    # cached Mongoose connection
  auth.js                       # NextAuth configuration
  mail.js                       # shared email sender (console-logs if unconfigured)
  cityGuide.js, cityImage.js, geoRegions.js, places.js
  weatherConflicts.js           # weather forecast + AI/rule-based packing logic
  routeOptimize.js              # nearest-neighbor optimization, CO2/money estimates
  expenseSummary.js             # per-traveler balance computation
  itineraryIds.js               # guarantees unique itinerary item ids
  publishTrip.js                # builds a CommunityPost from a Trip

/models
  User.js, Trip.js, City.js, CommunityPost.js, TripInvite.js,
  ItineraryComment.js, Expense.js
```

## Data Model Notes

- `Trip.itinerary[]` is the array AI generation, route optimization, and the itinerary builder all read/write — each item has its own dates, coordinates, and budget.
- `ItineraryComment` and `Expense` are separate collections (not embedded in `Trip`), because `trip.itinerary` gets fully overwritten on save/regenerate — embedding would risk silently losing comments/expenses on every itinerary edit.
- `City` is a curated destination-guide store, populated on-demand whenever a real destination is attached to a trip (not a static seed list).

## Deployment

Deploys cleanly to Vercel:

```bash
npm run build
```

Set all required/desired environment variables in the Vercel dashboard, and add the weather-nudge cron job (already configured in `vercel.json`, runs daily).
