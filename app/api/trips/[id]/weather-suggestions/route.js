import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Trip from "../../../../../models/Trip";

const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API || null;

// Helper: format date to YYYY-MM-DD
function formatDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

// -------------------- OpenWeather (5-day 3-hour) --------------------
async function fetchDayWeatherOpenWeather(lat, lon, date) {
  if (!OPENWEATHER_KEY) {
    console.warn("OPENWEATHER_API_KEY missing");
    return null;
  }

  const target = formatDate(date);
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    console.error("Weather API error", txt);
    return null;
  }
  const data = await res.json();

  const dayForecasts = data.list.filter(item => formatDate(new Date(item.dt * 1000)) === target);
  if (!dayForecasts.length) return null;

  const avgTemp = dayForecasts.reduce((s, it) => s + it.main.temp, 0) / dayForecasts.length;
  const avgHumidity = dayForecasts.reduce((s, it) => s + it.main.humidity, 0) / dayForecasts.length;

  // Majority / middle condition
  const conds = dayForecasts.map(it => it.weather[0].description);
  const mainCondition = conds[Math.floor(conds.length / 2)] || conds[0] || "clear";

  // rain chance: average pop (if present)
  const pops = dayForecasts.map(it => (typeof it.pop === "number" ? it.pop : 0));
  const rainChance = pops.length ? (pops.reduce((s, v) => s + v, 0) / pops.length) * 100 : 0;

  return {
    temp: Math.round(avgTemp * 10) / 10,
    humidity: Math.round(avgHumidity),
    condition: mainCondition,
    rainChance: Math.round(rainChance * 10) / 10
  };
}

