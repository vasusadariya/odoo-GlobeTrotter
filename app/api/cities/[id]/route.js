import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb"
import City from "../../../../models/City"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
  try {
    const { id } = params

    await connectDB()

    const city = await City.findById(id).lean()

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 })
    }

    return NextResponse.json({ city }, { status: 200 })
  } catch (error) {
    console.error("City detail fetch error:", error)

    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid city ID" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
