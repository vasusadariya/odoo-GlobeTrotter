"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Button from "@/components/ui/Button_1"

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState("")
  const [countries, setCountries] = useState([])
  
  // City image extensions mapping from your public folder
  const cityImageExtensions = {
    'ahmedabad': 'png',
    'bali': 'png',
    'florence': 'jpg',
    'kyoto': 'png',
    'leh': 'jpg',
    'london': 'png',
    'mumbai': 'jpg',
    'paris': 'png',
    'rajkot': 'jpg',
    'rajula': 'png',
    'rome': 'png',
    'tokyo': 'jpg',
    'valsad': 'jpg'
  };
  
  // Function to get the appropriate image URL with correct extension
  const getCityImageUrl = (destination) => {
    // If destination already has an image, use it
    if (destination.image) {
      return destination.image;
    }
    
    const cityName = destination.name.toLowerCase();
    const extension = cityImageExtensions[cityName] || 'jpg';
    
    return `/${cityName}.${extension}`;
  }
  
  useEffect(() => {
    const fetchTopDestinations = async () => {
      try {
        setLoading(true)
        // Fetch more destinations (limit=20) for the dedicated page
        const url = selectedCountry 
          ? `/api/destinations/top?limit=20&country=${encodeURIComponent(selectedCountry)}`
          : '/api/destinations/top?limit=20'
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Failed to fetch destinations')
        }
        
        const data = await response.json()
        setDestinations(data.destinations || [])

        // Extract unique countries from destinations for filter dropdown
        if (!selectedCountry && data.destinations?.length > 0) {
          const uniqueCountries = [...new Set(
            data.destinations
              .filter(d => d.country)
              .map(d => d.country)
          )].sort()
          
          setCountries(uniqueCountries)
        }
      } catch (err) {
        console.error('Error fetching destinations:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTopDestinations()
  }, [selectedCountry])
  
  // Handle country filter change
  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value)
  }
  
  // Reset filters
  const resetFilters = () => {
    setSelectedCountry("")
  }
  
  if (loading && destinations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Popular Destinations</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover the most beloved travel destinations chosen by our travelers
            </p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Popular Destinations</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover the most beloved travel destinations chosen by our travelers
          </p>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-md mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Country
                </label>
                <select
                  id="country"
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  className="rounded-lg border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              
              {selectedCountry && (
                <button 
                  onClick={resetFilters}
                  className="text-primary-600 hover:text-primary-800 text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear filters
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {destinations.length} destination{destinations.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            <div className="flex">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Grid layout with destinations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {destinations.map((destination, index) => (
            <div 
              key={index}
              className="group bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <div className="relative h-48">
                <img 
                  src={getCityImageUrl(destination)}
                  alt={destination.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    // Fallback to a default image if the specific one fails
                    e.target.onerror = null;
                    e.target.src = '/hero-travel.jpg';
                  }}
                  loading="lazy"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full z-10">
                  <p className="text-xs font-medium text-gray-700">{destination.count} {destination.count === 1 ? 'Trip' : 'Trips'}</p>
                </div>
              </div>
              
              <div className="p-4">
                {/* Make city name a link to search page */}
                <Link href={`/search/cities?q=${encodeURIComponent(destination.name)}`}>
                  <h3 className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors cursor-pointer">
                    {destination.name}
                  </h3>
                </Link>
                
                {destination.country && (
                  <p className="text-sm text-gray-500 mb-3">{destination.country}</p>
                )}
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-500">
                    {destination.count} traveler{destination.count !== 1 ? 's' : ''} chose this destination
                  </span>
                  
                  <Link href={`/search/cities?q=${encodeURIComponent(destination.name)}`}>
                    <Button 
                      variant="outline" 
                      className="text-xs px-3 py-1 bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100"
                    >
                      Explore
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {destinations.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 11V9m0 0L9 7" 
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No destinations found</h3>
            <p className="mt-1 text-gray-500">Try changing your filters or check back later.</p>
            {selectedCountry && (
              <button 
                onClick={resetFilters}
                className="mt-4 text-primary-600 hover:text-primary-800"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Back to home link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center">
        <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-800">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  )
}