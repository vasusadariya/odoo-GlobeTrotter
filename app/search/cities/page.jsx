"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Button from "../../../components/ui/Button_1"

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function CitySearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = searchParams.get("tripId")

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [imageErrors, setImageErrors] = useState(new Set())

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Handle image loading errors
  const handleImageError = (placeId) => {
    setImageErrors((prev) => new Set([...prev, placeId]))
  }

  // Search cities function
  const searchCities = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.places || [])
      } else {
        console.error("Search error:", data.error)
        setSearchResults([])
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    searchCities(debouncedSearchQuery)
  }, [debouncedSearchQuery, searchCities])

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  const addCityToTrip = async (city) => {
    if (!tripId) {
      alert("No trip selected. Please select a trip first.")
      return
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/destinations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: city.name,
          country: city.formatted_address.split(", ").pop(),
          coordinates: city.geometry?.location,
          placeId: city.id,
        }),
      })

      if (response.ok) {
        alert(`${city.name} added to your trip!`)
      } else {
        alert("Failed to add city to trip")
      }
    } catch (error) {
      console.error("Error adding city:", error)
      alert("Failed to add city to trip")
    }
  }

  const countries = [...new Set(searchResults.map((place) => place.formatted_address.split(", ").pop()))].filter(
    Boolean,
  )

  const filteredResults = searchResults.filter((place) => {
    const placeCountry = place.formatted_address.split(", ").pop()
    return !selectedCountry || placeCountry === selectedCountry
  })

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">City Search</h1>
          <p className="text-lg text-gray-600">
            Find and add cities to your trip with info like country, cost index, and popularity
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Cities</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for cities, countries, or destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Search Results ({filteredResults.length})</h2>
              {tripId && <div className="text-sm text-gray-600">Adding to Trip ID: {tripId}</div>}
            </div>

            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResults.map((city) => (
                  <div
                    key={city.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    {/* City Image */}
                    <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-gray-200">
                      {city.photos && city.photos[0] && !imageErrors.has(city.id) ? (
                        <img
                          src={city.photos[0].url || "/placeholder.svg"}
                          alt={city.name}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(city.id)}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-400"
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
                        </div>
                      )}
                    </div>

                    {/* City Info */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{city.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{city.formatted_address}</p>

                      {/* Meta Info */}
                      <div className="space-y-2">
                        {city.rating && (
                          <div className="flex items-center text-sm">
                            <span className="text-yellow-400 mr-1">★</span>
                            <span className="text-gray-700">{city.rating} rating</span>
                          </div>
                        )}

                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          {city.formatted_address.split(", ").pop()}
                        </div>

                        {/* Mock cost index and popularity */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600">Cost Index: Medium</span>
                          <span className="text-blue-600">Popular</span>
                        </div>
                      </div>
                    </div>

                    {/* Add to Trip Button */}
                    <Button onClick={() => addCityToTrip(city)} className="w-full" size="sm" disabled={!tripId}>
                      {tripId ? "Add to Trip" : "Select Trip First"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No cities found</h3>
                <p className="text-gray-600">Try searching with different keywords</p>
              </div>
            )}
          </div>
        )}

        {/* Popular Destinations */}
        {searchQuery.length < 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Popular Destinations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Paris", country: "France", image: "🇫🇷", rating: 4.5, cost: "High" },
                { name: "Tokyo", country: "Japan", image: "🇯🇵", rating: 4.7, cost: "High" },
                { name: "New York", country: "USA", image: "🇺🇸", rating: 4.6, cost: "Very High" },
                { name: "London", country: "UK", image: "🇬🇧", rating: 4.4, cost: "High" },
                { name: "Barcelona", country: "Spain", image: "🇪🇸", rating: 4.5, cost: "Medium" },
                { name: "Bangkok", country: "Thailand", image: "🇹🇭", rating: 4.3, cost: "Low" },
                { name: "Rome", country: "Italy", image: "🇮🇹", rating: 4.4, cost: "Medium" },
                { name: "Dubai", country: "UAE", image: "🇦🇪", rating: 4.6, cost: "High" },
              ].map((destination, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{destination.image}</div>
                    <h3 className="font-semibold text-gray-900">{destination.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{destination.country}</p>
                    <div className="flex items-center justify-center text-sm mb-2">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span>{destination.rating}</span>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded-full ${
                        destination.cost === "Low"
                          ? "bg-green-100 text-green-800"
                          : destination.cost === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : destination.cost === "High"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {destination.cost} Cost
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
