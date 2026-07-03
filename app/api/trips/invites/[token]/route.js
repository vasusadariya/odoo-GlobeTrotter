import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"
import User from "../../../../../models/User"
import TripInvite from "../../../../../models/TripInvite"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

// tokenHash is bcrypt (not a lookup-able index), so find the matching invite
// by testing candidates rather than querying by token directly - avoids the
// bug pattern in app/api/auth/reset/route.js, which grabs the first pending
// token document without disambiguating between multiple candidates.
async function findInviteByToken(token) {
  const candidates = await TripInvite.find({
    status: "pending",
    expiresAt: { $gt: new Date() },
  })

  for (const invite of candidates) {
    if (invite.verifyInviteToken(token)) {
      return invite
    }
  }

  return null
}

export async function GET(request, props) {
  const params = await props.params;
  try {
    await connectDB()

    const invite = await findInviteByToken(params.token)

    if (!invite) {
      return NextResponse.json({ error: "Invite is invalid or has expired" }, { status: 404 })
    }

    const [trip, inviter] = await Promise.all([
      Trip.findById(invite.trip).select("name startDate endDate"),
      User.findById(invite.invitedBy).select("name email"),
    ])

    return NextResponse.json({
      trip: trip ? { id: trip._id, name: trip.name, startDate: trip.startDate, endDate: trip.endDate } : null,
      inviter: inviter ? { name: inviter.name, email: inviter.email } : null,
      role: invite.role,
      email: invite.email,
    })
  } catch (error) {
    console.error("Invite preview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request, props) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "You must be signed in to accept an invite" }, { status: 401 })
    }

    await connectDB()

    const invite = await findInviteByToken(params.token)

    if (!invite) {
      return NextResponse.json({ error: "Invite is invalid or has expired" }, { status: 404 })
    }

    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const trip = await Trip.findById(invite.trip)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    const alreadyTraveler = trip.travelers.some((t) => t.user.toString() === user._id.toString())

    if (!alreadyTraveler) {
      trip.travelers.push({ user: user._id, role: invite.role, joinedAt: new Date() })
      await trip.save()
    }

    invite.status = "accepted"
    await invite.save()

    return NextResponse.json({ message: "Invite accepted", tripId: trip._id })
  } catch (error) {
    console.error("Invite accept error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
