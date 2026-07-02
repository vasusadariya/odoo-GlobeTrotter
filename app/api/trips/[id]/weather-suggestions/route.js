import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import connectDB from "../../../../../lib/mongodb";
import Trip from "../../../../../models/Trip";
import User from "../../../../../models/User";
import { computeWeatherConflictsForTrip } from "../../../../../lib/weatherConflicts";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing trip id" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const trip = await Trip.findById(id);
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const isOwner = trip.owner.toString() === user._id.toString();
    const isCollaborator = trip.travelers.some((t) => t.user.toString() === user._id.toString());
    const isPublic = trip.privacy === "public";

    if (!isOwner && !isCollaborator && !isPublic) {
      return NextResponse.json({ error: "You don't have permission to view this trip" }, { status: 403 });
    }

    const result = await computeWeatherConflictsForTrip(trip);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error generating weather suggestions", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
