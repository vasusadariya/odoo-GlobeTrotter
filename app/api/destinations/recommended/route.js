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

    // Mock recommended destinations based on user profile
    // In a real app, this would use ML/AI to recommend based on user preferences, past trips, etc.
    const recommendedDestinations = [
      {
        id: "paris_france",
        name: "Paris",
        country: "France",
        formatted_address: "Paris, France",
        geometry: {
          location: { lat: 48.8566, lng: 2.3522 },
        },
        rating: 4.5,
        reason: "Popular romantic destination",
      },
      {
        id: "tokyo_japan",
        name: "Tokyo",
        country: "Japan",
        formatted_address: "Tokyo, Japan",
        geometry: {
          location: { lat: 35.6762, lng: 139.6503 },
        },
        rating: 4.7,
        reason: "Cultural experience",
      },
      {
        id: "new_york_usa",
        name: "New York",
        country: "USA",
        formatted_address: "New York, NY, USA",
        geometry: {
          location: { lat: 40.7128, lng: -74.006 },
        },
        rating: 4.6,
        reason: "Urban adventure",
      },
      {
        id: "london_uk",
        name: "London",
        country: "UK",
        formatted_address: "London, UK",
        geometry: {
          location: { lat: 51.5074, lng: -0.1278 },
        },
        rating: 4.4,
        reason: "Historical sites",
      },
      {
        id: "bali_indonesia",
        name: "Bali",
        country: "Indonesia",
        formatted_address: "Bali, Indonesia",
        geometry: {
          location: { lat: -8.3405, lng: 115.092 },
        },
        rating: 4.8,
        reason: "Tropical paradise",
      },
      {
        id: "rome_italy",
        name: "Rome",
        country: "Italy",
        formatted_address: "Rome, Italy",
        geometry: {
          location: { lat: 41.9028, lng: 12.4964 },
        },
        rating: 4.6,
        reason: "Ancient history",
      },
    ]

    return NextResponse.json({ destinations: recommendedDestinations }, { status: 200 })
  } catch (error) {
    console.error("Recommended destinations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
