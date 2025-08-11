import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../lib/auth"
import connectDB from "../../../lib/mongodb"
import Trip from "../../../models/Trip"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.startDate || !data.endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    if (!data.destinations || data.destinations.length === 0) {
      return NextResponse.json({ error: "At least one destination is required" }, { status: 400 })
    }

    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (endDate < startDate) {
      return NextResponse.json({ error: "End date cannot be before start date" }, { status: 400 })
    }

    await connectDB()

    // Prepare trip data
    const tripData = {
      name: data.name || `Trip to ${data.destinations[0]?.name}`,
      description: data.description || "",
      startDate,
      endDate,
      destinations: data.destinations.map((dest) => ({
        name: dest.name,
        country: dest.country,
        coordinates: dest.coordinates || { lat: null, lng: null },
        placeId: dest.placeId,
        activities: dest.activities || [],
      })),
      owner: session.user.id,
      privacy: data.privacy || "private",
      status: "draft",
      currency: data.currency || "USD",
      budgetLimit: data.budgetLimit || 0,
      totalBudget: data.totalBudget || {
        transport: 0,
        accommodation: 0,
        activities: 0,
        food: 0,
        other: 0,
      },
      travelers: [
        {
          user: session.user.id,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
      tags: data.tags || [],
      isPublic: data.privacy === "public",
    }

    const trip = await Trip.create(tripData)

    // Populate the trip with user details
    await trip.populate("owner", "name email")

    return NextResponse.json(
      {
        message: "Trip created successfully",
        trip: {
          id: trip._id,
          name: trip.name,
          description: trip.description,
          startDate: trip.startDate,
          endDate: trip.endDate,
          destinations: trip.destinations,
          privacy: trip.privacy,
          status: trip.status,
          duration: trip.duration,
          estimatedCost: trip.estimatedCost,
          owner: trip.owner,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Trip creation error:", error)

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return NextResponse.json({ error: validationErrors.join(", ") }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 10
    const status = searchParams.get("status")
    const privacy = searchParams.get("privacy")

    await connectDB()

    // Build query
    const query = { owner: session.user.id }
    if (status) query.status = status
    if (privacy) query.privacy = privacy

    const trips = await Trip.find(query)
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-__v")

    // Transform the trips to include both id and _id for compatibility
    const transformedTrips = trips.map((trip) => ({
      ...trip.toObject(),
      id: trip._id.toString(),
      _id: trip._id.toString(),
    }))

    const total = await Trip.countDocuments(query)

    return NextResponse.json(
      {
        trips: transformedTrips,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Trips fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
