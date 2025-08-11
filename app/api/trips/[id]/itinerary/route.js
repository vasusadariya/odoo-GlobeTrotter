import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 })
    }

    await connectDB()

    // Find the trip
    const trip = await Trip.findById(id).populate("owner", "name email")

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user has permission to view this trip
    const isOwner = trip.owner._id.toString() === session.user.id
    const isCollaborator = trip.travelers.some((traveler) => traveler.user.toString() === session.user.id)
    const isPublic = trip.privacy === "public"

    if (!isOwner && !isCollaborator && !isPublic) {
      return NextResponse.json({ error: "You don't have permission to view this trip" }, { status: 403 })
    }

    return NextResponse.json(
      {
        trip: {
          id: trip._id,
          name: trip.name,
          startDate: trip.startDate,
          endDate: trip.endDate,
          destinations: trip.destinations,
          currency: trip.currency,
          budgetLimit: trip.budgetLimit,
        },
        itinerary: trip.itinerary || [],
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Itinerary fetch error:", error)

    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { sections } = await request.json()

    console.log("Saving itinerary for trip:", id)
    console.log("Sections received:", sections)

    if (!id) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 })
    }

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: "Invalid itinerary sections" }, { status: 400 })
    }

    if (sections.length === 0) {
      return NextResponse.json({ error: "At least one itinerary section is required" }, { status: 400 })
    }

    await connectDB()

    // Find the trip
    const trip = await Trip.findById(id)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user has permission to edit this trip
    const isOwner = trip.owner.toString() === session.user.id
    const isCollaborator = trip.travelers.some(
      (traveler) =>
        traveler.user.toString() === session.user.id && (traveler.role === "owner" || traveler.role === "collaborator"),
    )

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "You don't have permission to edit this trip" }, { status: 403 })
    }

    // Validate sections
    for (const section of sections) {
      if (!section.title || !section.startDate || !section.endDate) {
        return NextResponse.json(
          {
            error: "Each section must have a title, start date, and end date",
          },
          { status: 400 },
        )
      }
    }

    // Update the trip with itinerary
    const updatedTrip = await Trip.findByIdAndUpdate(
      id,
      {
        itinerary: sections,
        status: "planned", // Update status when itinerary is created
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
    ).populate("owner", "name email")

    console.log("Trip updated successfully:", updatedTrip._id)

    return NextResponse.json(
      {
        message: "Itinerary saved successfully",
        trip: updatedTrip,
        itinerary: sections,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Itinerary save error:", error)

    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return NextResponse.json({ error: validationErrors.join(", ") }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
    