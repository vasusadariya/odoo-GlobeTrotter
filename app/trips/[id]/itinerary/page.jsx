"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Plane, Car } from "lucide-react"
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

  const [routePreview, setRoutePreview] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  const debouncedSearchQuery = useDebounce(searchStates[activeSearchSection] || "", 300)
  const waypointsKey = JSON.stringify(
    sections.filter((s) => s.coordinates).map((s) => ({ name: s.location || s.title, coordinates: s.coordinates })),
  )
  const debouncedWaypointsKey = useDebounce(waypointsKey, 500)

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login")
      return
    }

    if (status === "authenticated" && params.id) {
      fetchTripAndItinerary()
    }
  }, [status, params.id])

  useEffect(() => {
    const waypoints = JSON.parse(debouncedWaypointsKey || "[]")

    if (waypoints.length < 2 || !params.id || params.id === "undefined") {
      setRoutePreview(null)
      return
    }

    const fetchPreview = async () => {
      setIsLoadingPreview(true)
      try {
        const response = await fetch(`/api/trips/${params.id}/route-preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waypoints }),
        })
        if (response.ok) {
          setRoutePreview(await response.json())
        }
      } catch (error) {
        console.error("Error fetching route preview:", error)
      } finally {
        setIsLoadingPreview(false)
      }
    }

    fetchPreview()
  }, [debouncedWaypointsKey, params.id])

  const searchPlaces = useCallback(async (query, sectionId) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Using the correct query parameter 'q' as expected by the API
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.places || [])
      } else {
        console.error("Search error:", data)
        setSearchResults([])
      }
    } catch (err) {
      console.error("Search error:", err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const selectPlace = (sectionId, place) => {
    // Simplify place data structure without photos
    const placeData = {
      name: place.name,
      place_id: place.place_id || place.id,
      formatted_address: place.formatted_address,
      rating: place.rating,
      geometry: place.geometry,
      types: place.types || [],
      price_level: place.price_level
    };

    // Update the section state with the selected place
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              location: place.formatted_address || place.name,
              coordinates: place.geometry?.location || null,
              placeDetails: placeData
            }
          : section
      )
    );

    // Update the search input to show the selected place name
    setSearchStates(prev => ({ ...prev, [sectionId]: place.name }));

    // Clear search results and active section
    setSearchResults([]);
    setActiveSearchSection(null);
  }

  const handleSearchInputChange = (sectionId, value) => {
    // If user is typing and there was a previously selected location, clear it
    const section = sections.find((s) => s.id === sectionId)
    if (section?.location && section.location !== value) {
      // Clear the old location data when user starts typing something new
      setSections(prevSections => 
        prevSections.map(s => 
          s.id === sectionId 
            ? {
                ...s,
                location: "",
                coordinates: null,
                placeDetails: null
              }
            : s
        )
      );
    }
    
    setSearchStates((prev) => ({ ...prev, [sectionId]: value }))
    setActiveSearchSection(sectionId)
    
    // Clear search results if input is empty
    if (!value || value.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // Directly trigger search for immediate feedback when typing
    searchPlaces(value, sectionId);
  }

  const handleSearchInputFocus = (sectionId) => {
    setActiveSearchSection(sectionId)
    const currentQuery = searchStates[sectionId] || ""
    const section = sections.find((s) => s.id === sectionId)

    // If there's a selected location and no search query, show it in search
    if (section?.location && !currentQuery) {
      setSearchStates((prev) => ({ ...prev, [sectionId]: section.location }))
      // Don't search immediately when focusing on existing location
    } else if (currentQuery.length >= 2) {
      // Immediately search with existing query
      searchPlaces(currentQuery, sectionId)
    }
  }

  const handleSearchInputBlur = () => {
    // Keep dropdown open briefly to allow clicking on results
    setTimeout(() => {
      setActiveSearchSection(null)
      setSearchResults([])
    }, 300)
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
      }

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
                          aria-label="Move section up"
                          title="Move section up"
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveSection(section.id, "down")}
                          disabled={index === sections.length - 1}
                          aria-label="Move section down"
                          title="Move section down"
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeSection(section.id)}
                          aria-label="Remove section"
                          title="Remove section"
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
                            <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="truncate text-green-800">Selected: {section.location}</span>
                              <button
                                type="button"
                                className="ml-2 text-red-600 hover:text-red-800"
                                onClick={() => {
                                  // Use the same pattern as in selectPlace for consistency
                                  setSections(prevSections => 
                                    prevSections.map(s => 
                                      s.id === section.id 
                                        ? {
                                            ...s,
                                            location: "",
                                            coordinates: null,
                                            placeDetails: null
                                          }
                                        : s
                                    )
                                  );
                                  setSearchStates((prev) => ({ ...prev, [section.id]: "" }));
                                }}
                              >
                                Clear
                              </button>
                            </div>
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
                            <div className="p-2 text-sm text-gray-600 border-b border-gray-100">
                              {searchResults.length} results found
                            </div>
                            {searchResults.map((place) => (
                              <div
                                key={place.id || place.place_id}
                                onMouseDown={(e) => {
                                  // Use onMouseDown to prevent blur from closing dropdown before click
                                  e.preventDefault();
                                  selectPlace(section.id, place);
                                }}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
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

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-700 mb-3">Route Preview</h4>
                {isLoadingPreview ? (
                  <p className="text-sm text-gray-400">Calculating route...</p>
                ) : routePreview && (routePreview.flightLegCount > 0 || routePreview.carLegCount > 0) ? (
                  <div className="text-sm text-gray-600 space-y-1">
                    {routePreview.flightLegCount > 0 && (
                      <p className="flex items-center gap-1.5"><Plane className="w-3.5 h-3.5 text-primary-600" /> {routePreview.flightLegCount} flight leg{routePreview.flightLegCount === 1 ? "" : "s"} · {routePreview.totalFlightKm.toFixed(0)} km</p>
                    )}
                    {routePreview.carLegCount > 0 && (
                      <p className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-primary-600" /> {routePreview.carLegCount} drive leg{routePreview.carLegCount === 1 ? "" : "s"} · {routePreview.totalCarKm.toFixed(0)} km</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Estimated CO₂: {routePreview.estimatedCO2Kg.toFixed(1)} kg</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Add locations to two or more sections to preview your route.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
