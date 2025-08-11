"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import Button from "../../../../components/ui/Button_1"
import Input from "../../../../components/ui/Input_1"

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
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

      const response = await fetch(`/api/trips/${params.id}`)
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load trip")
        return
      }
      const data = await response.json()
      setTrip(data.trip)

      // Try to load itinerary from dedicated endpoint
      const itineraryRes = await fetch(`/api/trips/${params.id}/itinerary`)
      if (itineraryRes.ok) {
        const itineraryData = await itineraryRes.json()
        if (Array.isArray(itineraryData.itinerary) && itineraryData.itinerary.length > 0) {
          setSections(itineraryData.itinerary)
          return
        }
      }

      // Fallback: create sections from destinations
      if (data.trip.destinations && data.trip.destinations.length > 0) {
        // Create sections from destinations
        const initialSections = data.trip.destinations.map((dest, index) => ({
          id: `section-${Date.now()}-${index}`,
          title: `Visit ${dest.name}`,
          description: `Explore ${dest.name} and discover its attractions`,
          type: "destination",
          startDate: data.trip.startDate,
          endDate: data.trip.endDate,
          budget: 0,
          location: dest.name,
          coordinates: dest.coordinates,
        }))
        setSections(initialSections)

        // Load activities for destinations
        loadActivitiesForDestinations(data.trip.destinations)
      } else {
        // Create a default section
        setSections([createNewSection(1)])
      }
    } catch (error) {
      console.error("Error fetching trip:", error)
      setError("Failed to load trip data")
    } finally {
      setIsLoading(false)
    }
  }

  // Debounce hook
  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay)
      return () => clearTimeout(handler)
    }, [value, delay])

    return debouncedValue
  }

  const debouncedSearchQuery = useDebounce(searchStates[activeSearchSection] || "", 300)

  const handleImageError = (placeId) => {
    setImageErrors((prev) => new Set([...prev, placeId]))
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

  const selectPlace = (sectionId, place) => {
    console.log("Selecting place:", { sectionId, place })
    updateSection(sectionId, "location", place.name)
    updateSection(sectionId, "coordinates", place.geometry?.location || null)
    // Keep the selected place visible in the input (like create page)
    setSearchStates(prev => ({ ...prev, [sectionId]: place.name }))
    setSearchResults([])
    setActiveSearchSection(null)
    console.log("Updated section with location:", place.name)
  }

  const handleSearchInputChange = (sectionId, value) => {
    setSearchStates(prev => ({ ...prev, [sectionId]: value }))
    setActiveSearchSection(sectionId)
    
    // Only clear location if user completely changes the text (not just typing)
    // This allows editing while keeping the selection
  }

  const handleSearchInputFocus = (sectionId) => {
    setActiveSearchSection(sectionId)
    const currentQuery = searchStates[sectionId] || ""
    const section = sections.find(s => s.id === sectionId)
    
    // If there's a selected location and no search query, show it in search
    if (section?.location && !currentQuery) {
      setSearchStates(prev => ({ ...prev, [sectionId]: section.location }))
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

  const loadActivitiesForDestinations = async (destinations) => {
    setLoadingActivities(true)
    try {
      const allActivities = []

      for (const destination of destinations) {
        const response = await fetch(
          `/api/activities/search?location=${encodeURIComponent(destination.name)}&country=${encodeURIComponent(destination.country || "")}`,
        )

        if (response.ok) {
          const data = await response.json()
          allActivities.push({
            destination: destination.name,
            activities: data.activities || [],
          })
        }
      }

      setSuggestedActivities(allActivities)
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const createNewSection = (index) => ({
    id: `section-${Date.now()}-${index}`,
    title: `Section ${index}`,
    description: "Add details about this part of your trip",
    type: "activity",
    startDate: trip?.startDate || new Date().toISOString().split("T")[0],
    endDate: trip?.endDate || new Date().toISOString().split("T")[0],
    budget: 0,
    location: "",
    coordinates: null,
  })

  const addSection = () => {
    const newSection = createNewSection(sections.length + 1)
    setSections([...sections, newSection])
  }

  const updateSection = (sectionId, field, value) => {
    console.log("Updating section:", { sectionId, field, value })
    setSections((prevSections) => {
      const updated = prevSections.map((section) => 
        section.id === sectionId ? { ...section, [field]: value } : section
      )
      console.log("Updated sections:", updated)
      return updated
    })
  }

  const removeSection = (sectionId) => {
    if (sections.length > 1) {
      setSections(sections.filter((section) => section.id !== sectionId))
    }
  }

  const addActivityToSection = (activity) => {
    // Create a new section with the activity details
    const newSection = {
      id: `section-${Date.now()}-${sections.length + 1}`,
      title: activity.name,
      description: activity.description,
      type: "activity",
      startDate: trip?.startDate || new Date().toISOString().split("T")[0],
      endDate: trip?.endDate || new Date().toISOString().split("T")[0],
      budget: activity.estimatedCost || 0,
      location: activity.location,
      coordinates: activity.coordinates || null,
      duration: activity.duration,
      category: activity.category,
      rating: activity.rating,
    }

    setSections((prevSections) => [...prevSections, newSection])

    // Show success feedback
    alert(`Added "${activity.name}" to your itinerary!`)
  }

  const addActivityToExistingSection = (sectionId, activity) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              title: activity.name,
              description: activity.description,
              budget: activity.estimatedCost || section.budget,
              location: activity.location,
              type: "activity",
            }
          : section,
      ),
    )

    alert(`Updated section with "${activity.name}"!`)
  }

  const saveItinerary = async () => {
    setIsSaving(true)
    setError("")

    try {
      // Validate sections
      const validSections = sections.filter((section) => section.title.trim() && section.startDate && section.endDate)

      if (validSections.length === 0) {
        setError("Please add at least one valid section with title and dates")
        return
      }

      console.log("Saving sections:", validSections)
      console.log("Sections with locations:", sections.map(s => ({ id: s.id, title: s.title, location: s.location, coordinates: s.coordinates })))

      const response = await fetch(`/api/trips/${params.id}/itinerary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itinerary: validSections.map((section) => ({
            ...section,
            startDate: new Date(section.startDate).toISOString(),
            endDate: new Date(section.endDate).toISOString(),
          })),
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save itinerary")
      }

      // Show success and redirect
      alert("Itinerary saved successfully!")
      router.push(`/trips/${params.id}`)
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

  if (error && !trip) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Trip</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Trip Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Build Itinerary</h1>
              <p className="text-lg text-gray-600">{trip?.name}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>
                  {formatDate(trip?.startDate)} - {formatDate(trip?.endDate)}
                </span>
                <span>•</span>
                <span>{trip?.destinations?.length || 0} destinations</span>
                <span>•</span>
                <span>
                  Budget: {trip?.currency} {trip?.budgetLimit || 0}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Itinerary Sections */}
            <div className="space-y-6">
              {sections.map((section, index) => (
                <div key={section.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Day {index + 1}</h2>
                    {sections.length > 1 && (
                      <button onClick={() => removeSection(section.id)} className="text-red-600 hover:text-red-800 p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Section Title */}
                    <div className="md:col-span-2">
                      <Input
                        label="Activity/Section Title"
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, "title", e.target.value)}
                        placeholder="e.g., Visit Eiffel Tower, Hotel Check-in"
                        required
                      />
                    </div>

                    {/* Section Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={section.description}
                        onChange={(e) => updateSection(section.id, "description", e.target.value)}
                        placeholder="Describe what you'll do during this time..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      />
                    </div>

                    {/* Date and Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={formatDate(section.startDate)}
                        onChange={(e) => updateSection(section.id, "startDate", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={formatDate(section.endDate)}
                        onChange={(e) => updateSection(section.id, "endDate", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">{trip?.currency || "$"}</span>
                        <input
                          type="number"
                          value={section.budget}
                          onChange={(e) => updateSection(section.id, "budget", Number.parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    {/* Section Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={section.type}
                        onChange={(e) => updateSection(section.id, "type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="activity">Activity/Sightseeing</option>
                        <option value="accommodation">Hotel/Accommodation</option>
                        <option value="transport">Transportation</option>
                        <option value="meal">Dining/Meal</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Location */}
            <div className="relative">
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
                         setSearchStates(prev => ({ ...prev, [section.id]: "" }))
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

              {/* Click outside to close dropdown */}
              {activeSearchSection === section.id && searchResults.length > 0 && (
                <div className="fixed inset-0 z-5" onClick={() => setActiveSearchSection(null)}></div>
              )}
            </div>

                    {/* Additional Info for Activities */}
                    {section.duration && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                        <input
                          type="text"
                          value={section.duration}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                    )}

                    {section.rating && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <div className="flex items-center">
                          <span className="text-yellow-400 mr-1">★</span>
                          <span className="text-sm font-medium">{section.rating}/5</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Section Button */}
              <div className="text-center">
                <button
                  onClick={addSection}
                  className="inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another Day
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Activities</h3>

              {loadingActivities ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading activities...</p>
                </div>
              ) : suggestedActivities.length > 0 ? (
                <div className="space-y-4">
                  {suggestedActivities.map((destActivities, destIndex) => (
                    <div key={destIndex}>
                      <h4 className="font-medium text-gray-800 mb-2">{destActivities.destination}</h4>
                      <div className="space-y-2">
                        {destActivities.activities.slice(0, 5).map((activity, actIndex) => (
                          <div
                            key={actIndex}
                            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-gray-900 mb-1">{activity.name}</h5>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{activity.description}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-green-600 font-medium">
                                      {trip?.currency} {activity.estimatedCost || "Free"}
                                    </span>
                                    {activity.rating && (
                                      <div className="flex items-center">
                                        <span className="text-yellow-400 text-xs">★</span>
                                        <span className="text-xs text-gray-600 ml-1">{activity.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => addActivityToSection(activity)}
                                      className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded hover:bg-primary-200 transition-colors"
                                      title="Add as new section"
                                    >
                                      + New
                                    </button>
                                    {sections.length > 0 && (
                                      <button
                                        onClick={() =>
                                          addActivityToExistingSection(sections[sections.length - 1].id, activity)
                                        }
                                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                                        title="Update last section"
                                      >
                                        Update
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {activity.duration && (
                                  <p className="text-xs text-gray-500 mt-1">Duration: {activity.duration}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">No activities found for your destinations</p>
                </div>
              )}
            </div>

            {/* Budget Summary */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Budget Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Planned</span>
                  <span className="text-sm font-medium text-gray-900">
                    {trip?.currency} {sections.reduce((total, section) => total + (section.budget || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Budget Limit</span>
                  <span className="text-sm font-medium text-gray-900">
                    {trip?.currency} {trip?.budgetLimit || 0}
                  </span>
                </div>
                <div className="border-t border-green-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Remaining</span>
                    <span
                      className={`text-sm font-bold ${
                        (trip?.budgetLimit || 0) -
                          sections.reduce((total, section) => total + (section.budget || 0), 0) >=
                        0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {trip?.currency}{" "}
                      {(
                        (trip?.budgetLimit || 0) - sections.reduce((total, section) => total + (section.budget || 0), 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}