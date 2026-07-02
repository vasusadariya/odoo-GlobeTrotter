import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../lib/auth"
import { getPlaceDetails } from "../../../../lib/places"

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

    const place = await getPlaceDetails(placeId)

    return NextResponse.json({ place }, { status: 200 })
  } catch (error) {
    console.error("Place details error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
