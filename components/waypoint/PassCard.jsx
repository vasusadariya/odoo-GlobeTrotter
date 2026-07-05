"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { getCityImageUrl } from "../../lib/cityImage"
import PhotoTile from "./PhotoTile"

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// A trip rendered as a boarding pass — real destination photography as the
// banner (falling back to a brand-toned gradient scene if no photo resolves),
// a perforated stub carrying the day count.
export default function PassCard({ trip }) {
  const destination = trip.destinations?.[0]
  const photoUrl = destination ? getCityImageUrl(destination) : null

  const days =
    trip.startDate && trip.endDate
      ? Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1)
      : null

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative grid grid-cols-[1fr_88px] overflow-hidden rounded-md border border-ink/10 bg-parchment-raised shadow-[0_1px_2px_rgba(20,37,35,0.06),0_8px_24px_rgba(20,37,35,0.08)]"
    >
      <Link href={`/trips/${trip.id}`} className="flex flex-col">
        <div className="h-32 w-full overflow-hidden">
          <PhotoTile
            src={photoUrl}
            alt={destination?.name || trip.name}
            seed={destination?.name || trip.name}
            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex-1 px-[18px] py-4">
          <p className="font-display text-xl italic text-ink">{trip.name}</p>
          <p className="mb-4 text-[0.8rem] text-ink/60">
            {destination ? `${destination.name}${destination.country ? `, ${destination.country}` : ""}` : "Destination TBD"}
          </p>
          <div className="flex gap-[18px] font-data text-[0.72rem] text-ink/40">
            <span>
              Departs
              <b className="mt-0.5 block text-[0.85rem] font-semibold tabular-nums text-ink/80">
                {trip.startDate ? formatDate(trip.startDate) : "—"}
              </b>
            </span>
            <span>
              Budget
              <b className="mt-0.5 block text-[0.85rem] font-semibold tabular-nums text-ink/80">
                {trip.currency || "$"}
                {trip.budgetLimit || 0}
              </b>
            </span>
          </div>
        </div>
      </Link>
      <div className="relative flex flex-col items-center justify-center gap-1 border-l border-dashed border-ink/20 bg-parchment-sunken before:absolute before:-left-2 before:-top-2 before:h-4 before:w-4 before:rounded-full before:bg-parchment after:absolute after:-bottom-2 after:-left-2 after:h-4 after:w-4 after:rounded-full after:bg-parchment">
        <span className="font-data text-2xl font-semibold text-brass">{days ?? "—"}</span>
        <span className="font-data text-[0.65rem] uppercase tracking-wider text-ink/40">Days</span>
      </div>
    </motion.div>
  )
}
