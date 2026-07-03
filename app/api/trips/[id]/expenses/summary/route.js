import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../../lib/auth"
import connectDB from "../../../../../../lib/mongodb"
import Trip from "../../../../../../models/Trip"
import User from "../../../../../../models/User"
import { computeExpenseSummary } from "../../../../../../lib/expenseSummary"

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

    if (!isOwner && !isTraveler) {
      return NextResponse.json({ error: "You don't have access to this trip" }, { status: 403 })
    }

    const summary = await computeExpenseSummary(trip._id)

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Expense summary error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
