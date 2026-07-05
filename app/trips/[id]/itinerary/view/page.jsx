"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion, useScroll } from "framer-motion"
import {
  MapPin,
  Bed,
  Car,
  Utensils,
  Sparkles,
  Waypoints,
  CalendarDays,
  X,
  Share2,
  Wand2,
  Compass,
  Star,
  Clock,
  Rocket,
  Flag,
  Loader2,
  ListChecks,
} from "lucide-react"
import WeatherSuggestions from "../../../../../components/WeatherSuggestions"
import ItineraryComments from "../../../../../components/ItineraryComments"
import LogoLoader from "../../../../../components/waypoint/LogoLoader"
import PhotoTile from "../../../../../components/waypoint/PhotoTile"
import { getCityImageUrl } from "../../../../../lib/cityImage"
import { getDayNumber, groupItineraryByDay } from "../../../../../lib/itineraryDays"

const TYPE_ICON = {
  destination: MapPin,
  accommodation: Bed,
  transport: Car,
  meal: Utensils,
  activity: Sparkles,
}

const TYPE_STYLE = {
  destination: { icon: "bg-blue-100 text-blue-600", border: "border-blue-200", chip: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  accommodation: { icon: "bg-green-100 text-green-600", border: "border-green-200", chip: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  transport: { icon: "bg-yellow-100 text-yellow-600", border: "border-yellow-200", chip: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
  meal: { icon: "bg-red-100 text-red-600", border: "border-red-200", chip: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  activity: { icon: "bg-purple-100 text-purple-600", border: "border-purple-200", chip: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  default: { icon: "bg-gray-100 text-gray-600", border: "border-gray-200", chip: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-500" },
}

function getTypeIcon(type) {
  return TYPE_ICON[type] || Sparkles
}

function getTypeStyle(type) {
  return TYPE_STYLE[type] || TYPE_STYLE.default
}

function getSectionPhoto(section) {
  if (section?.placeDetails?.photos?.[0]?.url) return section.placeDetails.photos[0].url
  if (section?.location) return getCityImageUrl({ name: section.location.split(",")[0] })
  return null
}

// Owns dispatchRef + useScroll itself so the ref and the hook mount together
// atomically — calling useScroll in the parent while this section is
// conditionally rendered (loading state, calendar view, empty state) left
// the ref unattached during earlier renders and threw "Target ref is
// defined but not hydrated".
function FlowchartView({ trip, dayGroups, tripId, regenerateDay, regeneratingId, formatDate }) {
  const dispatchRef = useRef(null)
  const { scrollYProgress: routeProgress } = useScroll({
    target: dispatchRef,
    offset: ["start 0.75", "end 0.75"],
  })

  return (
    <div className="bg-parchment-raised rounded-md shadow-sm border border-ink/10 p-6 sm:p-8">
      {/* Trip Begins */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-full bg-brass/10 text-brass flex items-center justify-center flex-shrink-0">
          <Rocket className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display italic text-ink">Trip Begins</h3>
          <p className="text-sm text-ink/50 font-data">{formatDate(trip?.startDate)}</p>
        </div>
      </div>

      <div className="relative pl-4" ref={dispatchRef}>
        {/* Static route track + brass progress line that draws in on scroll */}
        <div className="absolute left-[3px] top-1 bottom-1 w-0.5 bg-ink/10" />
        <motion.div
          className="absolute left-[3px] top-1 w-0.5 bg-brass origin-top"
          style={{ scaleY: routeProgress, height: "calc(100% - 0.5rem)" }}
        />

        <div className="space-y-10">
          {dayGroups.map((group) => {
            const thumbPhoto = getSectionPhoto(group.items[0])
            return (
              <motion.div
                key={group.dateKey}
                className="relative pl-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Day header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-[72px] h-[72px] rounded-md overflow-hidden border border-ink/10 flex-shrink-0">
                    <PhotoTile
                      src={thumbPhoto}
                      alt={group.items[0]?.location || `Day ${group.dayNumber}`}
                      seed={group.items[0]?.location || group.dateKey}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="font-data text-xs uppercase tracking-widest text-brass">Day {group.dayNumber}</span>
                    <h3 className="font-display italic text-xl text-ink">
                      {group.items[0]?.title || formatDate(group.date)}
                    </h3>
                    <span className="font-data text-xs text-ink/40">{formatDate(group.date)}</span>
                  </div>
                </div>

                {/* Items for this day */}
                <div className="space-y-4">
                  {group.items.map((section) => {
                    const style = getTypeStyle(section.type)
                    const Icon = getTypeIcon(section.type)
                    return (
                      <div
                        key={section.id}
                        className={`relative bg-parchment-raised rounded-md border ${style.border} p-5 shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-ink">{section.title}</h3>
                              <span className="text-xs text-ink/50 capitalize font-data">{section.type}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {section.budget > 0 && (
                              <div className="bg-brass/10 text-brass border border-brass/20 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap font-data tabular-nums">
                                {trip?.currency} {section.budget}
                              </div>
                            )}
                            <button
                              onClick={() => regenerateDay(section.id)}
                              disabled={regeneratingId === section.id}
                              aria-label="Regenerate this day with AI"
                              title="Regenerate this day with AI"
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-brass/25 text-brass bg-brass/5 hover:bg-brass/10 disabled:opacity-50 whitespace-nowrap"
                            >
                              {regeneratingId === section.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Wand2 className="w-3.5 h-3.5" />
                              )}
                              {regeneratingId === section.id ? "Regenerating..." : "Regenerate"}
                            </button>
                          </div>
                        </div>

                        {section.description && (
                          <p className="text-ink/60 leading-relaxed mb-3">{section.description}</p>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-ink/10">
                          {section.location && (
                            <div>
                              <div className="text-xs text-ink/40 uppercase tracking-wide font-data">Location</div>
                              <div className="font-medium text-ink flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-ink/30" />
                                {section.location}
                              </div>
                            </div>
                          )}
                          {section.duration && (
                            <div>
                              <div className="text-xs text-ink/40 uppercase tracking-wide font-data">Duration</div>
                              <div className="font-medium text-ink flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-ink/30" />
                                {section.duration}
                              </div>
                            </div>
                          )}
                          {section.rating && (
                            <div>
                              <div className="text-xs text-ink/40 uppercase tracking-wide font-data">Rating</div>
                              <div className="font-medium text-ink flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                {section.rating}/5
                              </div>
                            </div>
                          )}
                        </div>

                        <ItineraryComments tripId={tripId} itineraryItemId={section.id} />
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Trip Complete */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-ink/10">
        <div className="w-11 h-11 rounded-full bg-route/10 text-route flex items-center justify-center flex-shrink-0">
          <Flag className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display italic text-ink">Trip Complete</h3>
          <p className="text-sm text-ink/50 font-data">{formatDate(trip?.endDate)}</p>
        </div>
      </div>
    </div>
  )
}

export default function ItineraryViewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [trip, setTrip] = useState(null)
  const [itinerary, setItinerary] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState("flowchart") // flowchart or calendar
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [showOptimizeModal, setShowOptimizeModal] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState(null)
  const [isOptimized, setIsOptimized] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState(null)

  const fetchItinerary = async () => {
    try {
      setIsLoading(true)

      if (!params.id || params.id === "undefined") {
        setError("Invalid trip ID")
        return
      }

      // Get the actual trip ID (not 'view')
      const tripId = params.id.split('/')[0];

      const response = await fetch(`/api/trips/${tripId}/itinerary`)

      if (!response.ok) {
        setError("Failed to load itinerary")
        return
      }

      const data = await response.json()
      setTrip(data.trip)
      setItinerary(data.itinerary || [])
    } catch (error) {
      console.error("Error fetching itinerary:", error)
      setError("Failed to load itinerary")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated" && params.id) {
      fetchItinerary()
    }
  }, [status, params.id])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const tripId = params.id.split('/')[0];

  // Calendar helper functions
  const getCalendarDays = () => {
    if (!trip?.startDate || !trip?.endDate) return []

    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)

    // Get the first day of the month and last day of the month to show full calendar
    const firstDay = new Date(start.getFullYear(), start.getMonth(), 1)
    const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0)

    // Get the first Sunday before the first day of the month
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    // Get the last Saturday after the last day of the month
    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const days = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }

    return days
  }

  const getActivitiesForDate = (date) => {
    const dateStr = date.toDateString()
    return itinerary.filter((activity) => {
      const activityDate = new Date(activity.startDate).toDateString()
      return activityDate === dateStr
    })
  }

  const isDateInTripRange = (date) => {
    if (!trip?.startDate || !trip?.endDate) return false
    const tripStart = new Date(trip.startDate)
    const tripEnd = new Date(trip.endDate)
    return date >= tripStart && date <= tripEnd
  }

  const handleDayClick = (date, activities) => {
    if (activities.length > 0) {
      setSelectedDate(date)
      setShowDayModal(true)
    }
  }

  const closeDayModal = () => {
    setShowDayModal(false)
    setSelectedDate(null)
  }

  const openOptimizeModal = async () => {
    setShowOptimizeModal(true)
    setIsOptimizing(true)
    setOptimizationResult(null)

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: params.id
        })
      })

      if (res.ok) {
        const data = await res.json()
        setOptimizationResult(data)

        // Don't automatically update itinerary - let user apply changes manually
      } else {
        throw new Error('Optimization failed')
      }
    } catch (error) {
      console.error('Error optimizing trip:', error)
      setOptimizationResult({ error: 'Failed to optimize trip' })
    } finally {
      setIsOptimizing(false)
    }
  }

  const closeOptimizeModal = () => {
    setShowOptimizeModal(false)
    setIsOptimizing(false)
    setOptimizationResult(null)
  }

  const applyOptimization = async () => {
    if (!optimizationResult || !optimizationResult.optimizedItinerary) {
      closeOptimizeModal()
      return
    }

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: params.id, confirm: true }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to apply optimization')

      setItinerary(data.optimizedItinerary || optimizationResult.optimizedItinerary)
      setIsOptimized(true)
      toast.success('Optimized route applied!')
    } catch (error) {
      console.error('Error applying optimization:', error)
      toast.error(error.message || 'Failed to apply optimization')
    } finally {
      closeOptimizeModal()
    }
  }

  const regenerateDay = async (itemId) => {
    setRegeneratingId(itemId)
    try {
      const response = await fetch(`/api/generate-and-view/${tripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetIds: [itemId] }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to regenerate this day")
      }

      setItinerary(data.itinerary || [])
      toast.success("Day regenerated!")
    } catch (error) {
      console.error("Error regenerating day:", error)
      toast.error(error.message || "Failed to regenerate this day")
    } finally {
      setRegeneratingId(null)
    }
  }

  const shareTrip = async () => {
    try {
      const shareUrl = `${window.location.origin}/trips/${tripId}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied — anyone with access to this trip can open it")
    } catch (error) {
      console.error("Error copying share link:", error)
      toast.error("Failed to copy link")
    }
  }

  const totalBudget = itinerary.reduce((total, section) => total + (section.budget || 0), 0)
  const dayGroups = trip?.startDate ? groupItineraryByDay(itinerary, trip.startDate) : []

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <LogoLoader caption="Loading itinerary…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-route/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-route" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-display italic text-ink mb-2">Error Loading Itinerary</h1>
          <p className="text-ink/60 mb-6">{error}</p>
          <Link href="/dashboard" className="inline-flex items-center rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-white hover:bg-brass-light">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">

        {/* Main Content */}
        <div>

          {/* Trip Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="mb-2 flex items-center gap-2 font-data text-xs uppercase tracking-widest text-brass">
                  <span className="h-px w-7 bg-brass" />
                  Dispatch
                </p>
                <h1 className="text-3xl font-display italic text-ink mb-1">{trip?.name}</h1>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-ink/50 font-data tabular-nums">
                  <span>
                    {formatDate(trip?.startDate)} – {formatDate(trip?.endDate)}
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-brass">
                    {trip?.currency} {totalBudget.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-parchment-raised rounded-md p-1 shadow-sm border border-ink/10 self-start">
                <button
                  onClick={() => setViewMode("flowchart")}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                    viewMode === "flowchart"
                      ? "bg-ink text-parchment shadow-sm"
                      : "text-ink/60 hover:text-ink hover:bg-parchment-sunken"
                  }`}
                >
                  <Waypoints className="w-4 h-4" />
                  Flow
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                    viewMode === "calendar"
                      ? "bg-ink text-parchment shadow-sm"
                      : "text-ink/60 hover:text-ink hover:bg-parchment-sunken"
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </button>
              </div>
            </div>
          </div>

          {itinerary.length === 0 ? (
            <div className="text-center py-12 bg-parchment-raised rounded-md border border-ink/10 shadow-sm">
              <ListChecks className="w-16 h-16 text-ink/20 mx-auto mb-4" />
              <h3 className="text-lg font-display italic text-ink mb-2">No Itinerary Found</h3>
              <p className="text-ink/60 mb-4">This trip doesn&apos;t have an itinerary yet.</p>
              <Link href={`/trips/${tripId}/itinerary`} className="inline-flex items-center rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-white hover:bg-brass-light">
                Build Itinerary
              </Link>
            </div>
          ) : (
            <>
              {/* Flowchart / Day-grouped View */}
              {viewMode === "flowchart" && (
                <FlowchartView
                  trip={trip}
                  dayGroups={dayGroups}
                  tripId={tripId}
                  regenerateDay={regenerateDay}
                  regeneratingId={regeneratingId}
                  formatDate={formatDate}
                />
              )}

              {/* Calendar View */}
              {viewMode === "calendar" && (
                <div className="flex flex-col md:flex-row bg-parchment-raised rounded-md shadow-sm border border-ink/10 overflow-hidden">
                  {/* Sidebar - Calendar Categories */}
                  <div className="w-full md:w-64 bg-parchment-sunken border-b md:border-b-0 md:border-r border-ink/10 p-4">
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-ink mb-3">Trip Calendar</h3>
                      <div className="space-y-2">
                        {Object.entries({
                          destination: "Destinations",
                          accommodation: "Accommodation",
                          transport: "Transport",
                          meal: "Meals",
                          activity: "Activities",
                        }).map(([type, label]) => (
                          <div key={type} className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-sm ${getTypeStyle(type).dot}`}></div>
                            <span className="text-sm text-ink/70">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Budget Summary */}
                    <div className="bg-parchment-raised rounded-md p-3 border border-ink/10">
                      <h4 className="text-sm font-semibold text-ink mb-2">Budget Summary</h4>
                      <div className="text-lg font-semibold text-brass font-data tabular-nums">
                        {trip?.currency} {totalBudget.toFixed(2)}
                      </div>
                      <div className="text-xs text-ink/40">Total Trip Budget</div>
                    </div>

                    {/* Mini Calendar */}
                    <div className="mt-6">
                      <div className="text-sm font-semibold text-ink mb-2">
                        {new Date(trip?.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                          <div key={`${day}-${i}`} className="text-center text-ink/40 font-medium py-1">
                            {day}
                          </div>
                        ))}
                        {getCalendarDays()
                          .slice(0, 42)
                          .map((date, index) => {
                            const isInTrip = isDateInTripRange(date)
                            const hasActivities = getActivitiesForDate(date).length > 0
                            return (
                              <div
                                key={index}
                                className={`text-center py-1 text-xs font-data ${
                                  isInTrip
                                    ? hasActivities
                                      ? "bg-brass text-white rounded"
                                      : "bg-brass/10 text-brass rounded"
                                    : "text-ink/30"
                                }`}
                              >
                                {date.getDate()}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Main Calendar Grid */}
                  <div className="flex-1 p-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-display italic text-ink">
                        {new Date(trip?.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </h2>
                    </div>

                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-px mb-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-ink/40 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-px bg-ink/10 rounded-md overflow-hidden">
                      {getCalendarDays().map((date, index) => {
                        const dayActivities = getActivitiesForDate(date)
                        const isInTrip = isDateInTripRange(date)
                        const isCurrentMonth = date.getMonth() === new Date(trip?.startDate).getMonth()
                        const isToday = date.toDateString() === new Date().toDateString()

                        return (
                          <div
                            key={index}
                            className={`bg-parchment-raised min-h-[120px] p-2 cursor-pointer hover:bg-parchment-sunken transition-colors ${
                              !isCurrentMonth ? "bg-parchment-sunken" : ""
                            } ${isToday ? "bg-brass/5 border-2 border-brass/30" : ""}`}
                            onClick={() => handleDayClick(date, dayActivities)}
                          >
                            {/* Date Number */}
                            <div
                              className={`text-sm font-medium mb-1 font-data ${
                                !isCurrentMonth ? "text-ink/30" : isInTrip ? "text-ink" : "text-ink/50"
                              }`}
                            >
                              {date.getDate()}
                            </div>

                            {/* Activities */}
                            <div className="space-y-1">
                              {dayActivities.slice(0, 3).map((activity) => (
                                <div
                                  key={activity.id}
                                  className={`text-xs px-2 py-1 rounded-md border ${getTypeStyle(activity.type).chip} truncate cursor-pointer hover:shadow-sm transition-shadow`}
                                  title={`${activity.title} - ${activity.budget > 0 ? `${trip?.currency}${activity.budget}` : "No budget"}`}
                                >
                                  {activity.title}
                                </div>
                              ))}
                              {dayActivities.length > 3 && (
                                <div className="text-xs text-ink/40 px-2 font-data">+{dayActivities.length - 3} more</div>
                              )}
                            </div>

                            {/* Daily Budget */}
                            {dayActivities.length > 0 && (
                              <div className="mt-2 text-xs text-brass font-medium font-data tabular-nums">
                                {trip?.currency}
                                {dayActivities.reduce((sum, act) => sum + (act.budget || 0), 0).toFixed(0)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Day Detail Modal */}
              {showDayModal && selectedDate && (
                <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
                  <div className="bg-parchment-raised rounded-md shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                    {/* Modal Header */}
                    <div className="bg-ink text-parchment p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-display italic">
                            {selectedDate.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </h2>
                          <p className="text-parchment/60 mt-1 font-data text-sm">
                            Day {getDayNumber(selectedDate, trip?.startDate)} of your trip
                          </p>
                        </div>
                        <button
                          onClick={closeDayModal}
                          aria-label="Close"
                          className="text-parchment hover:text-brass-light transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                      {(() => {
                        const dayActivities = getActivitiesForDate(selectedDate)
                        const dayBudget = dayActivities.reduce((sum, act) => sum + (act.budget || 0), 0)

                        return (
                          <>
                            {/* Day Summary */}
                            <div className="flex items-center justify-between mb-6 p-4 bg-parchment-sunken rounded-md">
                              <div>
                                <h3 className="font-semibold text-ink">
                                  {dayActivities.length} {dayActivities.length === 1 ? "Activity" : "Activities"} Planned
                                </h3>
                                <p className="text-sm text-ink/50">Full day itinerary</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-semibold text-brass font-data tabular-nums">
                                  {trip?.currency} {dayBudget.toFixed(2)}
                                </div>
                                <div className="text-sm text-ink/40">Daily Budget</div>
                              </div>
                            </div>

                            {/* Activities List */}
                            <div className="space-y-4">
                              {dayActivities.map((activity) => {
                                const style = getTypeStyle(activity.type)
                                const Icon = getTypeIcon(activity.type)
                                return (
                                  <div
                                    key={activity.id}
                                    className="border border-ink/10 rounded-md p-4 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-start space-x-4">
                                      {/* Activity Icon */}
                                      <div className={`w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                                        <Icon className="w-5 h-5" />
                                      </div>

                                      {/* Activity Details */}
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <h4 className="font-semibold text-ink text-lg">{activity.title}</h4>
                                            <p className="text-sm text-ink/50 capitalize mb-2">{activity.type}</p>
                                            <p className="text-ink/70 mb-3">{activity.description}</p>
                                          </div>
                                          {activity.budget > 0 && (
                                            <div className="bg-brass/10 text-brass px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap font-data tabular-nums">
                                              {trip?.currency} {activity.budget}
                                            </div>
                                          )}
                                        </div>

                                        {/* Activity Meta */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          {activity.location && (
                                            <div className="flex items-center text-ink/60">
                                              <MapPin className="w-4 h-4 mr-2" />
                                              {activity.location}
                                            </div>
                                          )}
                                          {activity.duration && (
                                            <div className="flex items-center text-ink/60">
                                              <Clock className="w-4 h-4 mr-2" />
                                              {activity.duration}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {dayActivities.length === 0 && (
                              <div className="text-center py-8">
                                <CalendarDays className="w-16 h-16 text-ink/20 mx-auto mb-4" />
                                <h3 className="text-lg font-display italic text-ink mb-2">No Activities Planned</h3>
                                <p className="text-ink/60">This day doesn&apos;t have any activities scheduled yet.</p>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-parchment-sunken px-6 py-4 flex justify-end space-x-3">
                      <button
                        onClick={closeDayModal}
                        className="px-4 py-2 text-ink bg-parchment-raised border border-ink/15 rounded-md hover:bg-parchment transition-colors"
                      >
                        Close
                      </button>
                      <Link
                        href={`/trips/${tripId}/itinerary`}
                        className="px-4 py-2 bg-brass text-white rounded-md hover:bg-brass-light transition-colors"
                      >
                        Edit Day
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href={`/trips/${tripId}/itinerary`}
                  className="inline-flex items-center px-6 py-3 rounded-md border border-ink/20 text-ink hover:bg-parchment-sunken transition-colors"
                >
                  Edit Itinerary
                </Link>
                <button
                  onClick={openOptimizeModal}
                  disabled={itinerary.length < 2}
                  className="inline-flex items-center px-6 py-3 rounded-md border border-ink/20 text-ink hover:bg-parchment-sunken transition-colors disabled:opacity-40"
                >
                  <Compass className="w-4 h-4 mr-2" />
                  Optimize Route
                </button>
                <button
                  onClick={shareTrip}
                  className="inline-flex items-center px-6 py-3 rounded-md bg-brass text-white hover:bg-brass-light transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Trip
                </button>
              </div>

              {/* Optimize Route Modal */}
              {showOptimizeModal && (
                <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
                  <div className="bg-parchment-raised rounded-md shadow-2xl max-w-md w-full p-6">
                    <h2 className="text-xl font-display italic text-ink mb-4">Route Optimization</h2>

                    {isOptimizing ? (
                      <div className="flex flex-col items-center py-8">
                        <LogoLoader size={72} />
                      </div>
                    ) : optimizationResult?.error ? (
                      <p className="text-route text-sm mb-4">{optimizationResult.error}</p>
                    ) : optimizationResult ? (
                      <div className="space-y-3 mb-6 font-data">
                        <div className="flex justify-between text-sm bg-parchment-sunken rounded-md px-3 py-2">
                          <span className="text-ink/60">Distance saved</span>
                          <span className="font-semibold text-ink tabular-nums">{optimizationResult.distanceSaved?.toFixed(1)} km</span>
                        </div>
                        <div className="flex justify-between text-sm bg-parchment-sunken rounded-md px-3 py-2">
                          <span className="text-ink/60">Estimated savings</span>
                          <span className="font-semibold text-brass tabular-nums">${optimizationResult.moneySaved?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm bg-parchment-sunken rounded-md px-3 py-2">
                          <span className="text-ink/60">CO₂ reduced</span>
                          <span className="font-semibold text-ink tabular-nums">{optimizationResult.co2Saved?.toFixed(1)} kg</span>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={closeOptimizeModal}
                        className="px-4 py-2 text-ink bg-parchment-raised border border-ink/15 rounded-md hover:bg-parchment transition-colors"
                      >
                        {isOptimized ? "Close" : "Cancel"}
                      </button>
                      {!isOptimizing && optimizationResult?.optimizedItinerary && !isOptimized && (
                        <button
                          onClick={applyOptimization}
                          className="px-4 py-2 bg-brass text-white rounded-md hover:bg-brass-light transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enhanced Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-parchment-raised rounded-md p-5 shadow-sm border border-ink/10">
              <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-2xl font-semibold text-ink font-data tabular-nums">{itinerary.length}</div>
              <div className="text-sm text-ink/50">Activities</div>
            </div>

            <div className="bg-parchment-raised rounded-md p-5 shadow-sm border border-ink/10">
              <div className="w-10 h-10 rounded-md bg-green-100 text-green-600 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-2xl font-semibold text-ink font-data tabular-nums">{trip?.destinations?.length || 0}</div>
              <div className="text-sm text-ink/50">Destinations</div>
            </div>

            <div className="bg-parchment-raised rounded-md p-5 shadow-sm border border-ink/10">
              <div className="w-10 h-10 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="text-2xl font-semibold text-ink font-data tabular-nums">
                {trip?.startDate && trip?.endDate
                  ? Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))
                  : 0}
              </div>
              <div className="text-sm text-ink/50">Days</div>
            </div>

            <div className="bg-parchment-raised rounded-md p-5 shadow-sm border border-ink/10">
              <div className="w-10 h-10 rounded-md bg-brass/10 text-brass flex items-center justify-center mb-3">
                <Star className="w-5 h-5" />
              </div>
              <div className="text-xl font-semibold text-ink font-data tabular-nums">
                {trip?.currency} {totalBudget.toFixed(0)}
              </div>
              <div className="text-sm text-ink/50">Total Budget</div>
            </div>
          </div>

          {/* Weather & AI Suggestions */}
          <div className="bg-parchment-raised rounded-md p-5 shadow-sm border border-ink/10">
            <h2 className="text-lg font-display italic text-ink mb-4">Weather-Based Packing &amp; Activity Suggestions</h2>
            <WeatherSuggestions tripId={tripId} />
          </div>
        </div>
      </div>
    </div>
  )
}
