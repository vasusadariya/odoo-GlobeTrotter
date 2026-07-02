import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"
import User from "../../../../../models/User"
import CommunityPost from "../../../../../models/CommunityPost"
import { buildCommunityPostFromTrip } from "../../../../../lib/publishTrip"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function POST(request, { params }) {
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

    const trip = await Trip.findById(params.id)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Publishing is an owner-only action, matching DELETE /api/trips/[id]'s pattern.
    if (trip.owner.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Only the trip owner can publish this trip" }, { status: 403 })
    }

    const { title, content, coverImage, tags } = buildCommunityPostFromTrip(trip)

    const post = await CommunityPost.create({
      title,
      content,
      coverImage,
      tags,
      author: user._id,
      trip: trip._id,
    })

    return NextResponse.json({ message: "Trip published", postId: post._id }, { status: 201 })
  } catch (error) {
    console.error("Publish trip error:", error)

    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return NextResponse.json({ error: validationErrors.join(", ") }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
