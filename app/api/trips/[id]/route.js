import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../models/Trip"

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

    // Find the trip and populate owner details
    const trip = await Trip.findById(id).populate("owner", "name email").populate("travelers.user", "name email")

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user has permission to view this trip
    const isOwner = trip.owner && trip.owner._id ? trip.owner._id.toString() === session.user.id : false;
    const isCollaborator = trip.travelers.some((traveler) => 
      traveler.user && traveler.user._id && traveler.user._id.toString() === session.user.id
    );
    const isPublic = trip.privacy === "public"

    if (!isOwner && !isCollaborator && !isPublic) {
      return NextResponse.json({ error: "You don't have permission to view this trip" }, { status: 403 })
    }

    return NextResponse.json(
      {
        trip: {
          id: trip._id,
          name: trip.name,
          description: trip.description,
          startDate: trip.startDate,
          endDate: trip.endDate,
          destinations: trip.destinations,
          coverImage: trip.coverImage,
          owner: trip.owner,
          budgetLimit: trip.budgetLimit,
          currency: trip.currency,
          status: trip.status,
          privacy: trip.privacy,
          totalBudget: trip.totalBudget,
          travelers: trip.travelers,
          tags: trip.tags,
          isPublic: trip.isPublic,
          createdAt: trip.createdAt,
          updatedAt: trip.updatedAt,
          duration: trip.duration,
          estimatedCost: trip.estimatedCost,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Trip fetch error:", error)

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const data = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 })
    }

    await connectDB()

    // Find the trip
    const trip = await Trip.findById(id)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user has permission to edit this trip
    const isOwner = trip.owner && trip.owner.toString() === session.user.id
    const isCollaborator = trip.travelers.some(
      (traveler) =>
        traveler.user && traveler.user.toString() === session.user.id && 
        (traveler.role === "owner" || traveler.role === "collaborator"),
    )

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "You don't have permission to edit this trip" }, { status: 403 })
    }

    // Update the trip
    const updatedTrip = await Trip.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate("owner", "name email")

    return NextResponse.json(
      {
        message: "Trip updated successfully",
        trip: updatedTrip,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Trip update error:", error)

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

export async function DELETE(request, { params }) {
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
    const trip = await Trip.findById(id)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user is the owner
    const isOwner = trip.owner && trip.owner.toString() === session.user.id

    if (!isOwner) {
      return NextResponse.json({ error: "Only the trip owner can delete this trip" }, { status: 403 })
    }

    // Delete the trip
    await Trip.findByIdAndDelete(id)

    return NextResponse.json({ message: "Trip deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Trip deletion error:", error)

    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}