    import { NextResponse } from "next/server"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")
    const country = searchParams.get("country")

    if (!location) {
      return NextResponse.json({ activities: [] }, { status: 200 })
    }

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

    if (!GOOGLE_PLACES_API_KEY) {
      console.log("Google Places API key not found, returning mock data")
      return NextResponse.json({ activities: getMockActivities(location, country) }, { status: 200 })
    }

    try {
      // Search for tourist attractions and activities in the location
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=tourist+attractions+activities+${encodeURIComponent(
          location,
        )}&type=tourist_attraction|amusement_park|museum|park&key=${GOOGLE_PLACES_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch from Google Places API")
      }

      const data = await response.json()

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Places API error: ${data.status}`)
      }

      const activities = data.results.slice(0, 10).map((place) => ({
        id: place.place_id,
        name: place.name,
        description: getActivityDescription(place.name, place.types),
        location: place.formatted_address,
        coordinates: place.geometry?.location,
        rating: place.rating,
        estimatedCost: getEstimatedCost(place.types, place.price_level),
        duration: getEstimatedDuration(place.types),
        category: getCategoryFromTypes(place.types),
        photos: place.photos
          ? place.photos.slice(0, 1).map((photo) => ({
              url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
            }))
          : [],
      }))

      return NextResponse.json({ activities }, { status: 200 })
    } catch (apiError) {
      console.error("Google Places API error:", apiError)
      // Fallback to mock data
      return NextResponse.json({ activities: getMockActivities(location, country) }, { status: 200 })
    }
  } catch (error) {
    console.error("Activities search error:", error)
    return NextResponse.json({ activities: [] }, { status: 500 })
  }
}

function getActivityDescription(name, types) {
  if (types.includes("museum")) {
    return `Explore the fascinating exhibits and collections at ${name}`
  }
  if (types.includes("park")) {
    return `Enjoy nature and outdoor activities at ${name}`
  }
  if (types.includes("tourist_attraction")) {
    return `Visit the popular attraction ${name} and discover its unique features`
  }
  if (types.includes("amusement_park")) {
    return `Have fun with exciting rides and entertainment at ${name}`
  }
  return `Experience ${name} and its unique offerings`
}

function getEstimatedCost(types, priceLevel) {
  if (types.includes("park") && !types.includes("amusement_park")) {
    return 0 // Most parks are free
  }

  if (priceLevel) {
    switch (priceLevel) {
      case 1:
        return 10
      case 2:
        return 25
      case 3:
        return 50
      case 4:
        return 100
      default:
        return 20
    }
  }

  if (types.includes("museum")) return 15
  if (types.includes("amusement_park")) return 60
  if (types.includes("tourist_attraction")) return 20

  return 15
}

function getEstimatedDuration(types) {
  if (types.includes("museum")) return "2-3 hours"
  if (types.includes("amusement_park")) return "Full day"
  if (types.includes("park")) return "1-2 hours"
  if (types.includes("tourist_attraction")) return "1-2 hours"
  return "1-2 hours"
}

function getCategoryFromTypes(types) {
  if (types.includes("museum")) return "culture"
  if (types.includes("amusement_park")) return "entertainment"
  if (types.includes("park")) return "nature"
  if (types.includes("tourist_attraction")) return "sightseeing"
  return "other"
}

// Mock data for fallback
function getMockActivities(location, country) {
  const locationLower = location.toLowerCase()

  // Location-specific activities
  if (locationLower.includes("paris")) {
    return [
      {
        id: "eiffel-tower",
        name: "Eiffel Tower",
        description: "Visit the iconic iron lattice tower and enjoy panoramic views of Paris",
        location: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
        estimatedCost: 25,
        duration: "2-3 hours",
        category: "sightseeing",
        rating: 4.6,
      },
      {
        id: "louvre-museum",
        name: "Louvre Museum",
        description: "Explore the world's largest art museum and see the Mona Lisa",
        location: "Rue de Rivoli, 75001 Paris, France",
        estimatedCost: 17,
        duration: "3-4 hours",
        category: "culture",
        rating: 4.7,
      },
      {
        id: "seine-cruise",
        name: "Seine River Cruise",
        description: "Enjoy a scenic boat ride along the Seine River",
        location: "Port de la Bourdonnais, 75007 Paris, France",
        estimatedCost: 15,
        duration: "1 hour",
        category: "sightseeing",
        rating: 4.4,
      },
    ]
  }

  if (locationLower.includes("tokyo")) {
    return [
      {
        id: "senso-ji",
        name: "Senso-ji Temple",
        description: "Visit Tokyo's oldest temple in the historic Asakusa district",
        location: "2 Chome-3-1 Asakusa, Taito City, Tokyo, Japan",
        estimatedCost: 0,
        duration: "1-2 hours",
        category: "culture",
        rating: 4.5,
      },
      {
        id: "tokyo-skytree",
        name: "Tokyo Skytree",
        description: "Experience breathtaking views from Japan's tallest structure",
        location: "1 Chome-1-2 Oshiage, Sumida City, Tokyo, Japan",
        estimatedCost: 30,
        duration: "2-3 hours",
        category: "sightseeing",
        rating: 4.3,
      },
      {
        id: "tsukiji-market",
        name: "Tsukiji Outer Market",
        description: "Explore the famous fish market and try fresh sushi",
        location: "Tsukiji, Chuo City, Tokyo, Japan",
        estimatedCost: 20,
        duration: "2-3 hours",
        category: "food",
        rating: 4.4,
      },
    ]
  }

  if (locationLower.includes("london")) {
    return [
      {
        id: "tower-bridge",
        name: "Tower Bridge",
        description: "Walk across the iconic Victorian bridge and visit the exhibition",
        location: "Tower Bridge Rd, London SE1 2UP, UK",
        estimatedCost: 12,
        duration: "1-2 hours",
        category: "sightseeing",
        rating: 4.5,
      },
      {
        id: "british-museum",
        name: "British Museum",
        description: "Discover world history and culture in this renowned museum",
        location: "Great Russell St, Bloomsbury, London WC1B 3DG, UK",
        estimatedCost: 0,
        duration: "3-4 hours",
        category: "culture",
        rating: 4.7,
      },
      {
        id: "hyde-park",
        name: "Hyde Park",
        description: "Relax in one of London's largest and most famous parks",
        location: "London W2 2UH, UK",
        estimatedCost: 0,
        duration: "1-2 hours",
        category: "nature",
        rating: 4.4,
      },
    ]
  }

  // Generic activities for other locations
  return [
    {
      id: "city-walking-tour",
      name: `${location} Walking Tour`,
      description: `Explore the highlights of ${location} with a guided walking tour`,
      location: `${location}${country ? `, ${country}` : ""}`,
      estimatedCost: 25,
      duration: "2-3 hours",
      category: "sightseeing",
      rating: 4.3,
    },
    {
      id: "local-museum",
      name: `${location} Museum`,
      description: `Learn about the history and culture of ${location}`,
      location: `${location}${country ? `, ${country}` : ""}`,
      estimatedCost: 15,
      duration: "2-3 hours",
      category: "culture",
      rating: 4.2,
    },
    {
      id: "local-market",
      name: `${location} Local Market`,
      description: `Experience local life and try traditional foods at the market`,
      location: `${location}${country ? `, ${country}` : ""}`,
      estimatedCost: 10,
      duration: "1-2 hours",
      category: "food",
      rating: 4.4,
    },
    {
      id: "city-park",
      name: `${location} City Park`,
      description: `Relax and enjoy nature in the heart of ${location}`,
      location: `${location}${country ? `, ${country}` : ""}`,
      estimatedCost: 0,
      duration: "1-2 hours",
      category: "nature",
      rating: 4.1,
    },
  ]
}
