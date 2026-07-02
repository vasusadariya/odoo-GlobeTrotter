import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"
import User from "../../../../../models/User"
import haversine from "haversine-distance"
import { getCarDistance, estimateCO2, MILE_TO_KM } from "../../../../../lib/routeOptimize"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

// Non-mutating route preview, meant to be called *while building* an
// itinerary (before anything is saved) - takes an in-progress waypoints
// array in the body rather than reading trip.itinerary from the DB.
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { waypoints } = await request.json()

    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      return NextResponse.json({ legs: [], totalFlightKm: 0, totalCarKm: 0, estimatedCO2Kg: 0, estimatedSavings: 0 })
    }

    await connectDB()

    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const trip = await Trip.findById(params.id)
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    const isOwner = trip.owner.toString() === user._id.toString()
    const isTraveler = trip.travelers.some((t) => t.user.toString() === user._id.toString())
    if (!isOwner && !isTraveler) {
      return NextResponse.json({ error: "You don't have access to this trip" }, { status: 403 })
    }

    const points = waypoints.filter((p) => p?.coordinates?.lat != null && p?.coordinates?.lng != null)

    const legs = []
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i]
      const end = points[i + 1]
      const distKm = haversine(start.coordinates, end.coordinates) / 1000
      const distMiles = distKm / MILE_TO_KM

      if (distMiles > 100) {
        legs.push({ type: "flight", from: start.name, to: end.name, distanceKm: distKm })
      } else {
        const roadKm = await getCarDistance(
          start.coordinates.lat,
          start.coordinates.lng,
          end.coordinates.lat,
          end.coordinates.lng,
        )
        legs.push({ type: "car", from: start.name, to: end.name, distanceKm: roadKm })
      }
    }

    const totalFlightKm = legs.filter((l) => l.type === "flight").reduce((sum, l) => sum + l.distanceKm, 0)
    const totalCarKm = legs.filter((l) => l.type === "car").reduce((sum, l) => sum + l.distanceKm, 0)
    const estimatedCO2Kg = estimateCO2({ flightKm: totalFlightKm, carKm: totalCarKm })

    return NextResponse.json({
      legs,
      totalFlightKm,
      totalCarKm,
      estimatedCO2Kg,
      flightLegCount: legs.filter((l) => l.type === "flight").length,
      carLegCount: legs.filter((l) => l.type === "car").length,
    })
  } catch (error) {
    console.error("Route preview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
