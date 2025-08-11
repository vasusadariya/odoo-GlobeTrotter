"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import Button from "../../../../../components/ui/Button_1"

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated" && params.id) {
      fetchItinerary()
    }
  }, [status, params.id])

  const fetchItinerary = async () => {
    try {
      setIsLoading(true)

      if (!params.id || params.id === "undefined") {
        setError("Invalid trip ID")
        return
      }

      const response = await fetch(`/api/trips/${params.id}/itinerary`)

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "destination":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case "accommodation":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"
            />
          </svg>
        )
      case "transport":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        )
      case "meal":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "destination":
        return "from-blue-500 to-blue-600"
      case "accommodation":
        return "from-green-500 to-green-600"
      case "transport":
        return "from-yellow-500 to-yellow-600"
      case "meal":
        return "from-red-500 to-red-600"
      case "activity":
        return "from-purple-500 to-purple-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getTypeBorderColor = (type) => {
    switch (type) {
      case "destination":
        return "border-blue-200"
      case "accommodation":
        return "border-green-200"
      case "transport":
        return "border-yellow-200"
      case "meal":
        return "border-red-200"
      case "activity":
        return "border-purple-200"
      default:
        return "border-gray-200"
    }
  }

  const getEventColor = (type) => {
    switch (type) {
      case "destination":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "accommodation":
        return "bg-green-100 text-green-800 border-green-200"
      case "transport":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "meal":
        return "bg-red-100 text-red-800 border-red-200"
      case "activity":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

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

  const totalBudget = itinerary.reduce((total, section) => total + (section.budget || 0), 0)

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Itinerary</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Trip Itinerary</h1>
              <p className="text-lg text-gray-600">{trip?.name}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>
                  {formatDate(trip?.startDate)} - {formatDate(trip?.endDate)}
                </span>
                <span>•</span>
                <span className="font-semibold text-green-600">
                  Total Budget: {trip?.currency} {totalBudget.toFixed(2)}
                </span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-white rounded-xl p-1 shadow-lg border border-gray-200">
              <button
                onClick={() => setViewMode("flowchart")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "flowchart"
                    ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 11V9m0 0L9 7"
                  />
                </svg>
                Flow
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "calendar"
                    ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Calendar
              </button>
            </div>
          </div>
        </div>

        {itinerary.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Itinerary Found</h3>
            <p className="text-gray-600 mb-4">This trip doesn't have an itinerary yet.</p>
            <Link href={`/trips/${params.id}/itinerary`}>
              <Button>Build Itinerary</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Enhanced Flowchart View */}
            {viewMode === "flowchart" && (
              <div className="relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.3) 1px, transparent 0)`,
                      backgroundSize: "20px 20px",
                    }}
                  ></div>
                </div>

                <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 p-8 overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full opacity-10 translate-y-12 -translate-x-12"></div>

                  <div className="relative flex flex-col items-center space-y-8">
                    {/* Trip Start */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-emerald-100">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-yellow-900">🚀</span>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <h3 className="font-bold text-gray-900 text-lg">Trip Begins</h3>
                        <p className="text-sm text-gray-600">{formatDate(trip?.startDate)}</p>
                        <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Budget: {trip?.currency} {totalBudget.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Connecting Line with Animation */}
                    <div className="relative">
                      <div className="w-1 h-12 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full"></div>
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>

                    {/* Activities Flow */}
                    {itinerary.map((section, index) => (
                      <div key={section.id} className="flex flex-col items-center space-y-6 w-full max-w-2xl">
                        {/* Activity Node */}
                        <div className="relative group">
                          {/* Main Activity Card */}
                          <div
                            className={`relative bg-white rounded-2xl shadow-lg border-2 ${getTypeBorderColor(section.type)} p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                          >
                            {/* Activity Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                {/* Icon Circle */}
                                <div
                                  className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(section.type)} rounded-xl flex items-center justify-center text-white shadow-md`}
                                >
                                  {getTypeIcon(section.type)}
                                </div>

                                {/* Day Badge */}
                                <div className="flex flex-col">
                                  <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                                    Day {index + 1}
                                  </div>
                                  <span className="text-xs text-gray-500 mt-1 capitalize">{section.type}</span>
                                </div>
                              </div>

                              {/* Budget Badge */}
                              {section.budget > 0 && (
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-md">
                                  <div className="text-sm font-bold">
                                    {trip?.currency} {section.budget}
                                  </div>
                                  <div className="text-xs opacity-90">Budget</div>
                                </div>
                              )}
                            </div>

                            {/* Activity Content */}
                            <div className="space-y-3">
                              <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                              <p className="text-gray-600 leading-relaxed">{section.description}</p>

                              {/* Activity Details */}
                              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wide">Date</div>
                                  <div className="font-semibold text-gray-900">{formatDate(section.startDate)}</div>
                                </div>
                                {section.location && (
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Location</div>
                                    <div className="font-semibold text-gray-900 flex items-center">
                                      <svg
                                        className="w-4 h-4 mr-1 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                      </svg>
                                      {section.location}
                                    </div>
                                  </div>
                                )}
                                {section.duration && (
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Duration</div>
                                    <div className="font-semibold text-gray-900">{section.duration}</div>
                                  </div>
                                )}
                                {section.rating && (
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Rating</div>
                                    <div className="font-semibold text-gray-900 flex items-center">
                                      <span className="text-yellow-400 mr-1">★</span>
                                      {section.rating}/5
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Decorative Corner */}
                            <div
                              className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${getTypeColor(section.type)} opacity-10 rounded-bl-full`}
                            ></div>
                          </div>

                          {/* Connecting Line to Next Activity */}
                          {index < itinerary.length - 1 && (
                            <div className="flex justify-center mt-6">
                              <div className="relative">
                                <div className="w-1 h-16 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                  <div className="w-4 h-4 bg-white border-2 border-blue-400 rounded-full"></div>
                                </div>
                                {/* Arrow */}
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
                                  <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z"
                                      clipRule="evenodd"
                                      transform="rotate(180 10 10)"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Final Connecting Line */}
                    <div className="relative">
                      <div className="w-1 h-12 bg-gradient-to-b from-purple-500 to-red-500 rounded-full"></div>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>

                    {/* Trip End */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-red-100">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-yellow-900">🏁</span>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <h3 className="font-bold text-gray-900 text-lg">Trip Complete</h3>
                        <p className="text-sm text-gray-600">{formatDate(trip?.endDate)}</p>
                        <div className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Total Spent: {trip?.currency} {totalBudget.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* macOS Calendar Style View */}
            {viewMode === "calendar" && (
              <div
                className="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                style={{ minHeight: "600px" }}
              >
                {/* Sidebar - Calendar Categories */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Trip Calendar</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                        <span className="text-sm text-gray-700">Destinations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                        <span className="text-sm text-gray-700">Accommodation</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                        <span className="text-sm text-gray-700">Transport</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                        <span className="text-sm text-gray-700">Meals</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                        <span className="text-sm text-gray-700">Activities</span>
                      </div>
                    </div>
                  </div>

                  {/* Budget Summary */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Budget Summary</h4>
                    <div className="text-lg font-bold text-green-600">
                      {trip?.currency} {totalBudget.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Total Trip Budget</div>
                  </div>

                  {/* Mini Calendar */}
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-gray-900 mb-2">
                      {new Date(trip?.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                        <div key={day} className="text-center text-gray-500 font-medium py-1">
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
                              className={`text-center py-1 text-xs ${
                                isInTrip
                                  ? hasActivities
                                    ? "bg-blue-500 text-white rounded"
                                    : "bg-blue-100 text-blue-800 rounded"
                                  : "text-gray-400"
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
                    <h2 className="text-2xl font-bold text-gray-900">
                      {new Date(trip?.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h2>
                  </div>

                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 gap-px mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                    {getCalendarDays().map((date, index) => {
                      const dayActivities = getActivitiesForDate(date)
                      const isInTrip = isDateInTripRange(date)
                      const isCurrentMonth = date.getMonth() === new Date(trip?.startDate).getMonth()
                      const isToday = date.toDateString() === new Date().toDateString()

                      return (
                        <div
                          key={index}
                          className={`bg-white min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                            !isCurrentMonth ? "bg-gray-50" : ""
                          } ${isToday ? "bg-blue-50 border-2 border-blue-200" : ""}`}
                          onClick={() => handleDayClick(date, dayActivities)}
                        >
                          {/* Date Number */}
                          <div
                            className={`text-sm font-medium mb-1 ${
                              !isCurrentMonth ? "text-gray-400" : isInTrip ? "text-gray-900" : "text-gray-600"
                            }`}
                          >
                            {date.getDate()}
                          </div>

                          {/* Activities */}
                          <div className="space-y-1">
                            {dayActivities.slice(0, 3).map((activity, actIndex) => (
                              <div
                                key={activity.id}
                                className={`text-xs px-2 py-1 rounded-md border ${getEventColor(activity.type)} truncate cursor-pointer hover:shadow-sm transition-shadow`}
                                title={`${activity.title} - ${activity.budget > 0 ? `${trip?.currency}${activity.budget}` : "No budget"}`}
                              >
                                {activity.title}
                              </div>
                            ))}
                            {dayActivities.length > 3 && (
                              <div className="text-xs text-gray-500 px-2">+{dayActivities.length - 3} more</div>
                            )}
                          </div>

                          {/* Daily Budget */}
                          {dayActivities.length > 0 && (
                            <div className="mt-2 text-xs text-green-600 font-medium">
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
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {selectedDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </h2>
                        <p className="text-blue-100 mt-1">
                          Day {Math.ceil((selectedDate - new Date(trip?.startDate)) / (1000 * 60 * 60 * 24)) + 1} of
                          your trip
                        </p>
                      </div>
                      <button onClick={closeDayModal} className="text-white hover:text-gray-200 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {dayActivities.length} {dayActivities.length === 1 ? "Activity" : "Activities"} Planned
                              </h3>
                              <p className="text-sm text-gray-600">Full day itinerary</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {trip?.currency} {dayBudget.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">Daily Budget</div>
                            </div>
                          </div>

                          {/* Activities List */}
                          <div className="space-y-4">
                            {dayActivities.map((activity, index) => (
                              <div
                                key={activity.id}
                                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start space-x-4">
                                  {/* Activity Icon */}
                                  <div
                                    className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(activity.type)} rounded-xl flex items-center justify-center text-white flex-shrink-0`}
                                  >
                                    {getTypeIcon(activity.type)}
                                  </div>

                                  {/* Activity Details */}
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h4 className="font-semibold text-gray-900 text-lg">{activity.title}</h4>
                                        <p className="text-sm text-gray-600 capitalize mb-2">{activity.type}</p>
                                        <p className="text-gray-700 mb-3">{activity.description}</p>
                                      </div>
                                      {activity.budget > 0 && (
                                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                          {trip?.currency} {activity.budget}
                                        </div>
                                      )}
                                    </div>

                                    {/* Activity Meta */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      {activity.location && (
                                        <div className="flex items-center text-gray-600">
                                          <svg
                                            className="w-4 h-4 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                          </svg>
                                          {activity.location}
                                        </div>
                                      )}
                                      {activity.duration && (
                                        <div className="flex items-center text-gray-600">
                                          <svg
                                            className="w-4 h-4 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                          </svg>
                                          {activity.duration}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {dayActivities.length === 0 && (
                            <div className="text-center py-8">
                              <svg
                                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Planned</h3>
                              <p className="text-gray-600">This day doesn't have any activities scheduled yet.</p>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                    <button
                      onClick={closeDayModal}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <Link href={`/trips/${params.id}/itinerary`}>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Edit Day
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Summary Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{itinerary.length}</div>
                    <div className="text-sm opacity-90">Activities</div>
                  </div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{trip?.destinations?.length || 0}</div>
                    <div className="text-sm opacity-90">Destinations</div>
                  </div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">
                      {Math.ceil((new Date(trip?.endDate) - new Date(trip?.startDate)) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-sm opacity-90">Days</div>
                  </div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {trip?.currency} {totalBudget.toFixed(0)}
                    </div>
                    <div className="text-sm opacity-90">Total Budget</div>
                  </div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center space-x-4">
              <Link href={`/trips/${params.id}/itinerary`}>
                <Button variant="outline" className="px-6 py-3 bg-transparent">
                  Edit Itinerary
                </Button>
              </Link>
              <Button className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700">
                Share Trip
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
