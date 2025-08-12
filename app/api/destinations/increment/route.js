import { NextResponse } from "next/server"
import Trip from "@/models/Trip"
import connectDB from "@/lib/mongodb"

export async function POST(request) {
  try {
    await connectDB();
    const { tripId, destinationName, country } = await request.json()
    
    if (!tripId || !destinationName || !country) {
      return NextResponse.json(
        { error: "Trip ID, destination name, and country are required" },
        { status: 400 }
      )
    }

    const trip = await Trip.findById(tripId)
    
    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    await trip.incrementDestinationCount(destinationName, country)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error incrementing destination count:", error)
    return NextResponse.json(
      { error: "Failed to increment destination count" },
      { status: 500 }
    )
  }
}