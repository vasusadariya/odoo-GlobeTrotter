import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"
import User from "../../../../../models/User"
import { computeWeatherConflictsForTrip } from "../../../../../lib/weatherConflicts"
import { computeExpenseSummary } from "../../../../../lib/expenseSummary"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function GET(request, props) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    const isPublic = trip.privacy === "public"

    if (!isOwner && !isTraveler && !isPublic) {
      return NextResponse.json({ error: "You don't have permission to view this trip" }, { status: 403 })
    }

    const now = new Date()
    const daysUntilDeparture = Math.ceil((new Date(trip.startDate) - now) / (1000 * 60 * 60 * 24))

    const [weatherResult, expenseSummary] = await Promise.all([
      computeWeatherConflictsForTrip(trip),
      computeExpenseSummary(trip._id),
    ])

    const packingList = Array.from(
      new Set(weatherResult.days.flatMap((day) => day.packingList || [])),
    )
    const unresolvedConflicts = weatherResult.days.filter((day) => (day.conflicts || []).length > 0).length

    return NextResponse.json({
      tripId: trip._id,
      daysUntilDeparture,
      packingList,
      unresolvedConflicts,
      budgetStatus: {
        limit: trip.budgetLimit || 0,
        actual: expenseSummary.totalSpent,
        currency: trip.currency || "USD",
      },
    })
  } catch (error) {
    console.error("Trip readiness error:", error)

    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
