"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Button from "../../../../components/ui/Button_1"

export default function TripReadinessPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()

  const [readiness, setReadiness] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchReadiness = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/trips/${params.id}/readiness`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to load trip readiness")
        return
      }

      setReadiness(data)
    } catch (err) {
      console.error("Error fetching readiness:", err)
      setError("Failed to load trip readiness")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login")
      return
    }

    if (status === "authenticated" && params.id) {
      fetchReadiness()
    }
  }, [status, params.id])

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to load readiness</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href={`/trips/${params.id}`}>
            <Button>Back to Trip</Button>
          </Link>
        </div>
      </div>
    )
  }

  const budgetPercent = readiness.budgetStatus.limit
    ? Math.min(100, Math.round((readiness.budgetStatus.actual / readiness.budgetStatus.limit) * 100))
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/trips/${params.id}`} className="text-sm text-primary-600 hover:text-primary-800">
            ← Back to Trip
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Trip Readiness</h1>
          <p className="text-gray-600">A quick check on everything before you go.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">
              {readiness.daysUntilDeparture >= 0 ? readiness.daysUntilDeparture : "Started"}
            </div>
            <div className="text-sm opacity-90">{readiness.daysUntilDeparture >= 0 ? "Days until departure" : "Trip in progress"}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{readiness.packingList.length}</div>
            <div className="text-sm opacity-90">Packing items suggested</div>
          </div>

          <div className={`rounded-xl p-6 text-white shadow-lg bg-gradient-to-br ${readiness.unresolvedConflicts > 0 ? "from-red-500 to-red-600" : "from-emerald-500 to-emerald-600"}`}>
            <div className="text-3xl font-bold">{readiness.unresolvedConflicts}</div>
            <div className="text-sm opacity-90">Unresolved weather conflicts</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
            <div className="text-2xl font-bold">
              {readiness.budgetStatus.currency} {readiness.budgetStatus.actual.toFixed(0)}
            </div>
            <div className="text-sm opacity-90">
              of {readiness.budgetStatus.currency} {readiness.budgetStatus.limit || "—"} budget
            </div>
          </div>
        </div>

        {readiness.budgetStatus.limit > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Budget Progress</h2>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${budgetPercent >= 100 ? "bg-red-500" : "bg-primary-600"}`}
                style={{ width: `${budgetPercent}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{budgetPercent}% of budget spent so far</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Packing List</h2>
          {readiness.packingList.length === 0 ? (
            <p className="text-sm text-gray-400">No packing suggestions yet — add coordinates to your itinerary items to get weather-based suggestions.</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {readiness.packingList.map((item, index) => (
                <li key={index} className="flex items-center text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="mr-2">🧳</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
