import haversine from "haversine-distance";

// Extracted from app/api/optimize/route.js so both that route and the new
// non-mutating route-preview endpoint (used while building an itinerary,
// before anything is saved) can share the same distance/ordering/savings math.

const MODEL_COEFFS = { intercept: -31, flight: 0.065, car: 0.45 };
const MILE_TO_KM = 1.60934;
const ORS_API_KEY = process.env.ORS_API_KEY;

// Simple constant emission factors (kg CO2 per km) - no external API needed.
const CO2_PER_KM = { flight: 0.15, car: 0.12 };

export async function getCarDistance(lat1, lng1, lat2, lng2) {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${lng1},${lat1}&end=${lng2},${lat2}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: ORS_API_KEY }
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("ORS API error response:", text);
      return haversine({ lat: lat1, lon: lng1 }, { lat: lat2, lon: lng2 }) / 1000;
    }

    const data = await res.json();
    return data.features[0].properties.summary.distance / 1000; // in km
  } catch (err) {
    console.warn("ORS API call failed, using haversine:", err.message);
    return haversine({ lat: lat1, lon: lng1 }, { lat: lat2, lon: lng2 }) / 1000;
  }
}

export function optimizeOrder(points) {
  if (points.length <= 2) return points;
  const remaining = [...points];
  const route = [remaining.shift()];

  while (remaining.length) {
    let last = route[route.length - 1];
    let nearestIndex = 0;
    let nearestDist = Infinity;

    remaining.forEach((p, i) => {
      const dist = haversine(last.coordinates, p.coordinates);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    });

    route.push(remaining.splice(nearestIndex, 1)[0]);
  }
  return route;
}

export function predictMoneySaved(flightKmSaved, carKmSaved) {
  return (
    MODEL_COEFFS.intercept +
    MODEL_COEFFS.flight * flightKmSaved +
    MODEL_COEFFS.car * carKmSaved
  );
}

export function estimateCO2({ flightKm = 0, carKm = 0 }) {
  return flightKm * CO2_PER_KM.flight + carKm * CO2_PER_KM.car;
}

export { MILE_TO_KM };
