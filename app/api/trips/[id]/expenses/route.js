import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import connectDB from "../../../../../lib/mongodb"
import Trip from "../../../../../models/Trip"
import User from "../../../../../models/User"
import Expense from "../../../../../models/Expense"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

async function resolveUserAndTrip(tripId) {
  const session = await getServerSession(authOptions)
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  await connectDB()

  const user = await User.findOne({
    $or: [{ googleId: session.user.id }, { email: session.user.email }],
  })
  if (!user) return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) }

  const trip = await Trip.findById(tripId)
  if (!trip) return { error: NextResponse.json({ error: "Trip not found" }, { status: 404 }) }

  return { user, trip }
}

export async function GET(request, { params }) {
  const { error, trip, user } = await resolveUserAndTrip(params.id)
  if (error) return error

  const isOwner = trip.owner.toString() === user._id.toString()
  const isTraveler = trip.travelers.some((t) => t.user.toString() === user._id.toString())

  if (!isOwner && !isTraveler) {
    return NextResponse.json({ error: "You don't have access to this trip" }, { status: 403 })
  }

  const expenses = await Expense.find({ trip: trip._id })
    .populate("paidBy", "name image")
    .populate("splitBetween.user", "name image")
    .sort({ date: -1 })
    .lean()

  return NextResponse.json({ expenses })
}

export async function POST(request, { params }) {
  const { error, trip, user } = await resolveUserAndTrip(params.id)
  if (error) return error

  const isOwner = trip.owner.toString() === user._id.toString()
  const isCollaborator = trip.travelers.some(
    (t) => t.user.toString() === user._id.toString() && t.role === "collaborator",
  )

  if (!isOwner && !isCollaborator) {
    return NextResponse.json({ error: "You don't have permission to add expenses to this trip" }, { status: 403 })
  }

  try {
    const { itineraryItemId, category, description, amount, currency } = await request.json()

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "A positive amount is required" }, { status: 400 })
    }

    // Equal split across everyone currently on the trip (owner + travelers).
    const participantIds = new Set([trip.owner.toString(), ...trip.travelers.map((t) => t.user.toString())])
    const share = Number(amount) / participantIds.size

    const expense = await Expense.create({
      trip: trip._id,
      itineraryItemId: itineraryItemId || null,
      category: category || "other",
      description: description?.trim() || "",
      amount: Number(amount),
      currency: currency || trip.currency || "USD",
      paidBy: user._id,
      splitBetween: Array.from(participantIds).map((id) => ({ user: id, share })),
    })

    await expense.populate("paidBy", "name image")
    await expense.populate("splitBetween.user", "name image")

    return NextResponse.json({ expense }, { status: 201 })
  } catch (err) {
    console.error("Create expense error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
