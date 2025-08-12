import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Trip from "@/models/Trip";
import haversine from "haversine-distance";

const MODEL_COEFFS = { intercept: -31, flight: 0.065, car: 0.45 };
const MILE_TO_KM = 1.60934;
const ORS_API_KEY = process.env.ORS_API_KEY;

async function getCarDistance(lat1, lng1, lat2, lng2) {
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

function optimizeOrder(points) {
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

function predictMoneySaved(flightKmSaved, carKmSaved) {
  return (
    MODEL_COEFFS.intercept +
    MODEL_COEFFS.flight * flightKmSaved +
    MODEL_COEFFS.car * carKmSaved
  );
}

export async function POST(req) {
  try {
    const { tripId } = await req.json();

    await mongoose.connect(process.env.MONGODB_URI);
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const itinerary = trip.itinerary.filter(item => item.coordinates?.lat && item.coordinates?.lng);

    let legs = [];
    for (let i = 0; i < itinerary.length - 1; i++) {
      const start = itinerary[i];
      const end = itinerary[i + 1];
      const distKm = haversine(start.coordinates, end.coordinates) / 1000;
      const distMiles = distKm / MILE_TO_KM;

      if (distMiles > 100) {
        legs.push({ type: "flight", start, end, distanceKm: distKm });
      } else {
        const roadKm = await getCarDistance(
          start.coordinates.lat,
          start.coordinates.lng,
          end.coordinates.lat,
          end.coordinates.lng
        );
        legs.push({ type: "car", start, end, distanceKm: roadKm });
      }
    }

    const flightPoints = [...new Set(legs.filter(l => l.type === "flight").flatMap(l => [l.start, l.end]))];
    const carPoints = [...new Set(legs.filter(l => l.type === "car").flatMap(l => [l.start, l.end]))];

    const optimizedFlights = optimizeOrder(flightPoints);
    const optimizedCars = optimizeOrder(carPoints);

    const beforeFlightDist = legs.filter(l => l.type === "flight").reduce((sum, l) => sum + l.distanceKm, 0);
    const beforeCarDist = legs.filter(l => l.type === "car").reduce((sum, l) => sum + l.distanceKm, 0);

    const afterFlightDist = optimizedFlights.reduce((sum, p, i) => {
      if (i === optimizedFlights.length - 1) return sum;
      return sum + haversine(p.coordinates, optimizedFlights[i + 1].coordinates) / 1000;
    }, 0);

    const afterCarDist = optimizedCars.reduce((sum, p, i) => {
      if (i === optimizedCars.length - 1) return sum;
      return sum + haversine(p.coordinates, optimizedCars[i + 1].coordinates) / 1000;
    }, 0);

    const flightKmSaved = beforeFlightDist - afterFlightDist;
    const carKmSaved = beforeCarDist - afterCarDist;

    const moneySaved = predictMoneySaved(flightKmSaved, carKmSaved);
    const distanceSaved = flightKmSaved + carKmSaved;

    // Merge optimized flights and cars into new itinerary order
    const newItinerary = [...optimizedFlights, ...optimizedCars];

    // Update trip with new itinerary
    trip.itinerary = newItinerary;
    await trip.save();

    return NextResponse.json({
      distanceSaved,
      moneySaved
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
