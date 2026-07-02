import { NextResponse } from "next/server"
import connectDB from "../../../lib/mongodb"
import City from "../../../models/City"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

// Public destination-guide browse endpoint, backed by the curated City
// collection (populated on-demand as real trip destinations are added -
// see lib/cityGuide.js). No auth required, this is meant for browsing.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit")) || 20, 50)
    const country = searchParams.get("country")
    const region = searchParams.get("region")
    const tag = searchParams.get("tag")
    const costMax = searchParams.get("costMax")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") || "popular"

    await connectDB()

    const query = {}
    if (country) query.country = country
    if (region) query.region = { $in: region.split(",").map((r) => r.trim()) }
    if (tag) query.tags = tag
    if (costMax) query.costIndex = { $lte: Number.parseInt(costMax) }
    if (search && search.length >= 2) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ]
    }

    const sortOptions =
      sort === "alphabetical"
        ? { name: 1 }
        : sort === "recent"
          ? { createdAt: -1 }
          : { popularityRank: -1 }

    const cities = await City.find(query).sort(sortOptions).limit(limit).lean()

    const destinations = cities.map((city) => ({
      id: city._id.toString(),
      name: city.name,
      country: city.country,
      region: city.region,
      description: city.description,
      tags: city.tags || [],
      costIndex: city.costIndex,
      count: city.popularityRank || 0,
      coordinates: city.coordinates
        ? { lat: city.coordinates.latitude, lng: city.coordinates.longitude }
        : null,
      image: city.images?.[0]?.url || null,
    }))

    return NextResponse.json({ destinations }, { status: 200 })
  } catch (error) {
    console.error("Cities fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
