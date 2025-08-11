import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../lib/auth"
import connectDB from "../../../../lib/mongodb"
import User from "../../../../models/User"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { latitude, longitude, city, area, country } = await request.json()

    await connectDB()

    // Update the user with the new location data
    await User.findByIdAndUpdate(session.user.id, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        city,
        area,
        country,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Location update error:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}