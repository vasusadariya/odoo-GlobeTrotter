"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import Link from "next/link"
import Button from "../../../components/ui/Button_1"
import Input from "../../../components/ui/Input_1"

// Currency options
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
]

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

export default function CreateTripPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedDestinations, setSelectedDestinations] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [imageErrors, setImageErrors] = useState(new Set())
  const [coverImagePreview, setCoverImagePreview] = useState(null)
  const [recommendedDestinations, setRecommendedDestinations] = useState([])

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      privacy: "private",
      status: "draft",
      currency: "USD",
      budgetLimit: 1000,
    },
  })

  const watchedStartDate = watch("startDate")
  const watchedCurrency = watch("currency")

  // Fetch recommended destinations based on user profile
  useEffect(() => {
    if (session?.user) {
      fetchRecommendedDestinations()
    }
  }, [session])

  const fetchRecommendedDestinations = async () => {
    try {
      const response = await fetch("/api/destinations/recommended")
      if (response.ok) {
        const data = await response.json()
        setRecommendedDestinations(data.destinations || [])
      }
    } catch (error) {
      console.error("Error fetching recommended destinations:", error)
    }
  }

  // Handle image loading errors
  const handleImageError = (placeId) => {
    setImageErrors((prev) => new Set([...prev, placeId]))
  }

  // Handle cover image upload
  const handleCoverImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        alert("File size must be less than 5MB. Please choose a smaller image.")
        event.target.value = "" // Clear the input
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Search places function
  const searchPlaces = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.places || [])
        setShowDropdown(true)
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
    searchPlaces(debouncedSearchQuery)
  }, [debouncedSearchQuery, searchPlaces])

  // Authentication checks
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

  if (!session) {
    router.replace("/auth/login")
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const selectPlace = (place) => {
    const destination = {
      id: place.id,
      name: place.name,
      formatted_address: place.formatted_address,
      coordinates: place.geometry?.location,
      placeId: place.id,
      activities: [],
    }

    // Check if destination already exists
    const exists = selectedDestinations.some((dest) => dest.placeId === place.id)
    if (!exists) {
      setSelectedDestinations([...selectedDestinations, destination])
    }

    // Clear search
    setSearchQuery("")
    setSearchResults([])
    setShowDropdown(false)
  }

  const removeDestination = (destinationId) => {
    setSelectedDestinations(selectedDestinations.filter((dest) => dest.id !== destinationId))
  }

  const getCurrencySymbol = (currencyCode) => {
    const currency = CURRENCIES.find((c) => c.code === currencyCode)
    return currency ? currency.symbol : "$"
  }

  const onSubmit = async (data) => {
    if (selectedDestinations.length === 0) {
      setError("Please select at least one destination")
      return
    }

    if (!data.budgetLimit || data.budgetLimit <= 0) {
      setError("Please enter a valid budget limit")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const tripData = {
        ...data,
        budgetLimit: Number.parseFloat(data.budgetLimit),
        destinations: selectedDestinations.map((dest) => ({
          name: dest.name,
          country: dest.formatted_address.split(", ").pop(),
          coordinates: dest.coordinates,
          placeId: dest.placeId,
          activities: dest.activities,
        })),
      }

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create trip")
      }

      router.replace(`/trips/${result.trip.id}`)
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Trip</h1>
          <p className="text-gray-600 mb-8">
            Form to initiate a new trip by providing a name, travel dates, and a description
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Cover Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo Upload (Optional)</label>
              <div className="relative">
                <input
                  type="file"
                  id="coverImage"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="coverImage"
                  className="cursor-pointer block w-full h-48 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 transition-colors"
                >
                  {coverImagePreview ? (
                    <img
                      src={coverImagePreview || "/placeholder.svg"}
                      alt="Cover preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm">Click to upload a cover photo</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Trip Name, Start & End Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Trip Name"
                type="text"
                placeholder="e.g., Summer Adventure in Europe"
                {...register("name", {
                  required: "Trip name is required",
                  minLength: {
                    value: 3,
                    message: "Trip name must be at least 3 characters",
                  },
                })}
                error={errors.name?.message}
              />

              <Input
                label="Start Date"
                type="date"
                {...register("startDate", {
                  required: "Start date is required",
                })}
                error={errors.startDate?.message}
              />

              <Input
                label="End Date"
                type="date"
                {...register("endDate", {
                  required: "End date is required",
                  validate: (value) => {
                    if (watchedStartDate && new Date(value) < new Date(watchedStartDate)) {
                      return "End date cannot be before start date"
                    }
                    return true
                  },
                })}
                error={errors.endDate?.message}
              />
            </div>

            {/* Budget and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  {...register("currency", { required: "Currency is required" })}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
                {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Limit</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">{getCurrencySymbol(watchedCurrency)}</span>
                  <input
                    type="number"
                    placeholder="1000"
                    min="1"
                    step="0.01"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    {...register("budgetLimit", {
                      required: "Budget limit is required",
                      min: { value: 1, message: "Budget must be at least 1" },
                    })}
                  />
                </div>
                {errors.budgetLimit && <p className="mt-1 text-sm text-red-600">{errors.budgetLimit.message}</p>}
              </div>
            </div>

            {/* Trip Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trip Description</label>
              <textarea
                placeholder="Describe your trip plans, what you're excited about, or any special notes..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                {...register("description")}
              />
            </div>

            {/* Recommended Destinations */}
            {recommendedDestinations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended for You</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {recommendedDestinations.slice(0, 6).map((destination) => (
                    <div
                      key={destination.id}
                      onClick={() => selectPlace(destination)}
                      className="cursor-pointer p-4 border border-gray-200 rounded-xl hover:border-primary-400 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-primary-600"
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
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{destination.name}</h4>
                          <p className="text-sm text-gray-600 truncate">{destination.country}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Destination Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Destinations</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for destinations, cities, or countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  </div>
                )}

                {/* Search Results Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((place) => (
                      <div
                        key={place.id}
                        onClick={() => selectPlace(place)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 flex-shrink-0">
                            {place.photos && place.photos[0] && !imageErrors.has(place.id) ? (
                              <img
                                src={place.photos[0].url || "/placeholder.svg"}
                                alt={place.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 object-cover rounded-lg"
                                onError={() => handleImageError(place.id)}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-gray-400"
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
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{place.name}</h4>
                            <p className="text-sm text-gray-600 truncate">{place.formatted_address}</p>
                            {place.rating && (
                              <div className="flex items-center mt-1">
                                <span className="text-yellow-400">★</span>
                                <span className="text-sm text-gray-600 ml-1">{place.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Click outside to close dropdown */}
              {showDropdown && <div className="fixed inset-0 z-5" onClick={() => setShowDropdown(false)}></div>}
            </div>

            {/* Selected Destinations */}
            {selectedDestinations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Destinations</h3>
                <div className="space-y-3">
                  {selectedDestinations.map((destination) => (
                    <div
                      key={destination.id}
                      className="flex items-center justify-between bg-primary-50 p-4 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{destination.name}</h4>
                        <p className="text-sm text-gray-600 truncate">{destination.formatted_address}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDestination(destination.id)}
                        className="text-red-600 hover:text-red-800 ml-4 flex-shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Settings</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...register("privacy")}
              >
                <option value="private">Private - Only you can see</option>
                <option value="shared">Shared - Share with specific people</option>
                <option value="public">Public - Anyone can discover</option>
              </select>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-4">
              <Link href="/dashboard">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={isLoading} disabled={isLoading}>
                Save Trip
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
