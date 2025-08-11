"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import Button from "../../../../components/ui/Button_1"

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

export default function ItineraryBuilderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [trip, setTrip] = useState(null)
  const [sections, setSections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [suggestedActivities, setSuggestedActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [searchStates, setSearchStates] = useState({})
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeSearchSection, setActiveSearchSection] = useState(null)
  const [imageErrors, setImageErrors] = useState(new Set())

  const [globalSearchQuery, setGlobalSearchQuery] = useState("")
  const [globalSearchResults, setGlobalSearchResults] = useState([])
  const [isGlobalSearching, setIsGlobalSearching] = useState(false)
  const [selectedDestinations, setSelectedDestinations] = useState([])

  const debouncedSearchQuery = useDebounce(searchStates[activeSearchSection] || "", 300)
  const debouncedGlobalSearch = useDebounce(globalSearchQuery, 300)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login")
      return
    }

    if (status === "authenticated" && params.id) {
      fetchTripAndItinerary()
    }
  }, [status, params.id])

  const fetchTripAndItinerary = async () => {
    try {
      setIsLoading(true)
      setError("")

      if (!params.id || params.id === "undefined") {
        setError("Invalid trip ID")
        return
      }

      const response = await fetch(`/api/trips/${params.id}/itinerary`)
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

      // Initialize sections from existing itinerary or create default sections
      if (data.itinerary && data.itinerary.length > 0) {
        setSections(
          data.itinerary.map((item, index) => ({
            id: `section-${index}`,
            title: item.title || "",
            description: item.description || "",
            startDate: item.startDate ? new Date(item.startDate).toISOString().split("T")[0] : "",
            endDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : "",
            startTime: item.startTime || "09:00",
            endTime: item.endTime || "17:00",
            location: item.location || "",
            coordinates: item.coordinates || null,
            category: item.category || "activity",
            notes: item.notes || "",
            placeDetails: item.placeDetails || null, // Store complete place data
          })),
        )
      } else {
        // Create initial sections based on trip duration
        const startDate = new Date(data.trip.startDate)
        const endDate = new Date(data.trip.endDate)
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

        const initialSections = []
        for (let i = 0; i < Math.min(daysDiff, 7); i++) {
          const sectionDate = new Date(startDate)
          sectionDate.setDate(startDate.getDate() + i)

          initialSections.push({
            id: `section-${i}`,
            title: `Day ${i + 1}`,
            description: "",
            startDate: sectionDate.toISOString().split("T")[0],
            endDate: sectionDate.toISOString().split("T")[0],
            startTime: "09:00",
            endTime: "17:00",
            location: "",
            coordinates: null,
            category: "activity",
            notes: "",
            placeDetails: null, // Store complete place data
          })
        }
        setSections(initialSections)
      }
    } catch (error) {
      console.error("Error fetching trip:", error)
      setError("Failed to load trip")
    } finally {
      setIsLoading(false)
    }
  }

  const searchPlaces = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setActiveSearchSection(null)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (response.ok) {
        setSearchResults(data.places || [])
      } else {
        setSearchResults([])
      }
    } catch (err) {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    searchPlaces(debouncedSearchQuery)
  }, [debouncedSearchQuery, searchPlaces])

  const searchGlobalPlaces = async (query) => {
    if (!query || query.length < 2) {
      setGlobalSearchResults([])
      return
    }

    setIsGlobalSearching(true)
    try {
      const response = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setGlobalSearchResults(data.places || [])
      }
    } catch (error) {
      console.error("Error searching places:", error)
    } finally {
      setIsGlobalSearching(false)
    }
  }

  const selectGlobalPlace = async (place) => {
    // Get detailed place information
    const placeData = {
      place_id: place.id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: place.geometry,
      rating: place.rating,
      photos: place.photos,
      types: place.types,
      price_level: place.price_level,
    }

    // Check if destination already exists
    const exists = selectedDestinations.some((dest) => dest.place_id === place.id)
    if (!exists) {
      setSelectedDestinations((prev) => [...prev, placeData])
    }

    setGlobalSearchQuery("")
    setGlobalSearchResults([])
  }

  const removeDestination = async (placeId) => {
    setSelectedDestinations((prev) => prev.filter((dest) => dest.place_id !== placeId))

    // Save the updated destinations to the database
    try {
      const updatedDestinations = selectedDestinations.filter((dest) => dest.place_id !== placeId)

      const response = await fetch(`/api/trips/${params.id}/itinerary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sections: sections,
          selectedDestinations: updatedDestinations,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update destinations")
      }
    } catch (error) {
      console.error("Error updating destinations:", error)
      // Revert the UI change if database update fails
      setSelectedDestinations((prev) => [...prev, selectedDestinations.find((dest) => dest.place_id === placeId)])
    }
  }

  const selectPlace = (sectionId, place) => {
    console.log("Selecting place:", { sectionId, place })

    const placeData = {
      name: place.name,
      place_id: place.place_id || place.id,
      formatted_address: place.formatted_address,
      rating: place.rating,
      photos: place.photos ? place.photos.slice(0, 3) : [], // Store up to 3 photos
      geometry: place.geometry,
      types: place.types || [],
      price_level: place.price_level,
      opening_hours: place.opening_hours,
      website: place.website,
      phone: place.formatted_phone_number || place.international_phone_number,
    }

    updateSection(sectionId, "location", place.formatted_address || place.name)
    updateSection(sectionId, "coordinates", place.geometry?.location || null)
    updateSection(sectionId, "placeDetails", placeData) // Store complete place data

    // Keep the selected place visible in the input (like create page)
    setSearchStates((prev) => ({ ...prev, [sectionId]: place.name }))
    setSearchResults([])
    setActiveSearchSection(null)
    console.log("Updated section with complete place data:", placeData)
  }

  const handleSearchInputChange = (sectionId, value) => {
    setSearchStates((prev) => ({ ...prev, [sectionId]: value }))
    setActiveSearchSection(sectionId)

    // Only clear location if user completely changes the text (not just typing)
    // This allows editing while keeping the selection
  }

  const handleSearchInputFocus = (sectionId) => {
    setActiveSearchSection(sectionId)
    const currentQuery = searchStates[sectionId] || ""
    const section = sections.find((s) => s.id === sectionId)

    // If there's a selected location and no search query, show it in search
    if (section?.location && !currentQuery) {
      setSearchStates((prev) => ({ ...prev, [sectionId]: section.location }))
    }

    if (currentQuery.length >= 2) {
      searchPlaces(currentQuery)
    }
  }

  const handleSearchInputBlur = () => {
    // Keep dropdown open briefly to allow clicking on results
    setTimeout(() => {
      setActiveSearchSection(null)
      setSearchResults([])
    }, 200)
  }

  const handleImageError = (placeId) => {
    setImageErrors((prev) => new Set([...prev, placeId]))
  }

  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "17:00",
      location: "",
      coordinates: null,
      category: "activity",
      notes: "",
      placeDetails: null, // Store complete place data
    }
    setSections([...sections, newSection])
  }

  const removeSection = (sectionId) => {
    setSections(sections.filter((section) => section.id !== sectionId))
    // Clean up search state
    setSearchStates((prev) => {
      const newState = { ...prev }
      delete newState[sectionId]
      return newState
    })
  }

  const updateSection = (sectionId, field, value) => {
    setSections(sections.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)))
  }

  const moveSection = (sectionId, direction) => {
    const currentIndex = sections.findIndex((section) => section.id === sectionId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sections.length) return

    const newSections = [...sections]
    const [movedSection] = newSections.splice(currentIndex, 1)
    newSections.splice(newIndex, 0, movedSection)
    setSections(newSections)
  }

  const saveItinerary = async () => {
    setIsSaving(true)
    setError("")

    try {
      const itineraryData = {
        sections: sections.map((section) => ({
          ...section,
          // Preserve all place data including coordinates and placeDetails
          placeDetails: section.placeDetails,
          coordinates: section.coordinates,
        })),
        selectedDestinations: selectedDestinations,
      }

      console.log("Saving itinerary with sections:", itineraryData.sections)
      console.log("Saving selected destinations:", selectedDestinations)

      const response = await fetch(`/api/trips/${params.id}/itinerary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itineraryData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save itinerary")
      }

      // Show success and redirect to itinerary view (flowchart)
      alert("Itinerary saved successfully!")
      router.replace(`/trips/${params.id}/itinerary/view`)
    } catch (error) {
      console.error("Save error:", error)
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toISOString().split("T")[0]
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading itinerary builder...</p>
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

  if (!trip) {
    return null
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Build Itinerary</h1>
                <p className="text-gray-600">Plan your trip to {trip.destinations?.[0]?.name || "your destinations"}</p>
              </div>
              <Button onClick={addSection} variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Section
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Destinations</h3>

              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search for destinations, cities, or countries..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {isGlobalSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  </div>
                )}

                {/* Global Search Results Dropdown */}
                {globalSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {globalSearchResults.map((place) => (
                      <div
                        key={place.id}
                        onClick={() => selectGlobalPlace(place)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          {place.photos?.[0] && (
                            <img
                              src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photoreference=${place.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`}
                              alt={place.name}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.style.display = "none"
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{place.name}</h4>
                            <p className="text-sm text-gray-600">{place.formatted_address}</p>
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

              {/* Selected Destinations */}
              {selectedDestinations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Selected Destinations</h4>
                  <div className="space-y-2">
                    {selectedDestinations.map((destination) => (
                      <div
                        key={destination.place_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {destination.photos?.[0] && (
                            <img
                              src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photoreference=${destination.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`}
                              alt={destination.name}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.style.display = "none"
                              }}
                            />
                          )}
                          <div>
                            <h5 className="font-medium text-gray-900">{destination.name}</h5>
                            <p className="text-sm text-gray-600">{destination.formatted_address}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeDestination(destination.place_id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerary Sections */}
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Section {index + 1}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => moveSection(section.id, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveSection(section.id, "down")}
                          disabled={index === sections.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeSection(section.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          placeholder="e.g., Visit Eiffel Tower"
                          value={section.title}
                          onChange={(e) => updateSection(section.id, "title", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={section.category}
                          onChange={(e) => updateSection(section.id, "category", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="activity">Activity</option>
                          <option value="accommodation">Accommodation</option>
                          <option value="transport">Transport</option>
                          <option value="meal">Dining/Meal</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="relative mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search Destinations</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for destinations, cities, or countries..."
                          value={searchStates[section.id] || section.location || ""}
                          onChange={(e) => handleSearchInputChange(section.id, e.target.value)}
                          onFocus={() => handleSearchInputFocus(section.id)}
                          onBlur={handleSearchInputBlur}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        {section.location && (
                          <div className="mt-2 text-sm text-gray-600 flex items-center">
                            <span className="truncate">Selected: {section.location}</span>
                            <button
                              type="button"
                              className="ml-2 text-red-600 hover:text-red-800"
                              onClick={() => {
                                updateSection(section.id, "location", "")
                                updateSection(section.id, "coordinates", null)
                                updateSection(section.id, "placeDetails", null) // Clear place details
                                setSearchStates((prev) => ({ ...prev, [section.id]: "" }))
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        )}
                        {isSearching && activeSearchSection === section.id && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                          </div>
                        )}

                        {/* Search Results Dropdown */}
                        {activeSearchSection === section.id && searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map((place) => (
                              <div
                                key={place.id}
                                onClick={() => selectPlace(section.id, place)}
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
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={section.startDate}
                            onChange={(e) => updateSection(section.id, "startDate", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                          <input
                            type="time"
                            value={section.startTime}
                            onChange={(e) => updateSection(section.id, "startTime", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                          <input
                            type="date"
                            value={section.endDate}
                            onChange={(e) => updateSection(section.id, "endDate", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                          <input
                            type="time"
                            value={section.endTime}
                            onChange={(e) => updateSection(section.id, "endTime", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        placeholder="Add details about this activity..."
                        rows={3}
                        value={section.description}
                        onChange={(e) => updateSection(section.id, "description", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        placeholder="Any additional notes or reminders..."
                        rows={2}
                        value={section.notes}
                        onChange={(e) => updateSection(section.id, "notes", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      />
                    </div>
                  </div>
                ))}

                {sections.length === 0 && (
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
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No sections yet</h3>
                    <p className="text-gray-600 mb-4">Start building your itinerary by adding your first section.</p>
                    <Button onClick={addSection}>Add First Section</Button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Link href={`/trips/${params.id}`}>
                <Button variant="outline" disabled={isSaving}>
                  Back to Trip
                </Button>
              </Link>

              <div className="flex space-x-4">
                <Button
                  onClick={saveItinerary}
                  loading={isSaving}
                  disabled={isSaving || sections.length === 0}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  {isSaving ? "Saving..." : "Save Itinerary"}
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar - Suggested Activities */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Overview</h3>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Trip:</span>
                  <p className="text-gray-600">{trip.name}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Dates:</span>
                  <p className="text-gray-600">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Destinations:</span>
                  <div className="mt-1 space-y-1">
                    {trip.destinations?.map((dest, index) => (
                      <p key={index} className="text-gray-600">
                        • {dest.name}
                        {dest.country ? `, ${dest.country}` : ""}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Budget:</span>
                  <p className="text-gray-600">
                    {trip.currency} {trip.budgetLimit || "Not set"}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-700 mb-3">Quick Tips</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Add specific locations to get better recommendations</li>
                  <li>• Include travel time between activities</li>
                  <li>• Set realistic timeframes for each activity</li>
                  <li>• Consider meal breaks and rest periods</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