// -------------------- Google Places Nearby --------------------
async function getNearbyPlaces(lat, lng, radius = 5000, limit = 10) {
  if (!PLACES_KEY) {
    console.warn("GOOGLE_PLACES_API_KEY missing");
    return [];
  }
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${PLACES_KEY}&language=en`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Places API error", await res.text());
    return [];
  }
  const j = await res.json();
  if (!j.results) return [];
  // Map to simple objects
  return j.results.slice(0, limit).map(r => ({
    name: r.name,
    types: r.types || [],
    place_id: r.place_id,
    vicinity: r.vicinity || "",
    rating: r.rating || null,
    user_ratings_total: r.user_ratings_total || 0
  }));
}

// -------------------- Heuristics --------------------
const INDOOR_TYPES = new Set([
  "museum", "art_gallery", "shopping_mall", "aquarium", "movie_theater",
  "library", "spa", "bowling_alley", "indoor_playground", "gym"
]);
const OUTDOOR_TYPES = new Set([
  "park", "tourist_attraction", "point_of_interest", "natural_feature", "beach", "zoo"
]);

function classifyPlaceIndoorOutdoor(types = [], name = "") {
  if (!types || !types.length) {
    const lname = name.toLowerCase();
    if (lname.includes("museum") || lname.includes("gallery") || lname.includes("mall") || lname.includes("aquarium") || lname.includes("spa")) return "indoor";
    if (lname.includes("park") || lname.includes("garden") || lname.includes("beach") || lname.includes("zoo")) return "outdoor";
    return "unknown";
  }
  if (types.some(t => INDOOR_TYPES.has(t))) return "indoor";
  if (types.some(t => OUTDOOR_TYPES.has(t))) return "outdoor";
  return "unknown";
}

function isPlanOutdoor(description = "") {
  if (!description) return false;
  const d = description.toLowerCase();
  const outdoorKeywords = ["beach", "park", "hike", "trek", "trail", "swim", "picnic", "walking tour", "bike"];
  return outdoorKeywords.some(k => d.includes(k));
}

// -------------------- Reschedule logic --------------------
function findRescheduleDay(index, daysWeather, sameCoordIndices = []) {
  // prefer days in sameCoordIndices with rainChance < 40 and moderate temp (10-32)
  for (const i of sameCoordIndices) {
    if (i === index) continue;
    const w = daysWeather[i];
    if (!w) continue;
    if ((w.rainChance || 0) < 40 && (w.temp >= 8 && w.temp <= 33)) return i;
  }
  // fallback: choose day with lowest rainChance among sameCoordIndices
  let best = null;
  let bestRain = 1000;
  for (const i of sameCoordIndices) {
    const w = daysWeather[i];
    if (!w) continue;
    if ((w.rainChance || 0) < bestRain) {
      bestRain = w.rainChance || 0;
      best = i;
    }
  }
  return best;
}

// -------------------- Lightweight rule-based packing generator (fallback) --------------------
function ruleBasedPacking({ weather, description, notes }) {
  const items = new Set();

  // Weather-driven
  if ((weather.rainChance || 0) >= 50) {
    items.add("compact umbrella");
    items.add("light waterproof jacket");
    items.add("waterproof phone pouch");
  }
  if (weather.temp >= 30 && weather.humidity >= 65) {
    items.add("breathable quick-dry shirt");
    items.add("electrolyte sachets/hydration tablets");
    items.add("lightweight sun hat");
  }
  if (weather.temp <= 10) {
    items.add("insulating layer/thermal top");
  }
  if (weather.humidity >= 70) {
    items.add("antiseptic wipes");
    items.add("light, breathable clothing");
  }

  // Plan-driven
  const d = (description || "").toLowerCase();
  if (d.includes("hike") || d.includes("trek") || d.includes("trail")) {
    items.add("sturdy hiking shoes");
    items.add("small daypack");
    items.add("sunscreen (sport)");
  }
  if (d.includes("beach") || d.includes("snorkel") || d.includes("sea")) {
    items.add("swimwear");
    items.add("water shoes / sandals with grip");
    items.add("quick-dry towel");
  }
  if (d.includes("museum") || d.includes("gallery")) {
    // nothing special except comfortable shoes
    items.add("comfortable shoes");
  }
  if (d.includes("food") || d.includes("dining")) {
    items.add("cash/small change for stalls");
  }

  // Insect risk heuristic for humid/warm weather
  if (weather.temp >= 20 && weather.humidity >= 60) {
    items.add("insect repellent");
  }

  // Only return essential, location-specific items (limit)
  return Array.from(items).slice(0, 12);
}

// -------------------- Gemini integration (attempt dynamic import) --------------------
async function callGeminiPrompt(prompt) {
  // Try to dynamically import the official client, if it's available
  try {
    const mod = await import("@google/generative-ai");
    const { GoogleGenerativeAI } = mod;
    if (!GEMINI_KEY) throw new Error("GEMINI_API not set");

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const out = await model.generateContent(prompt);
    return out.response.text();
  } catch (e) {
    console.warn("Gemini client not available or failed, falling back. Error:", e.message || e);
    return null;
  }
}

// -------------------- Compose Gemini prompt (strict JSON expected) --------------------
function buildGeminiPrompt({ location, date, weather, description, notes, nearbyList, filteredNearby, conflict, rescheduleSuggestion }) {
  const nearbyStr = nearbyList.length ? nearbyList.map(p => `${p.name} (${classifyPlaceIndoorOutdoor(p.types, p.name)})`).join(", ") : "[]";
  const filteredStr = filteredNearby.length ? filteredNearby.map(p => `${p.name} (${classifyPlaceIndoorOutdoor(p.types, p.name)})`).join(", ") : "[]";
  const conflictText = conflict ? "Yes" : "No";

  return `
You are a practical travel assistant that must return only valid JSON (no explanation).
Trip day:
- Location: ${location}
- Date: ${date}
- Weather summary: ${weather.condition}, ${weather.temp}°C, Humidity ${weather.humidity}%, Rain chance ${weather.rainChance}%
- Plan description: ${description || ""}
- Notes: ${notes || ""}
- Nearby attractions (raw): ${nearbyStr}
- Nearby attractions (post-filtered, weather-suitable): ${filteredStr}
- Is the plan weather-conflicting (yes/no): ${conflictText}
- If reschedule suggested: ${rescheduleSuggestion ? `move to ${rescheduleSuggestion}` : "none"}

Tasks (IMPORTANT):
1) Return a JSON object with only these keys:
   - packingList: an array of short strings (ONLY essential and location-specific items, avoid generic items like 'hat' unless truly necessary; prefer very specific items such as 'waterproof phone pouch', 'electrolyte sachets', 'reef-safe sunscreen SPF50', 'compact travel towel', 'waterproof hiking boots')
   - conflicts: array of strings describing why the plan may be disrupted (short)
   - alternatives: array of strings (selected only from the post-filtered nearby attractions list; include place name and one short reason why it's suitable)
   - reschedulePlan: either null or an object { activity: "<activity>", suggestedDate: "YYYY-MM-DD", reason: "<one-line reason>" }

2) Only suggest alternatives that are NOT already in the user's itinerary or description.
3) If filtered nearby is empty, suggest 1-2 practical indoor alternatives (e.g., "local mall with indoor food court") but avoid generic country-level suggestions. Prefer real place names if present.

