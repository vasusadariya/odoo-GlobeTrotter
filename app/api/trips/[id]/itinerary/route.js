import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"
import User from "../../../../../models/User"

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const trip = await Trip.findOne({
      _id: params.id,
      owner: session.user.id,
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
    console.log("Received request body:", JSON.stringify(body, null, 2))

    const { sections, selectedDestinations } = body

    if (!sections || !Array.isArray(sections)) {
      console.error("Invalid sections data:", sections)
      return NextResponse.json({ success: false, error: "Invalid sections data" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const processedItinerary = sections.map((section) => {
      const itineraryItem = {
        id: section.id,
        title: section.title,
        description: section.description || "",
        type: section.category?.toLowerCase() || "activity",
        startDate: new Date(section.startDate),
        endDate: new Date(section.endDate),
        budget: section.budget || 0,
        location: section.placeDetails?.formatted_address || section.location || "",
        coordinates: section.coordinates
          ? {
              lat: section.coordinates.lat,
              lng: section.coordinates.lng,
            }
          : null,
        notes: section.notes || "",
        destinations: [], // Initialize destinations array
      }

      if (section.placeDetails) {
        const destination = {
          name: section.placeDetails.name || section.location || "",
          country: section.placeDetails.formatted_address
            ? section.placeDetails.formatted_address.split(", ").pop()
            : "",
          coordinates: section.coordinates || section.placeDetails.geometry?.location || null,
          placeId: section.placeDetails.place_id || "",
          activities: [], // Initialize empty activities array
          estimatedDays: 1,
          notes: section.notes || "",
        }
        itineraryItem.destinations.push(destination)
      }

      return itineraryItem
    })

    let tripDestinations = []
    if (selectedDestinations && Array.isArray(selectedDestinations)) {
      tripDestinations = selectedDestinations.map((dest) => ({
        name: dest.name || "",
        country: dest.formatted_address ? dest.formatted_address.split(", ").pop() : dest.country || "",
        coordinates: dest.coordinates || dest.geometry?.location || null,
        placeId: dest.place_id || "",
        activities: [],
        estimatedDays: 1,
        notes: "",
      }))
    }

    const updateData = {
      itinerary: processedItinerary,
      destinations: tripDestinations, // Update trip-level destinations
    }

    const trip = await Trip.findOneAndUpdate(
      {
        _id: params.id,
        owner: user._id,
      },
      {
        $set: updateData,
      },
      { new: true },
    )

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Itinerary saved successfully with destinations",
      itinerary: trip.itinerary,
      destinations: trip.destinations || [],
    })
  } catch (error) {
    console.error("Error saving itinerary:", error)
    return NextResponse.json({ success: false, error: "Failed to save itinerary" }, { status: 500 })
  }
}
