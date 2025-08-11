import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const trip = await Trip.findOne({
      _id: params.id,
      userId: session.user.id,
    })

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      trip: {
        id: trip._id,
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        destinations: trip.destinations,
        currency: trip.currency || "USD",
      },
      itinerary: trip.itinerary || [],
    })
  } catch (error) {
    console.error("Error fetching itinerary:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch itinerary" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { itinerary } = body

    await connectDB()

    const trip = await Trip.findOneAndUpdate(
      {
        _id: params.id,
        userId: session.user.id,
      },
      {
        $set: { itinerary },
      },
      { new: true },
    )

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Itinerary saved successfully",
      itinerary: trip.itinerary,
    })
  } catch (error) {
    console.error("Error saving itinerary:", error)
    return NextResponse.json({ success: false, error: "Failed to save itinerary" }, { status: 500 })
  }
}
