import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"
import User from "../../../../../models/User"
import TripInvite from "../../../../../models/TripInvite"
import { sendMail } from "../../../../../lib/mail"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, role } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const inviteRole = role === "viewer" ? "viewer" : "collaborator"

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

    const isOwner = trip.owner.toString() === user._id.toString()
    const isCollaborator = trip.travelers.some(
      (traveler) => traveler.user.toString() === user._id.toString() && traveler.role === "collaborator",
    )

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "You don't have permission to invite people to this trip" }, { status: 403 })
    }

    const invite = new TripInvite({
      trip: trip._id,
      email: email.toLowerCase(),
      role: inviteRole,
      invitedBy: user._id,
    })

    const token = invite.createInviteToken()
    await invite.save()

    const inviteUrl = `${process.env.NEXTAUTH_URL}/trips/invite/${token}`

    await sendMail({
      to: email,
      subject: `You've been invited to plan "${trip.name}" on GlobeTrotter`,
      html: `
        <h2>Trip Invitation</h2>
        <p>${user.name || user.email} invited you to help plan <strong>${trip.name}</strong> on GlobeTrotter.</p>
        <a href="${inviteUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invitation</a>
        <p>This invite link expires in 7 days.</p>
      `,
    })

    return NextResponse.json({ message: "Invite sent", inviteId: invite._id }, { status: 201 })
  } catch (error) {
    console.error("Trip invite error:", error)

    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
