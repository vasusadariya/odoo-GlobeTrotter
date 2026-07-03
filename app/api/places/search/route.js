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
      return NextResponse.json({ places: [], unavailable: true }, { status: 200 })
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
    return NextResponse.json({ places: [], unavailable: true }, { status: 200 })
  }
}
