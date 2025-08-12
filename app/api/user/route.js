import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../lib/auth"
import connectDB from "../../../lib/mongodb"
import User from "../../../models/User"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Find user by Google ID or email
    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    })

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Return user data without sensitive information
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      preferences: user.preferences || {},
      location: user.location || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return Response.json({ user: userData })
  } catch (error) {
    console.error("Error fetching user:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, preferences } = body

    await connectDB()

    // Find user by Google ID or email
    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    })

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email, _id: { $ne: user._id } })
      if (existingUser) {
        return Response.json({ error: "Email already in use by another account" }, { status: 400 })
      }
    }

    // Update user data
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (preferences !== undefined) updateData.preferences = preferences
    updateData.updatedAt = new Date()

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, { new: true })

    // Return updated user data without sensitive information
    const userData = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      preferences: updatedUser.preferences || {},
      location: updatedUser.location || null,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    }

    return Response.json({ user: userData })
  } catch (error) {
    console.error("Error updating user:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
