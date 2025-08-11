"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Button from "./ui/Button_1"

export default function TopRegionalCities() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Updated mapping of cities to their correct file extensions from your file structure
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
  
  // Default extension if not in the mapping
  const defaultExtension = 'jpg';
  
  useEffect(() => {
    const fetchTopDestinations = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/destinations/top?limit=6')
        
        if (!response.ok) {
          throw new Error('Failed to fetch top destinations')
        }
        
        const data = await response.json()
        setDestinations(data.destinations || [])
      } catch (err) {
        console.error('Error fetching top destinations:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTopDestinations()
  }, [])
  
  // Function to get the appropriate image URL with correct extension
  const getCityImageUrl = (destination) => {
    // If destination already has an image, use it
    if (destination.image) {
      return destination.image;
    }
    
    const cityName = destination.name.toLowerCase();
    const extension = cityImageExtensions[cityName] || defaultExtension;
    
    return `/${cityName}.${extension}`;
  }
  
  if (loading) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Popular Destinations</p>
              <h2 className="text-3xl font-bold text-gray-900">Your next favorite place awaits</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="relative rounded-xl overflow-hidden h-72 bg-gray-200 animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Unable to load destinations</h2>
            <p className="text-red-500 mb-6">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-2 rounded-lg"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // If no destinations are available, show fallback destinations
  const displayDestinations = destinations.length > 0 
    ? destinations 
    : [
        {
          name: "Rome",
          country: "Italy",
          count: 12,
        },
        {
          name: "Tokyo",
          country: "Japan",
          count: 15,
        },
        {
          name: "Bali",
          country: "Indonesia",
          count: 14,
        }
      ];
  
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Popular Destinations</p>
            <h2 className="text-3xl font-bold text-gray-900">Your next favorite place awaits</h2>
          </div>
          <div className="flex items-center">
            <p className="text-sm text-gray-500 mr-4 hidden md:block">
              Get the best value for your trips with exclusive discounts, seasonal promotions, and deals to save while exploring the world!
            </p>
            <Link href="/destinations">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 border-none px-5 py-2 rounded-full"
              >
                See All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayDestinations.map((destination, index) => {
            const imageUrl = getCityImageUrl(destination);
            
            return (
              <div 
                key={index} 
                className="group relative rounded-xl overflow-hidden h-72 shadow-lg transition-transform duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all z-10"></div>
                
                {/* City image with specific extension */}
                <img 
                  src={imageUrl}
                  alt={destination.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    // Fallback to a default image if the specific one fails
                    e.target.onerror = null;
                    e.target.src = '/hero-travel.jpg';
                  }}
                  loading="lazy"
                />
                
                <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full z-20">
                  <p className="text-xs font-medium text-gray-700">{destination.count} {destination.count === 1 ? 'Trip' : 'Trips'}</p>
                </div>
                
                <div className="absolute bottom-6 left-6 z-20">
                  <h3 className="text-2xl font-bold text-white drop-shadow-md">{destination.name}</h3>
                  {destination.country && (
                    <p className="text-sm text-white/90 drop-shadow-md">{destination.country}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}