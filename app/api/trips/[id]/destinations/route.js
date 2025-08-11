import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { name, country, coordinates, placeId } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 })
    }

    if (!name || !country) {
      return NextResponse.json({ error: "Name and country are required" }, { status: 400 })
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

    // Check if destination already exists
    const existingDestination = trip.destinations.find((dest) => dest.placeId === placeId)
    if (existingDestination) {
      return NextResponse.json({ error: "Destination already added to trip" }, { status: 400 })
    }

    // Add new destination
    const newDestination = {
      name,
      country,
      coordinates,
      placeId,
      activities: [],
    }

    trip.destinations.push(newDestination)
    await trip.save()

    return NextResponse.json(
      {
        message: "Destination added successfully",
        destination: newDestination,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Add destination error:", error)

    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    await connectDB();

    const trip = await Trip.findById(id).select("destinations.coordinates destinations.name destinations.country");

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({
      coordinates: trip.destinations.map(dest => ({
        name: dest.name,
        country: dest.country,
        coordinates: dest.coordinates,
      })),
    });
  } catch (error) {
    console.error("Get coordinates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
