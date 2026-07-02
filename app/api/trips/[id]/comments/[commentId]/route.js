import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../../lib/auth"
import connectDB from "../../../../../../lib/mongodb"
import User from "../../../../../../models/User"
import ItineraryComment from "../../../../../../models/ItineraryComment"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function DELETE(request, { params }) {
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

    const comment = await ItineraryComment.findById(params.commentId)

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (comment.author.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "You can only delete your own comments" }, { status: 403 })
    }

    await ItineraryComment.findByIdAndDelete(params.commentId)

    return NextResponse.json({ message: "Comment deleted" })
  } catch (error) {
    console.error("Delete itinerary comment error:", error)

    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
