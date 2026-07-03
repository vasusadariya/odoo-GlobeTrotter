import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"
import User from "../../../../../models/User"
import ItineraryComment from "../../../../../models/ItineraryComment"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

async function resolveTraveler(request, tripId) {
  const session = await getServerSession(authOptions)
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  await connectDB()

  const user = await User.findOne({
    $or: [{ googleId: session.user.id }, { email: session.user.email }],
  })
  if (!user) return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) }

  const trip = await Trip.findById(tripId)
  if (!trip) return { error: NextResponse.json({ error: "Trip not found" }, { status: 404 }) }

  const isOwner = trip.owner.toString() === user._id.toString()
  const isTraveler = trip.travelers.some((t) => t.user.toString() === user._id.toString())

  if (!isOwner && !isTraveler) {
    return { error: NextResponse.json({ error: "You don't have access to this trip" }, { status: 403 }) }
  }

  return { user, trip }
}

export async function GET(request, props) {
  const params = await props.params;
  const { error, trip } = await resolveTraveler(request, params.id)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const itineraryItemId = searchParams.get("itineraryItemId")

  const query = { trip: trip._id }
  if (itineraryItemId) query.itineraryItemId = itineraryItemId

  const comments = await ItineraryComment.find(query)
    .populate("author", "name image")
    .sort({ createdAt: 1 })
    .lean()

  return NextResponse.json({ comments })
}

export async function POST(request, props) {
  const params = await props.params;
  const { error, user, trip } = await resolveTraveler(request, params.id)
  if (error) return error

  try {
    const { itineraryItemId, kind, text, emoji } = await request.json()

    if (!itineraryItemId) {
      return NextResponse.json({ error: "itineraryItemId is required" }, { status: 400 })
    }

    if (kind === "reaction" && !emoji) {
      return NextResponse.json({ error: "emoji is required for reactions" }, { status: 400 })
    }

    if (kind !== "reaction" && !text?.trim()) {
      return NextResponse.json({ error: "text is required for comments" }, { status: 400 })
    }

    const comment = await ItineraryComment.create({
      trip: trip._id,
      itineraryItemId,
      author: user._id,
      kind: kind === "reaction" ? "reaction" : "comment",
      text: text?.trim(),
      emoji,
    })

    await comment.populate("author", "name image")

    return NextResponse.json({ comment }, { status: 201 })
  } catch (err) {
    console.error("Create itinerary comment error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
