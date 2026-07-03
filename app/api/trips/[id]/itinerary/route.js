import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"
import User from "../../../../../models/User"
import { upsertCityFromDestination } from "../../../../../lib/cityGuide"

export async function GET(request, props) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const trip = await Trip.findById(params.id)

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 })
    }

    const isOwner = trip.owner.toString() === user._id.toString()
    const isCollaborator = trip.travelers.some((traveler) => traveler.user.toString() === user._id.toString())
    const isPublic = trip.privacy === "public"

    if (!isOwner && !isCollaborator && !isPublic) {
      return NextResponse.json({ success: false, error: "You don't have permission to view this itinerary" }, { status: 403 })
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

export async function POST(request, props) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

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

    const updateData = {
      itinerary: processedItinerary,
    }

    // Only touch trip-level destinations when the client actually sent new
    // ones - previously this always $set destinations to [] on every save
    // (including from the itinerary builder, which never sends this field),
    // silently wiping out the trip's destination list.
    let tripDestinations = []
    if (selectedDestinations && Array.isArray(selectedDestinations) && selectedDestinations.length > 0) {
      tripDestinations = selectedDestinations.map((dest) => ({
        name: dest.name || "",
        country: dest.formatted_address ? dest.formatted_address.split(", ").pop() : dest.country || "",
        coordinates: dest.coordinates || dest.geometry?.location || null,
        placeId: dest.place_id || "",
        activities: [],
        estimatedDays: 1,
        notes: "",
      }))
      updateData.destinations = tripDestinations
    }

    const existingTrip = await Trip.findById(params.id)

    if (!existingTrip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 })
    }

    const isOwner = existingTrip.owner.toString() === user._id.toString()
    const isCollaborator = existingTrip.travelers.some(
      (traveler) => traveler.user.toString() === user._id.toString() && traveler.role === "collaborator",
    )

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ success: false, error: "You don't have permission to edit this itinerary" }, { status: 403 })
    }

    const trip = await Trip.findByIdAndUpdate(
      params.id,
      {
        $set: updateData,
      },
      { new: true },
    )

    tripDestinations.forEach((dest) => upsertCityFromDestination(dest))

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
