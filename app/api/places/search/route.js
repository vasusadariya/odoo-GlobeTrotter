import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../lib/auth"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    // Added authentication check for API security
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ places: [] }, { status: 200 })
    }

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

    if (!GOOGLE_PLACES_API_KEY) {
      console.error("Google Places API key not found")
      // Return mock data if API key is not available
      return NextResponse.json({ places: getMockPlaces(query) }, { status: 200 })
    }

    // Google Places API - Text Search
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query,
      )}&type=locality|country|tourist_attraction&key=${GOOGLE_PLACES_API_KEY}`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch from Google Places API")
    }

    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    const places = data.results.slice(0, 10).map((place) => ({
      id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      types: place.types,
      geometry: place.geometry,
      photos: place.photos
        ? place.photos.slice(0, 1).map((photo) => ({
            photo_reference: photo.photo_reference,
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
            width: 400,
            height: 300,
          }))
        : [],
      rating: place.rating,
      price_level: place.price_level,
    }))

    return NextResponse.json({ places }, { status: 200 })
  } catch (error) {
    console.error("Places search error:", error)

    // Return mock data as fallback
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    return NextResponse.json({ places: getMockPlaces(query) }, { status: 200 })
  }
}

// Mock data for fallback
function getMockPlaces(query) {
  const mockPlaces = [
    {
      id: "paris_france",
      name: "Paris",
      formatted_address: "Paris, France",
      types: ["locality", "political"],
      geometry: {
        location: { lat: 48.8566, lng: 2.3522 },
      },
      photos: [
        {
          photo_reference: "mock_paris",
          url: "/placeholder.svg?height=300&width=400&text=Paris",
          width: 400,
          height: 300,
        },
      ],
      rating: 4.5,
    },
    {
      id: "tokyo_japan",
      name: "Tokyo",
      formatted_address: "Tokyo, Japan",
      types: ["locality", "political"],
      geometry: {
        location: { lat: 35.6762, lng: 139.6503 },
      },
      photos: [
        {
          photo_reference: "mock_tokyo",
          url: "/placeholder.svg?height=300&width=400&text=Tokyo",
          width: 400,
          height: 300,
        },
      ],
      rating: 4.7,
    },
    {
      id: "new_york_usa",
      name: "New York",
      formatted_address: "New York, NY, USA",
      types: ["locality", "political"],
      geometry: {
        location: { lat: 40.7128, lng: -74.006 },
      },
      photos: [
        {
          photo_reference: "mock_nyc",
          url: "/placeholder.svg?height=300&width=400&text=New+York",
          width: 400,
          height: 300,
        },
      ],
      rating: 4.6,
    },
    {
      id: "london_uk",
      name: "London",
      formatted_address: "London, UK",
      types: ["locality", "political"],
      geometry: {
        location: { lat: 51.5074, lng: -0.1278 },
      },
      photos: [
        {
          photo_reference: "mock_london",
          url: "/placeholder.svg?height=300&width=400&text=London",
          width: 400,
          height: 300,
        },
      ],
      rating: 4.4,
    },
  ]

  return mockPlaces.filter(
    (place) =>
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.formatted_address.toLowerCase().includes(query.toLowerCase()),
  )
}
