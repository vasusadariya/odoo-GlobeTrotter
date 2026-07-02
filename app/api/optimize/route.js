import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import connectDB from "../../../lib/mongodb";
import Trip from "../../../models/Trip";
import User from "../../../models/User";
import haversine from "haversine-distance";
import { getCarDistance, optimizeOrder, predictMoneySaved, estimateCO2, MILE_TO_KM } from "../../../lib/routeOptimize";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId, confirm } = await req.json();

    await connectDB();

    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const isOwner = trip.owner.toString() === user._id.toString();
    const isCollaborator = trip.travelers.some(
      (t) => t.user.toString() === user._id.toString() && t.role === "collaborator",
    );
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "You don't have permission to optimize this trip" }, { status: 403 });
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
    const co2Saved = estimateCO2({ flightKm: flightKmSaved, carKm: carKmSaved });

    // Merge optimized flights and cars into new itinerary order
    const optimizedItinerary = [...optimizedFlights, ...optimizedCars];

    // Only persist when the caller explicitly confirms - opening the
    // optimize modal should preview, not silently mutate the trip.
    if (confirm) {
      trip.itinerary = optimizedItinerary;
      await trip.save();
    }

    return NextResponse.json({
      distanceSaved,
      moneySaved,
      co2Saved,
      optimizedItinerary,
      applied: !!confirm,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
