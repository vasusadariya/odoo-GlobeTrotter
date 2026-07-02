import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb"
import Trip from "../../../../models/Trip"
import User from "../../../../models/User"
import { computeWeatherConflictsForTrip } from "../../../../lib/weatherConflicts"
import { sendMail } from "../../../../lib/mail"

// Force this route to be dynamic
export const dynamic = "force-dynamic"

const THROTTLE_HOURS = 20
const LOOKAHEAD_DAYS = 7

function buildNudgeEmailHtml(trip, conflictedDays) {
  const items = conflictedDays
    .map(
      (day) => `
        <li>
          <strong>${day.date} — ${day.location}</strong>: ${day.conflicts.join("; ")}
          ${day.packingList?.length ? `<br/>Suggested packing: ${day.packingList.join(", ")}` : ""}
        </li>
      `,
    )
    .join("")

  return `
    <h2>Weather alert for your upcoming trip</h2>
    <p>Some plans on <strong>${trip.name}</strong> may be affected by weather:</p>
    <ul>${items}</ul>
    <p><a href="${process.env.NEXTAUTH_URL}/trips/${trip._id}/itinerary/view">View your itinerary</a></p>
  `
}

// Vercel Cron hits this daily (see vercel.json). Also callable manually with
// the correct secret for testing.
export async function GET(request) {
  const secret = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret")

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()

    const now = new Date()
    const lookaheadEnd = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000)
    const throttleCutoff = new Date(now.getTime() - THROTTLE_HOURS * 60 * 60 * 1000)

    const trips = await Trip.find({
      startDate: { $gte: now, $lte: lookaheadEnd },
      status: { $ne: "cancelled" },
      $or: [{ weatherNudgeSentAt: null }, { weatherNudgeSentAt: { $lt: throttleCutoff } }],
    })

    let sent = 0
    let skipped = 0
    let errors = 0

    for (const trip of trips) {
      try {
        const owner = await User.findById(trip.owner)
        if (!owner) {
          skipped++
          continue
        }

        // Default is opt-in (matches User.preferences.notifications.email default: true)
        if (owner.preferences?.notifications?.email === false) {
          skipped++
          continue
        }

        const { days } = await computeWeatherConflictsForTrip(trip)
        const conflictedDays = days.filter((d) => d.conflicts?.length > 0)

        if (conflictedDays.length === 0) {
          skipped++
          continue
        }

        await sendMail({
          to: owner.email,
          subject: `Weather alert for your upcoming trip: ${trip.name}`,
          html: buildNudgeEmailHtml(trip, conflictedDays),
        })

        trip.weatherNudgeSentAt = new Date()
        await trip.save()
        sent++
      } catch (err) {
        console.error(`Weather nudge failed for trip ${trip._id}:`, err)
        errors++
      }
    }

    return NextResponse.json({ checked: trips.length, sent, skipped, errors })
  } catch (error) {
    console.error("Weather nudge cron error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
