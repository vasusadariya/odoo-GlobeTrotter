import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../../lib/auth"
import connectDB from "../../../../../../lib/mongodb"
import Trip from "../../../../../../models/Trip"
import User from "../../../../../../models/User"
import Expense from "../../../../../../models/Expense"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

async function resolveUserAndExpense(tripId, expenseId) {
  const session = await getServerSession(authOptions)
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  await connectDB()

  const user = await User.findOne({
    $or: [{ googleId: session.user.id }, { email: session.user.email }],
  })
  if (!user) return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) }

  const trip = await Trip.findById(tripId)
  if (!trip) return { error: NextResponse.json({ error: "Trip not found" }, { status: 404 }) }

  const expense = await Expense.findOne({ _id: expenseId, trip: tripId })
  if (!expense) return { error: NextResponse.json({ error: "Expense not found" }, { status: 404 }) }

  const isOwner = trip.owner.toString() === user._id.toString()
  const isPayer = expense.paidBy.toString() === user._id.toString()

  if (!isOwner && !isPayer) {
    return { error: NextResponse.json({ error: "You can only edit expenses you paid for" }, { status: 403 }) }
  }

  return { user, trip, expense }
}

export async function PUT(request, { params }) {
  const { error, expense } = await resolveUserAndExpense(params.id, params.expenseId)
  if (error) return error

  try {
    const { category, description, amount } = await request.json()

    if (category) expense.category = category
    if (description !== undefined) expense.description = description.trim()
    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
      }
      const shareCount = expense.splitBetween.length || 1
      expense.amount = Number(amount)
      expense.splitBetween = expense.splitBetween.map((s) => ({ ...s.toObject(), share: Number(amount) / shareCount }))
    }

    await expense.save()
    await expense.populate("paidBy", "name image")
    await expense.populate("splitBetween.user", "name image")

    return NextResponse.json({ expense })
  } catch (err) {
    console.error("Update expense error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const { error, expense } = await resolveUserAndExpense(params.id, params.expenseId)
  if (error) return error

  await Expense.findByIdAndDelete(expense._id)

  return NextResponse.json({ message: "Expense deleted" })
}
