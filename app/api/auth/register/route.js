import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb"
import User from "../../../../models/User"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

export async function POST(request) {
  try {
    const { firstName, lastName, email, phone, city, country, additionalInfo, password } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !city || !country || !password) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^\S+@\S+$/i
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }

    // Validate additional info length if provided
    if (additionalInfo && additionalInfo.length > 500) {
      return NextResponse.json({ error: "Additional information must be less than 500 characters" }, { status: 400 })
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phone })
    if (existingPhone) {
      return NextResponse.json({ error: "User already exists with this phone number" }, { status: 400 })
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      city,
      country,
      additionalInfo: additionalInfo || "",
      password,
      name: `${firstName} ${lastName}`, // For compatibility with existing auth
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          email: user.email,
          phone: user.phone,
          city: user.city,
          country: user.country,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json({ error: `User already exists with this ${field}` }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
