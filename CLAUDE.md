# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint (eslint-config-next)
```

There is no test suite in this repo. `next.config.js` sets `eslint.ignoreDuringBuilds: true`, so lint errors will not fail `npm run build`.

Environment variables (read from `.env.local`, none committed as an example file exists in repo):
- `MONGODB_URI`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` — required
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth login
- `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD` — forgot-password email
- `GEMINI_API` — Google Gemini (`@google/genai` and `@google/generative-ai`, both used) for AI itinerary generation and weather-based suggestions
- `GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`, `GOOGLE_MAPS_API_KEY` — Places/Maps search and details
- `OPENWEATHER_API_KEY` — weather forecasts for trip suggestions
- `ORS_API_KEY` — OpenRouteService, driving distance in route optimization (falls back to haversine distance on failure)
- `NEXT_PUBLIC_BASE_URL` — used client-side for absolute links (e.g. shareable trip URLs)

## Architecture

Next.js 14 App Router project, plain JSX (no TypeScript). All code lives in `app/`, `components/`, `lib/`, `models/`.

### Auth

- NextAuth.js with JWT sessions, configured in `lib/auth.js` (`authOptions`), mounted at `app/api/auth/[...nextauth]/route.js`.
- Two providers: Credentials (email/password checked against `models/User.js`, bcrypt hashing/comparison lives on the schema) and Google OAuth (auto-links to an existing user by email, or creates one via `User.createFromGoogle`).
- `middleware.js` uses `next-auth/middleware` to gate `/dashboard/:path*`, `/trips/:path*`, `/profile/:path*`. Note the trailing routes like `app/community`, `app/destinations`, `app/settings` are **not** in the matcher — check session manually in those API routes/pages if they need auth.
- `User` requires `firstName`, `lastName`, `phone`, `city`, `country` at signup (see `app/api/auth/register/route.js`) — Google sign-in creates users with empty `phone`/`city`/`country` placeholders that must be backfilled later (see `app/api/user/route.js` / settings page).
- API routes resolve the current user by looking up `User.findOne({ $or: [{ googleId: session.user.id }, { email: session.user.email }] })` rather than trusting `session.user.id` directly as the Mongo `_id` — follow this pattern in new routes, since credentials-login sessions carry the Mongo `_id` while Google-login sessions may not.

### Data model — read this before touching trips/itineraries

`models/` defines **two parallel representations of trip data** that are not both in active use:
- `models/Trip.js` embeds everything directly: `destinations[]` (each with a nested `activities[]`) and a separate `itinerary[]` array of arbitrary items (destination/accommodation/transport/activity/meal/other), each with its own `coordinates`, `startDate`/`endDate`, `budget`. This embedded-document model is what all current API routes and pages actually read/write (`app/api/trips/**`, `app/api/optimize`, `app/api/generate-and-view`, `app/api/trips/[id]/weather-suggestions`).
- `models/Stop.js`, `models/Activity.js`, `models/City.js`, `models/SharedTrip.js` define a normalized, referenced schema (`Stop` → `Trip`/`City`, `Activity` → `Stop`) that is exported from `models/index.js` but has **no current callers** anywhere in `app/`. Treat these as either unfinished or superseded — don't assume they're wired up, and check with the user before building new features on them.

Within `Trip`, the `itinerary[]` array (not `destinations[]`) is the one AI generation and optimization write to:
- `POST /api/generate-and-view/[tripId]` calls Gemini (`@google/genai`, model `gemini-2.5-flash`, structured JSON via `responseSchema`) to generate a full `itinerary[]` from the trip's destinations/dates/budget, then overwrites `trip.itinerary` and redirects to `/trips/[id]/itinerary/view`.
- `POST /api/optimize` reorders `trip.itinerary` using a nearest-neighbor heuristic (`haversine-distance`), splitting legs into "flight" (>100mi, straight-line haversine) vs "car" (driving distance from OpenRouteService, with haversine fallback if the ORS call fails), and estimates money/distance saved with a hardcoded linear model (`MODEL_COEFFS`).
- `GET /api/trips/[id]/weather-suggestions` walks `trip.itinerary`, pulls OpenWeather forecasts and Google Places nearby results per day, and asks Gemini (via `@google/generative-ai`, dynamically imported) for a packing list / conflict list / reschedule suggestion per day, with a full rule-based fallback (`ruleBasedPacking`, `getGeminiSuggestionsEnhanced`) if the Gemini call or JSON parsing fails. Follow this fallback-on-LLM-failure pattern for any new AI-backed route rather than letting the request 500.

### DB connection

`lib/mongodb.js` caches the Mongoose connection on `global.mongoose` (standard Next.js hot-reload-safe pattern) and is the preferred way to connect. Some newer routes (`app/api/optimize`, `app/api/trips/[id]/weather-suggestions`) instead call `mongoose.connect(process.env.MONGODB_URI)` directly — both work against the same cached connection under the hood, but prefer `connectDB()` from `lib/mongodb.js` for consistency in new code.

### Import style

The codebase mixes deep relative imports (`../../../../lib/mongodb`) and the `@/*` alias (configured in `jsconfig.json` and `components.json`, mapped to repo root) inconsistently, sometimes within the same file. Prefer `@/*` for new code, but don't do a drive-by rewrite of existing imports unless asked.

### UI components

`components.json` configures shadcn/ui conventions (aliases `@/components`, `@/lib/utils`, `@/components/ui`, lucide icons), but `components/ui/` currently only has a couple of hand-built components (`Button_1.jsx`, `Input_1.jsx`, `WorldMap.jsx`) rather than a full shadcn set — check what exists before assuming a shadcn primitive is present.

### External integrations summary

- **Gemini** (itinerary generation, weather-based packing/reschedule suggestions) — two different SDKs used in different routes (`@google/genai` vs `@google/generative-ai`); don't assume they're interchangeable when editing.
- **Google Places** (`app/api/places/search`, `app/api/places/details`, city/destination search) and **Google Maps**.
- **OpenWeatherMap** (5-day/3-hour forecast, averaged per day) for weather suggestions.
- **OpenRouteService** for driving distances in `/api/optimize`, with a haversine fallback on any failure — always keep that fallback when touching this code, since the key is optional in some environments.
