import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../lib/auth"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("place_id")

    if (!placeId) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 })
    }

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

    if (!GOOGLE_PLACES_API_KEY) {
      console.error("Google Places API key not found")
      // Return mock data if API key is not available
      return NextResponse.json({ place: getMockPlaceDetails(placeId) }, { status: 200 })
    }

    // Google Places API - Place Details
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,photos,rating,price_level,opening_hours,formatted_phone_number,website,reviews,types&key=${GOOGLE_PLACES_API_KEY}`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch from Google Places API")
    }

    const data = await response.json()

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    const place = data.result
    const placeDetails = {
      id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      types: place.types,
      geometry: place.geometry,
      photos: place.photos
        ? place.photos.slice(0, 5).map((photo) => ({
            photo_reference: photo.photo_reference,
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
            width: 800,
            height: 600,
          }))
        : [],
      rating: place.rating,
      price_level: place.price_level,
      opening_hours: place.opening_hours,
      formatted_phone_number: place.formatted_phone_number,
      website: place.website,
      reviews: place.reviews ? place.reviews.slice(0, 5) : [],
    }

    return NextResponse.json({ place: placeDetails }, { status: 200 })
  } catch (error) {
    console.error("Place details error:", error)

    // Return mock data as fallback
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get("place_id")
    return NextResponse.json({ place: getMockPlaceDetails(placeId) }, { status: 200 })
  }
}

// Mock data for fallback
function getMockPlaceDetails(placeId) {
  const mockDetails = {
    paris_france: {
      id: "paris_france",
      name: "Paris",
      formatted_address: "Paris, France",
      types: ["locality", "political"],
      geometry: {
        location: { lat: 48.8566, lng: 2.3522 },
      },
      photos: [
        {
          photo_reference: "mock_paris_1",
          url: "/placeholder.svg?height=600&width=800&text=Paris+Eiffel+Tower",
          width: 800,
          height: 600,
        },
      ],
      rating: 4.5,
      price_level: 3,
      opening_hours: {
        open_now: true,
        weekday_text: ["Monday: Open 24 hours", "Tuesday: Open 24 hours"],
      },
      formatted_phone_number: "+33 1 42 97 48 16",
      website: "https://www.paris.fr",
      reviews: [
        {
          author_name: "John Doe",
          rating: 5,
          text: "Beautiful city with amazing architecture!",
          time: 1640995200,
        },
      ],
    },
  }

  return (
    mockDetails[placeId] || {
      id: placeId,
      name: "Unknown Place",
      formatted_address: "Unknown Location",
      types: ["establishment"],
      geometry: { location: { lat: 0, lng: 0 } },
      photos: [],
      rating: 0,
    }
  )
}
