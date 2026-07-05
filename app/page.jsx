"use client"

import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import TopRegionalCities from "../components/TopRegionalCities"
import { motion } from "framer-motion"
import { Compass, X, Search, Waypoints, Wallet, Users, MapPinned, CalendarClock } from "lucide-react"
import Globe from "../components/waypoint/Globe"

const SHOWCASE_MARKERS = [
  { location: [48.8566, 2.3522] }, // Paris
  { location: [35.6762, 139.6503] }, // Tokyo
  { location: [-8.3405, 115.092] }, // Bali
  { location: [40.7128, -74.006] }, // New York
  { location: [-33.9249, 18.4241] }, // Cape Town
  { location: [-13.1631, -72.545] }, // Machu Picchu
]

const FEATURES = [
  {
    icon: Waypoints,
    title: "Multi-City Itineraries",
    desc: "Easily add and manage multiple destinations with flexible durations, visualize your journey on interactive timelines, and organize each stop with precision.",
  },
  {
    icon: Wallet,
    title: "Smart Budget Planning",
    desc: "Take control of your travel finances with automatic budget estimation, expense tracking, and cost-effective recommendations tailored to your preferences.",
  },
  {
    icon: Users,
    title: "Collaborative Sharing",
    desc: "Share your detailed trip plans with friends and family, collaborate on group adventures, and discover inspiration from other travelers' journeys.",
  },
  {
    icon: MapPinned,
    title: "Destination Discovery",
    desc: "Explore global destinations with personalized recommendations for attractions, activities, and hidden gems tailored to your interests.",
  },
  {
    icon: CalendarClock,
    title: "Interactive Timeline",
    desc: "Visualize your entire journey with interactive timelines and calendars. Get a clear overview of your trip flow and adjust it with ease.",
  },
]

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
      // Filtered browsing is backed by the curated City guide (/api/cities),
      // which has real region/cost/tag fields to filter on - unlike the
      // trip-aggregated /api/destinations/top endpoint.
      let apiUrl = `/api/cities?search=${encodeURIComponent(query)}&limit=6`

      if (sortOption) {
        apiUrl += `&sort=${sortOption}`
      }

      if (filterOptions.continents.length > 0) {
        apiUrl += `&region=${filterOptions.continents.join(',')}`
      }

      if (filterOptions.costLevel) {
        const costMax = { Budget: 4, Moderate: 7, Luxury: 10 }[filterOptions.costLevel]
        if (costMax) apiUrl += `&costMax=${costMax}`
      }

      if (filterOptions.travelStyle) {
        apiUrl += `&tag=${encodeURIComponent(filterOptions.travelStyle.toLowerCase())}`
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
    <div className="min-h-screen bg-parchment">
      {/* Hero Section — built from the Waypoint system itself, not a stock photo */}
      <div className="relative h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {/* Ink/brass chart backdrop with the rotating globe as the visual anchor */}
        <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden mt-2 mx-auto max-w-6xl shadow-3xl bg-gradient-to-br from-ink via-ink to-[#241a10]">
          {/* Faint topographic chart texture */}
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "repeating-radial-gradient(circle at 0 0, transparent 0, transparent 68px, rgba(217,168,86,0.5) 69px, transparent 70px)",
              backgroundSize: "140px 140px",
            }}
          />
          {/* Ambient globe, bleeding off the right edge */}
          <div className="absolute -right-32 top-1/2 hidden -translate-y-1/2 md:block lg:-right-16">
            <Globe markers={SHOWCASE_MARKERS} size={640} />
          </div>
          {/* Ink vignette so text stays legible over the globe/texture */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent md:via-ink/50 md:to-ink/5" />
        </div>

        {/* Hero content with adjusted margins */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 h-full flex flex-col justify-center">
          <div className="text-left text-white my-8 max-w-2xl">
            <p className="flex items-center gap-2 mb-6 font-data text-xs uppercase tracking-widest text-brass-light">
              <span className="h-px w-7 bg-brass-light" />
              GlobeTrotter
            </p>
            <h1 className="font-display italic text-5xl md:text-7xl mb-8 drop-shadow-xl">
              Pack your bags, let&apos;s go<br />
              somewhere amazing
            </h1>
            <p className="text-xl text-white/90 mb-10 max-w-xl drop-shadow-lg">
              Hidden gems, breathtaking views, unforgettable adventures—where will you go next?
            </p>
            <div className="flex mt-4">
              <Link href="/dashboard">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1, delay: 0.1 }}
                  className="group relative inline-flex items-center mt-3 gap-1.5 sm:gap-2 overflow-hidden rounded-full border border-white px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-3 text-xs sm:text-sm md:text-base font-medium text-white transition-transform"
                >
                  <span className="relative z-10 transition-colors duration-500 group-hover:text-ink">
                    Start Planning
                  </span>
                  <span className="relative z-10 flex items-center justify-center">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 bg-ink items-center justify-center rounded-full transition-colors duration-500 group-hover:border-ink">
                      <Compass className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:rotate-45" />
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
      <div className="bg-parchment-raised py-12 shadow-md">
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
      <div className="bg-parchment-raised py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center mb-14">
            <div>
              <p className="mb-3 flex items-center gap-2 font-data text-xs uppercase tracking-widest text-primary-600">
                <span className="h-px w-7 bg-primary-600" />
                Waypoint
              </p>
              <h2 className="text-3xl md:text-4xl text-gray-900 mb-3">Your World, Your Journey</h2>
              <p className="text-lg text-gray-600 max-w-xl">
                GlobeTrotter transforms how you plan travel with intelligent tools for multi-city journeys,
                budget management, and seamless itinerary sharing. Make planning as exciting as the trip itself.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Globe markers={SHOWCASE_MARKERS} size={260} />
              <p className="font-data text-[0.7rem] tracking-wide text-gray-400">Trips planned on GlobeTrotter, worldwide</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-gray-200 bg-parchment p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary-600/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/trips/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-md hover:shadow-lg text-lg font-medium transition-all duration-200"
              >
                Start Planning Your Journey
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}