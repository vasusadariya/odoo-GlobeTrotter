import { NextResponse } from "next/server"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    // Mock data - replace with real Google Places API or other service
    const mockDestinations = [
      {
        id: "paris_france",
        name: "Paris",
        country: "France",
        fullName: "Paris, France",
        coordinates: { lat: 48.8566, lng: 2.3522 },
        description: "The City of Light, known for its art, fashion, and culture",
        popularActivities: [
          { name: "Eiffel Tower", category: "sightseeing" },
          { name: "Louvre Museum", category: "cultural" },
          { name: "Seine River Cruise", category: "entertainment" },
        ],
      },
      {
        id: "tokyo_japan",
        name: "Tokyo",
        country: "Japan",
        fullName: "Tokyo, Japan",
        coordinates: { lat: 35.6762, lng: 139.6503 },
        description: "A bustling metropolis blending traditional and modern culture",
        popularActivities: [
          { name: "Tokyo Skytree", category: "sightseeing" },
          { name: "Sushi Making Class", category: "food" },
          { name: "Shibuya Crossing", category: "cultural" },
        ],
      },
      {
        id: "new_york_usa",
        name: "New York",
        country: "USA",
        fullName: "New York, USA",
        coordinates: { lat: 40.7128, lng: -74.006 },
        description: "The Big Apple, a global hub for finance, arts, and culture",
        popularActivities: [
          { name: "Statue of Liberty", category: "sightseeing" },
          { name: "Broadway Show", category: "entertainment" },
          { name: "Central Park", category: "relaxation" },
        ],
      },
    ]

    // Filter based on query
    const filteredDestinations = mockDestinations.filter(
      (dest) =>
        dest.name.toLowerCase().includes(query.toLowerCase()) ||
        dest.country.toLowerCase().includes(query.toLowerCase()) ||
        dest.fullName.toLowerCase().includes(query.toLowerCase()),
    )

    return NextResponse.json({ destinations: filteredDestinations }, { status: 200 })
  } catch (error) {
    console.error("Destination search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