Return strict JSON, for example:
{
  "packingList":["compact umbrella","waterproof phone pouch"],
  "conflicts":["Park visit at 16:00 — rain expected (60% chance)"],
  "alternatives":["Science Centre Surat (indoor) — hands-on exhibits, fully indoor"],
  "reschedulePlan": {"activity":"Park visit","suggestedDate":"2025-08-15","reason":"clear skies expected"}
}
`;
}

// -------------------- getGeminiSuggestions (tries LLM, else fallback) --------------------
async function getGeminiSuggestionsEnhanced(ctx) {
  // Build prompt
  const prompt = buildGeminiPrompt(ctx);

  // Try LLM
  const llmResp = await callGeminiPrompt(prompt);
  if (llmResp) {
    // strip fences and parse
    const cleaned = llmResp.replace(/```json|```/g, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (err) {
      console.warn("Could not parse Gemini response, falling back to rules.", err);
    }
  }

  // Fallback deterministic generator:
  const packingList = ruleBasedPacking({ weather: ctx.weather, description: ctx.description, notes: ctx.notes });

  const conflicts = ctx.conflict ? [`Planned activity may be disrupted by weather (rain ${ctx.weather.rainChance}%).`] : [];
  // Build alternatives from filteredNearby (map to short reason)
  const alternatives = (ctx.filteredNearby || []).slice(0, 3).map(p => `${p.name} — ${classifyPlaceIndoorOutdoor(p.types, p.name)} and suitable for current conditions`);
  // If none, add a practical indoor fallback
  if (!alternatives.length) {
    alternatives.push("Local covered market or indoor mall — good indoor option (check opening hours)");
  }

  const reschedulePlan = ctx.rescheduleIndex != null ? {
    activity: ctx.activityName || ctx.description || "Planned activity",
    suggestedDate: ctx.rescheduleDate,
    reason: `Better weather (lower rain chance) on ${ctx.rescheduleDate}`
  } : null;

  return { packingList, conflicts, alternatives, reschedulePlan };
}

// -------------------- MAIN Handler --------------------
export async function GET(req, { params }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing trip id" }, { status: 400 });

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const trip = await Trip.findById(id).lean();
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    // Build a list of day entries
    const days = trip.itinerary || [];
    // Pre-fetch weather for all days (so we can propose reschedules)
    const daysWeather = [];
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (!day.coordinates?.lat || !day.coordinates?.lng) {
        daysWeather[i] = null;
        continue;
      }
      daysWeather[i] = await fetchDayWeatherOpenWeather(day.coordinates.lat, day.coordinates.lng, day.startDate);
    }

    const daysOutput = [];
    // We'll also build a simple index mapping of places already in itinerary (names)
    const itineraryPlaceNames = new Set();
    for (const day of days) {
      if (day.destinations && day.destinations.length) {
        day.destinations.forEach(d => { if (d.name) itineraryPlaceNames.add(d.name.toLowerCase()); });
      }
      if (day.location) itineraryPlaceNames.add((day.location || "").toLowerCase());
      if (day.description) {
        // naive: split into words to detect place-like names (best-effort)
        // (we'll also check substring matching while filtering)
      }
    }

    // Loop each day and compute suggestions
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (!day.coordinates?.lat || !day.coordinates?.lng) continue;
      const lat = day.coordinates.lat;
      const lng = day.coordinates.lng;
      const date = formatDate(day.startDate);
      const weather = daysWeather[i];
      if (!weather) continue;

      // 1) Nearby real attractions
      const nearby = await getNearbyPlaces(lat, lng, 6000, 12); // 6km radius
      // 2) classify and filter by weather suitability
      const filteredNearby = nearby.filter(p => {
        const cls = classifyPlaceIndoorOutdoor(p.types, p.name);
        // exclude if name matches itinerary or description
        const lowerName = p.name.toLowerCase();
        if (itineraryPlaceNames.has(lowerName)) return false;
        if ((day.description || "").toLowerCase().includes(lowerName)) return false;
        // Basic weather rules:
        if ((weather.rainChance || 0) >= 60) {
          // prefer indoor; keep indoor or unknown
          return cls === "indoor" || cls === "unknown";
        }
        if (weather.temp >= 32 && weather.humidity >= 70) {
          // too hot & humid — avoid high-exertion outdoor spots (assume 'outdoor' are higher exertion)
          return cls !== "outdoor";
        }
        // otherwise allow all
        return true;
      });

      // 3) detect conflict between plan and weather
      const planIsOutdoor = isPlanOutdoor(day.description || "");
      const conflict = planIsOutdoor && (weather.rainChance || 0) >= 50;

      // 4) find reschedule candidate: other days in trip with same coordinates (or same location string)
      // collect indices with same coords (within small tolerance) or same location name
      const sameCoordIndices = [];
      for (let j = 0; j < days.length; j++) {
        if (!days[j]?.coordinates) continue;
        const a = days[j].coordinates;
        const latDiff = Math.abs(a.lat - lat);
        const lngDiff = Math.abs(a.lng - lng);
        if (latDiff < 0.0005 && lngDiff < 0.0005) sameCoordIndices.push(j);
        else if ((days[j].location || "").toLowerCase() === (day.location || "").toLowerCase()) sameCoordIndices.push(j);
      }

      let rescheduleIndex = null;
      let rescheduleDate = null;
      if (conflict && sameCoordIndices.length > 1) {
        const candidate = findRescheduleDay(i, daysWeather, sameCoordIndices);
        if (candidate != null) {
          rescheduleIndex = candidate;
          rescheduleDate = days[candidate] ? formatDate(days[candidate].startDate) : null;
        }
      }

      // 5) prepare context and call Gemini (or fallback)
      const ctx = {
        location: day.location || (day.destinations && day.destinations[0] && day.destinations[0].name) || "Unknown",
        date,
        weather,
        description: day.description || "",
        notes: day.notes || "",
        nearbyList: nearby,
        filteredNearby,
        conflict,
        rescheduleIndex,
        rescheduleDate,
        activityName: day.title || day.description || "Planned activity"
      };

      const suggestionObj = await getGeminiSuggestionsEnhanced(ctx);

      // Normalize output shape
      daysOutput.push({
        date,
        location: ctx.location,
        weather,
        packingList: Array.isArray(suggestionObj.packingList) ? suggestionObj.packingList : [],
        conflicts: Array.isArray(suggestionObj.conflicts) ? suggestionObj.conflicts : [],
        alternatives: Array.isArray(suggestionObj.alternatives) ? suggestionObj.alternatives : [],
        reschedulePlan: suggestionObj.reschedulePlan || null
      });
    }

    return NextResponse.json({ tripId: trip._id, days: daysOutput });
  } catch (err) {
    console.error("Error generating weather suggestions", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
