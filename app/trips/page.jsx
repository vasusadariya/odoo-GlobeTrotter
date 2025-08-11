"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Button from "../../components/ui/Button_1"

export default function TripsListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      fetchTrips()
    }
  }, [status])

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/trips")
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredTrips = trips.filter((trip) => {
    if (filter === "all") return true
    return trip.status === filter
  })

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header - Feature 4 Component */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
            <p className="text-gray-600">Easily access and manage existing or upcoming trips</p>
          </div>
          <Link href="/trips/create">
            <Button>Plan New Trip</Button>
          </Link>
        </div>

        {/* Filters - Feature 4 Component */}
        <div className="flex space-x-4 mb-6">
          {[
            { key: "all", label: "All Trips" },
            { key: "draft", label: "Draft" },
            { key: "planned", label: "Planned" },
            { key: "in-progress", label: "In Progress" },
            { key: "completed", label: "Completed" },
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Trip Cards - Feature 4 Component */}
        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {trip.coverImage && (
                  <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                    <img
                      src={trip.coverImage || "/placeholder.svg"}
                      alt={trip.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {trip.name || `Trip to ${trip.destinations?.[0]?.name}`}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trip.status === "draft"
                          ? "bg-gray-100 text-gray-800"
                          : trip.status === "planned"
                            ? "bg-blue-100 text-blue-800"
                            : trip.status === "in-progress"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {trip.description || "No description available"}
                  </p>

                  {/* Trip Cards Meta Info - Feature 4 Component */}
                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      {trip.destinations?.length || 0} destinations
                    </div>
                    {trip.budgetLimit > 0 && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                        {trip.currency} {trip.budgetLimit}
                      </div>
                    )}
                  </div>

                  {/* Edit/View/Delete Actions - Feature 4 Component */}
                  <div className="flex space-x-2">
                    <Link href={`/trips/${trip.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/trips/${trip._id || trip.id}/itinerary`}>
                      <Button size="sm" className="whitespace-nowrap">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/trips/${trip._id || trip.id}/itinerary/view`}>
                      <Button variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600 mb-4">
              {filter === "all" ? "You haven't created any trips yet." : `No ${filter} trips found.`}
            </p>
            <Link href="/trips/create">
              <Button>Plan Your First Trip</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
