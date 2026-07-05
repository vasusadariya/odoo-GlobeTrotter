// Single source of truth for "which day of the trip" an itinerary item
// belongs to. Day number is always derived from the item's own startDate
// relative to the trip's startDate — never from array position — so
// reordering/optimizing the itinerary array can never desync the day
// labels shown across the Flow view, Calendar view, day modal, and
// weather panel.

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function getDayNumber(itemDate, tripStartDate) {
  if (!itemDate || !tripStartDate) return 1
  const diff = startOfDay(itemDate) - startOfDay(tripStartDate)
  return Math.round(diff / MS_PER_DAY) + 1
}

// Builds the key from local calendar-date components directly (no
// toISOString round-trip) — converting a local-midnight Date back through
// toISOString re-expresses it in UTC and can shift it to the previous day,
// which is the exact cross-view desync this module exists to prevent.
export function getDateKey(date) {
  const d = startOfDay(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Buckets itinerary items into one entry per real calendar date, sorted
// chronologically, so views that render "one card per day" merge items
// that share a date instead of treating each item as its own day.
export function groupItineraryByDay(itinerary, tripStartDate) {
  const buckets = new Map()

  for (const item of itinerary || []) {
    if (!item.startDate) continue
    const dateKey = getDateKey(item.startDate)
    if (!buckets.has(dateKey)) {
      buckets.set(dateKey, {
        dayNumber: getDayNumber(item.startDate, tripStartDate),
        dateKey,
        date: startOfDay(item.startDate),
        items: [],
      })
    }
    buckets.get(dateKey).items.push(item)
  }

  return Array.from(buckets.values()).sort((a, b) => a.date - b.date)
}
