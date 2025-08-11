"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import Button from "../../../components/ui/Button_1"

export default function TripDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [trip, setTrip] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login")
      return
    }

    if (status === "authenticated" && params.id) {
      fetchTrip()
    }
  }, [status, params.id])

  const fetchTrip = async () => {
    try {
      setIsLoading(true)

      // Validate trip ID
      if (!params.id || params.id === "undefined") {
        setError("Invalid trip ID")
        return
      }

      const response = await fetch(`/api/trips/${params.id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError("Trip not found")
        } else if (response.status === 403) {
          setError("You don't have permission to view this trip")
        } else {
          setError("Failed to load trip")
        }
        return
      }

      const data = await response.json()
      setTrip(data.trip)
    } catch (error) {
      console.error("Error fetching trip:", error)
      setError("Failed to load trip")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePrivacy = async () => {
    if (!trip) return

    setIsUpdating(true)
    try {
      const newPrivacy = trip.privacy === "public" ? "private" : "public"

      const response = await fetch(`/api/trips/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privacy: newPrivacy,
          isPublic: newPrivacy === "public",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update privacy settings")
      }

      const data = await response.json()
      setTrip(data.trip)
    } catch (error) {
      console.error("Error updating privacy:", error)
      setError("Failed to update privacy settings")
    } finally {
      setIsUpdating(false)
    }
  }

  const shareTrip = async () => {
    if (!trip) return

    try {
      const shareUrl = `${window.location.origin}/public-trips/${trip.id}`
      await navigator.clipboard.writeText(shareUrl)
      alert("Trip link copied to clipboard!")
    } catch (error) {
      console.error("Error sharing trip:", error)
      alert("Failed to copy link")
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trip details...</p>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!trip) {
    return null
  }

  const duration = calculateDuration(trip.startDate, trip.endDate)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {trip.coverImage && (
            <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600">
              <img src={trip.coverImage || "/placeholder.svg"} alt={trip.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {trip.name || `Trip to ${trip.destinations?.[0]?.name}`}
                </h1>
                {trip.description && <p className="text-gray-600 mb-4">{trip.description}</p>}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {duration} {duration === 1 ? "day" : "days"}
                  </div>
                  <div className="flex items-center">
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
                    {trip.destinations?.length || 0} {trip.destinations?.length === 1 ? "destination" : "destinations"}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    {trip.privacy}
                  </div>
                  {trip.budgetLimit > 0 && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      {trip.currency || "$"}
                      {trip.budgetLimit} budget
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" size="sm" onClick={shareTrip} disabled={isUpdating}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePrivacy}
                  disabled={isUpdating}
                  className={trip.privacy === "public" ? "bg-green-50 text-green-700 border-green-200" : ""}
                >
                  {isUpdating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={
                          trip.privacy === "public"
                            ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        }
                      />
                    </svg>
                  )}
                  {trip.privacy === "public" ? "Make Private" : "Make Public"}
                </Button>
                <Link href={`/trips/${params.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Destinations */}
        {trip.destinations && trip.destinations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Destinations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trip.destinations.map((destination, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{destination.name}</h3>
                      <p className="text-sm text-gray-600">{destination.country}</p>
                    </div>
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                  {destination.activities && destination.activities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Activities</h4>
                      <div className="space-y-1">
                        {destination.activities.slice(0, 3).map((activity, actIndex) => (
                          <div key={actIndex} className="text-sm text-gray-600">
                            • {activity.name}
                          </div>
                        ))}
                        {destination.activities.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{destination.activities.length - 3} more activities
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Overview */}
        {trip.budgetLimit > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Budget Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-primary-50 rounded-xl">
                <div className="text-2xl font-bold text-primary-600">
                  {trip.currency || "$"}
                  {trip.budgetLimit}
                </div>
                <div className="text-sm text-gray-600">Total Budget</div>
              </div>

              {trip.totalBudget &&
                Object.entries(trip.totalBudget).map(
                  ([category, amount]) =>
                    amount > 0 && (
                      <div key={category} className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-xl font-semibold text-gray-900">
                          {trip.currency || "$"}
                          {amount}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">{category}</div>
                      </div>
                    ),
                )}
            </div>
          </div>
        )}

        {/* Trip Status */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Status</h2>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                <span className="text-sm text-gray-500">Created {new Date(trip.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <Link href={`/search/activities?destination=${trip.destinations?.[0]?.name}`}>
                <Button variant="outline">Add Activities</Button>
              </Link>
              <Link href={`/trips/${params.id}/itinerary`}>
                <Button>Start Planning</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
