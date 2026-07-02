import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../lib/auth"
import connectDB from "../../../../lib/mongodb"
import User from "../../../../models/User"
import Trip from "../../../../models/Trip"
import City from "../../../../models/City"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

function toDestinationShape(city, reason) {
  return {
    id: city._id.toString(),
    name: city.name,
    country: city.country,
    formatted_address: `${city.name}, ${city.country}`,
    geometry: city.coordinates
      ? { location: { lat: city.coordinates.latitude, lng: city.coordinates.longitude } }
      : undefined,
    rating: city.costIndex ? Number((6 - city.costIndex / 2).toFixed(1)) : undefined,
    reason,
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const pastCountries = (await Trip.distinct("destinations.country", { owner: user._id })).filter(Boolean)
    const homeCountry = user.location?.country

    const notVisited = pastCountries.length > 0 ? { country: { $nin: pastCountries } } : {}

    const recommended = []
    const seenIds = new Set()

    // Prefer cities near the user's home region that they haven't already visited.
    if (homeCountry && !pastCountries.includes(homeCountry)) {
      const nearby = await City.find({ country: homeCountry, ...notVisited })
        .sort({ popularityRank: -1 })
        .limit(3)
        .lean()

      for (const city of nearby) {
        recommended.push(toDestinationShape(city, `Popular near ${homeCountry}`))
        seenIds.add(city._id.toString())
      }
    }

    if (recommended.length < 6) {
      const filler = await City.find(notVisited)
        .sort({ popularityRank: -1 })
        .limit(6)
        .lean()

      for (const city of filler) {
        if (recommended.length >= 6) break
        if (seenIds.has(city._id.toString())) continue
        recommended.push(toDestinationShape(city, "Trending with other travelers"))
        seenIds.add(city._id.toString())
      }
    }

    // Cold-start fallback: City guide has too few entries yet (fresh deployment) -
    // fall back to trip-aggregated destinations so the endpoint never returns empty.
    if (recommended.length === 0) {
      const topFromTrips = await Trip.getTopDestinations({ limit: 6 })
      for (const dest of topFromTrips) {
        recommended.push({
          id: `${dest.name}_${dest.country}`.toLowerCase().replace(/\s+/g, "_"),
          name: dest.name,
          country: dest.country,
          formatted_address: `${dest.name}, ${dest.country}`,
          geometry: dest.coordinates ? { location: dest.coordinates } : undefined,
          reason: "Popular with other travelers",
        })
      }
    }

    return NextResponse.json({ destinations: recommended }, { status: 200 })
  } catch (error) {
    console.error("Recommended destinations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
