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
  const [viewMode, setViewMode] = useState("timeline") // timeline or calendar

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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const groupByDate = (sections) => {
    const grouped = {}
    sections.forEach((section) => {
      const date = new Date(section.startDate).toDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(section)
    })
    return grouped
  }

  const groupedItinerary = groupByDate(itinerary)

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href={`/trips/${params.id}`} className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">GlobeTrotter</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {session?.user && (
                <>
                  <span className="text-sm text-gray-600">Welcome, {session.user.name}</span>
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Trip Itinerary</h1>
              <p className="text-lg text-gray-600">{trip?.name || `Trip to ${trip?.destinations?.[0]?.name}`}</p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "timeline" ? "bg-white text-primary-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Timeline
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "calendar" ? "bg-white text-primary-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
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
            <p className="text-gray-600 mb-4">This trip doesn&apos;t have an itinerary yet.</p>
            <Link href={`/trips/${params.id}/itinerary`}>
              <Button>Build Itinerary</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Timeline View */}
            {viewMode === "timeline" && (
              <div className="space-y-8">
                {Object.entries(groupedItinerary).map(([date, sections], dayIndex) => (
                  <div key={date} className="relative">
                    {/* Date Header */}
                    <div className="sticky top-0 z-10 bg-gray-50 py-4">
                      <div className="flex items-center">
                        <div className="bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm mr-4">
                          {dayIndex + 1}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{formatDate(date)}</h2>
                          <p className="text-sm text-gray-600">
                            {sections.length} {sections.length === 1 ? "activity" : "activities"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Activities for the day */}
                    <div className="ml-14 space-y-4">
                      {sections.map((section, index) => (
                        <div
                          key={section.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    section.type === "destination"
                                      ? "bg-blue-500"
                                      : section.type === "accommodation"
                                        ? "bg-green-500"
                                        : section.type === "transport"
                                          ? "bg-yellow-500"
                                          : section.type === "activity"
                                            ? "bg-purple-500"
                                            : section.type === "meal"
                                              ? "bg-red-500"
                                              : "bg-gray-500"
                                  }`}
                                ></div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  {section.type}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatTime(section.startDate)} - {formatTime(section.endDate)}
                                </span>
                              </div>

                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                              <p className="text-gray-600 mb-3">{section.description}</p>

                              {section.location && (
                                <div className="flex items-center text-sm text-gray-500 mb-2">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              )}
                            </div>

                            {section.budget > 0 && (
                              <div className="text-right">
                                <div className="text-lg font-semibold text-gray-900">
                                  {trip?.currency || "$"}
                                  {section.budget}
                                </div>
                                <div className="text-xs text-gray-500">Budget</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calendar View */}
            {viewMode === "calendar" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="grid grid-cols-7 gap-4 mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-4">
                    {/* Calendar implementation would go here */}
                    <div className="col-span-7 text-center py-12 text-gray-500">
                      <p>Calendar view coming soon...</p>
                      <p className="text-sm mt-2">Use Timeline view to see your detailed itinerary</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-2xl font-bold text-primary-600">{Object.keys(groupedItinerary).length}</div>
                <div className="text-sm text-gray-600">Days</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-2xl font-bold text-green-600">{itinerary.length}</div>
                <div className="text-sm text-gray-600">Activities</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-2xl font-bold text-blue-600">{trip?.destinations?.length || 0}</div>
                <div className="text-sm text-gray-600">Destinations</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {trip?.currency || "$"}
                  {itinerary.reduce((total, section) => total + (section.budget || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Budget</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center space-x-4">
              <Link href={`/trips/${params.id}/itinerary`}>
                <Button variant="outline">Edit Itinerary</Button>
              </Link>
              <Button>Share Trip</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
