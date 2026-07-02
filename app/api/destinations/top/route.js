import { NextResponse } from "next/server"
import Trip from "@/models/Trip"
import connectDB from "@/lib/mongodb"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '10')
    const country = searchParams.get('country')
    const searchQuery = searchParams.get('search')?.trim()

    const topDestinations = await Trip.getTopDestinations({ limit, country, search: searchQuery });
    
    // Get Google Places API key
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY
    
    // Process destinations to add photos
    const destinationsWithPhotos = await Promise.all(
      topDestinations.map(async (destination) => {
        // If destination already has an image field, use that
        if (destination.image) {
          return {
            ...destination,
            photos: [{ url: destination.image }]
          }
        }
        
        // If we have a Google API key and placeId, try to get photos from Google
        if (GOOGLE_PLACES_API_KEY && destination.placeId) {
          try {
            // Fetch place details to get photos
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?place_id=${destination.placeId}&fields=photos&key=${GOOGLE_PLACES_API_KEY}`
            )
            
            if (response.ok) {
              const data = await response.json()
              
              if (data.result && data.result.photos && data.result.photos.length > 0) {
                const photoReference = data.result.photos[0].photo_reference
                return {
                  ...destination,
                  photos: [{
                    photo_reference: photoReference,
                    url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`,
                    width: 800,
                    height: 600
                  }]
                }
              }
            }
          } catch (error) {
            console.error("Error fetching place details:", error)
            // Continue with fallback on error
          }
        }
        
        // Fallback: Use a placeholder or Unsplash image
        return {
          ...destination,
          photos: [{
            url: `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(destination.name)}`
          }]
        }
      })
    )
    
    return NextResponse.json({ success: true, destinations: destinationsWithPhotos })
  } catch (error) {
    console.error("Error fetching top destinations:", error)
    
    // Return mock data as fallback
    const mockDestinations = [
      {
        name: "Paris",
        country: "France",
        count: 12,
        placeId: "ChIJ3S-JXmau9YgR0E_IBXNwpIE",
        photos: [{ url: "/placeholder.svg?height=300&width=400&text=Paris" }]
      },
      {
        name: "Tokyo",
        country: "Japan",
        count: 10,
        placeId: "ChIJ51cu8IcbXWARiRtXIothAS4",
        photos: [{ url: "/placeholder.svg?height=300&width=400&text=Tokyo" }]
      },
      {
        name: "New York",
        country: "USA",
        count: 8,
        placeId: "ChIJOwg_06VPwokRYv534QaPC8g",
        photos: [{ url: "/placeholder.svg?height=300&width=400&text=New+York" }]
      },
      {
        name: "London",
        country: "UK",
        count: 7,
        placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI",
        photos: [{ url: "/placeholder.svg?height=300&width=400&text=London" }]
      },
      {
        name: "Rome",
        country: "Italy",
        count: 6,
        placeId: "ChIJu46S-ZZhLxMROG5lkwZ3D7k",
        photos: [{ url: "/placeholder.svg?height=300&width=400&text=Rome" }]
      },
      {
        name: "Bali",
        country: "Indonesia",
        count: 5,
        placeId: "ChIJoQ8Q6NNB0S0RkOYkS7MaaGc",
        photos: [{ url: "/placeholder.svg?height=300&width=400&text=Bali" }]
      }
    ];
    
    // Filter mock data if search query is provided
    if (searchParams.get('search')?.trim()) {
      const searchRegex = new RegExp(searchParams.get('search').trim(), 'i');
      const filteredMocks = mockDestinations.filter(
        dest => searchRegex.test(dest.name) || searchRegex.test(dest.country)
      );
      return NextResponse.json(
        { success: true, destinations: filteredMocks },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { success: true, destinations: mockDestinations },
      { status: 200 }
    )
  }
}