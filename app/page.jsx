"use client"

import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import TopRegionalCities from "../components/TopRegionalCities"
import { motion } from "framer-motion"
import { Plane, X, Search } from "lucide-react"
import Footer from "../components/Footer"
import dynamic from "next/dynamic"

const WorldMap = dynamic(() => import("../components/ui/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[2/1] bg-gray-100 rounded-lg animate-pulse"></div>
  ),
})

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Filter and sort states
  const [showFilters, setShowFilters] = useState(false)
  const [sortOption, setSortOption] = useState("popular") // popular, alphabetical, recent

  // Filter options state
  const [filterOptions, setFilterOptions] = useState({
    continents: [],
    costLevel: null,
    travelStyle: null
  })

  const continentOptions = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania"]
  const costOptions = ["Budget", "Moderate", "Luxury"]
  const travelStyleOptions = ["Adventure", "Relaxation", "Cultural", "Family", "Solo"]

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

  const debouncedSearchQuery = useDebounce(searchQuery, 400)

  const searchDestinations = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      // Add filter and sort parameters to the API call
      let apiUrl = `/api/destinations/top?search=${encodeURIComponent(query)}&limit=6`

      // Add sort parameter
      if (sortOption) {
        apiUrl += `&sort=${sortOption}`
      }

      // Add filter parameters
      if (filterOptions.continents.length > 0) {
        apiUrl += `&continents=${filterOptions.continents.join(',')}`
      }

      if (filterOptions.costLevel) {
        apiUrl += `&cost=${filterOptions.costLevel}`
      }

      if (filterOptions.travelStyle) {
        apiUrl += `&style=${filterOptions.travelStyle}`
      }

      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResults(data.destinations || [])
      setShowResults(true)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [sortOption, filterOptions])

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    searchDestinations(debouncedSearchQuery)
  }, [debouncedSearchQuery, searchDestinations])

  // Add a function to handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim().length >= 2) {
      window.location.href = `/search/cities?q=${encodeURIComponent(searchQuery)}`
    }
  }

  // Handle filter toggles
  const toggleContinent = (continent) => {
    setFilterOptions(prev => {
      const newContinents = prev.continents.includes(continent)
        ? prev.continents.filter(c => c !== continent)
        : [...prev.continents, continent]

      return {
        ...prev,
        continents: newContinents
      }
    })
  }

  const setCostLevel = (cost) => {
    setFilterOptions(prev => ({
      ...prev,
      costLevel: prev.costLevel === cost ? null : cost
    }))
  }

  const setTravelStyle = (style) => {
    setFilterOptions(prev => ({
      ...prev,
      travelStyle: prev.travelStyle === style ? null : style
    }))
  }

  // Reset all filters
  const resetFilters = () => {
    setFilterOptions({
      continents: [],
      costLevel: null,
      travelStyle: null
    })
    setSortOption("popular")
  }

  // Check if any filters are applied
  const hasActiveFilters = filterOptions.continents.length > 0 ||
    filterOptions.costLevel !== null ||
    filterOptions.travelStyle !== null ||
    sortOption !== "popular"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section with Image and Curved Borders */}
      <div className="relative h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {/* Image Background with overlay - curved borders */}
        <div className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden mt-2 mx-auto max-w-6xl shadow-3xl">
          <Image
            src="/hero-travel.jpg"
            alt="Travel Landscape"
            fill
            priority
            className="object-cover"
          />
          {/* Gradient overlay to enhance text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent"></div>
        </div>

        {/* Hero content with adjusted margins */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 h-full flex flex-col justify-center">
          <div className="text-center text-white my-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 drop-shadow-xl">
              Pack your bags, let&apos;s go<br />
              <span className="text-white">somewhere amazing</span>
            </h1>
            <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto drop-shadow-lg">
              Hidden gems, breathtaking views, unforgettable adventures—where will you go next?
            </p>
            <div className="flex justify-center mt-4">
              <Link href="/dashboard">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1, delay: 0.1 }}
                  className="group relative inline-flex items-center mt-3 gap-1.5 sm:gap-2 overflow-hidden rounded-full border border-white px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-3 text-xs sm:text-sm md:text-base font-medium text-white transition-transform"
                >
                  <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                    Book Now
                  </span>
                  <span className="relative z-10 flex items-center justify-center">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 bg-black items-center justify-center rounded-full transition-colors duration-500 group-hover:border-black">
                      <Plane className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-2" />
                    </span>
                  </span>
                  <div className="absolute left-0 top-0 h-full w-full -translate-x-full transform bg-white transition-transform duration-500 group-hover:translate-x-0" />
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section - Centered and Styled like TopRegionalCities */}
      <div className="bg-white py-12 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Discover Your Next Destination</h2>
            <p className="text-lg text-gray-600">Search thousands of destinations around the world</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-5 py-4 pl-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                  placeholder="Search destinations, activities, or experiences..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
                >
                  {isSearching ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-700">Search Results</h3>
                        <button
                          type="button"
                          onClick={() => setShowResults(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <ul className="py-2">
                      {searchResults.map((destination, index) => (
                        <li key={index}>
                          <Link
                            href={`/search/cities?q=${encodeURIComponent(destination.name)}`}
                            className="flex items-center px-4 py-3 hover:bg-gray-50"
                            onClick={() => setShowResults(false)}
                          >
                            <div className="h-10 w-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 mr-3">
                              {destination.image ? (
                                <img
                                  src={destination.image}
                                  alt={destination.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600">
                                  {destination.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{destination.name}</p>
                              <p className="text-xs text-gray-500">{destination.country} • {destination.count} {destination.count === 1 ? 'Trip' : 'Trips'}</p>
                            </div>
                          </Link>
                        </li>
                      ))}

                      <li className="px-4 py-2 border-t border-gray-100">
                        <Link
                          href={`/search/cities?q=${encodeURIComponent(searchQuery)}`}
                          className="text-sm text-primary-600 hover:text-primary-800 flex items-center justify-center"
                          onClick={() => setShowResults(false)}
                        >
                          View all results
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

            </form>
          </div>
        </div>

        {/* Click outside to close results */}
        {showResults && (
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setShowResults(false)}
          ></div>
        )}
      </div>

      {/* Top Regional Cities - Using the component */}
      <TopRegionalCities />
      {/* World Map Feature Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Your World, Your Journey</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              GlobeTrotter transforms how you plan travel with intelligent tools for multi-city journeys,
              budget management, and seamless itinerary sharing. Make planning as exciting as the trip itself.
            </p>
          </div>
          {/* <div className="mb-12">
  <WorldMap
    dots={[
      {
        start: { lat: 40.7128, lng: -74.0060 }, // New York
        end: { lat: 48.8566, lng: 2.3522 }, // Paris
      },
      {
        start: { lat: 48.8566, lng: 2.3522 }, // Paris
        end: { lat: 41.9028, lng: 12.4964 }, // Rome
      },
      {
        start: { lat: 41.9028, lng: 12.4964 }, // Rome
        end: { lat: 35.6762, lng: 139.6503 }, // Tokyo
      },
      {
        start: { lat: 35.6762, lng: 139.6503 }, // Tokyo
        end: { lat: -33.8688, lng: 151.2093 }, // Sydney
      },
      {
        start: { lat: 37.7749, lng: -122.4194 }, // San Francisco
        end: { lat: 19.4326, lng: -99.1332 }, // Mexico City
      },
      {
        start: { lat: 19.4326, lng: -99.1332 }, // Mexico City
        end: { lat: -13.1631, lng: -72.5450 }, // Machu Picchu
      },
    ]}
  />
</div> */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 11V9m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-City Itineraries</h3>
              <p className="text-gray-600">
                Easily add and manage multiple destinations with flexible durations, visualize your journey on interactive
                timelines, and organize each stop with precision.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Budget Planning</h3>
              <p className="text-gray-600">
                Take control of your travel finances with automatic budget estimation, expense tracking, and
                cost-effective recommendations tailored to your preferences.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaborative Sharing</h3>
              <p className="text-gray-600">
                Share your detailed trip plans with friends and family, collaborate on group adventures, and
                discover inspiration from other travelers' journeys.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Destination Discovery</h3>
              <p className="text-gray-600">
                Explore global destinations with personalized recommendations for attractions, activities, and hidden gems.
                Find the perfect experiences based on your interests and travel style.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Timeline</h3>
              <p className="text-gray-600">
                Visualize your entire journey with interactive timelines and calendars. Get a clear overview of your trip flow and
                make adjustments with simple drag-and-drop interfaces.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/trips/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full shadow-md hover:shadow-lg text-lg font-medium transition-all duration-200"
              >
                Start Planning Your Journey
              </motion.button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer - Using the new component */}
      <Footer />
    </div>
  )
}