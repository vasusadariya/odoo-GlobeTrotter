"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import Button from "../ui/Button_1"
import { useState, useEffect } from "react"
import { MapPin } from "lucide-react"

export default function Header() {
  const { data: session, status } = useSession()
  const [location, setLocation] = useState({
    loading: true,
    error: null,
    data: null
  })

  // Function to get user's location
  const getLocation = async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }))
    
    if (!navigator.geolocation) {
      setLocation({
        loading: false,
        error: "Geolocation is not supported by your browser",
        data: null
      })
      return
    }

    try {
      // Get coordinates using browser's Geolocation API
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        })
      })

      const { latitude, longitude } = position.coords
      
      // Use Nominatim API for reverse geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'GlobeTrotter/1.0' // Required by Nominatim ToS
          }
        }
      )
      
      if (!response.ok) {
        throw new Error("Geocoding failed")
      }
      
      const data = await response.json()
      
      // Extract location information
      const locationData = {
        latitude,
        longitude,
        city: data.address.city || data.address.town || data.address.village || data.address.county || "Unknown",
        area: data.address.suburb || data.address.neighbourhood || data.address.road || "",
        country: data.address.country,
        timestamp: new Date().getTime()
      }
      
      // Store in localStorage
      localStorage.setItem("userLocation", JSON.stringify(locationData))
      
      // Update state
      setLocation({
        loading: false,
        error: null,
        data: locationData
      })
      
      // If user is logged in, update location in backend
      if (session?.user) {
        updateLocationInBackend(latitude, longitude, locationData)
      }
    } catch (error) {
      console.error("Location error:", error)
      setLocation({
        loading: false,
        error: error.message || "Failed to get location",
        data: null
      })
    }
  }

  // Function to update location in backend
  const updateLocationInBackend = async (latitude, longitude, locationData) => {
    try {
      await fetch("/api/user/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          latitude,
          longitude,
          city: locationData.city,
          area: locationData.area,
          country: locationData.country
        })
      })
    } catch (error) {
      console.error("Error updating location in backend:", error)
    }
  }

  useEffect(() => {
    // Check if we have a recent location in localStorage (less than 30 minutes old)
    const storedLocation = localStorage.getItem("userLocation")
    if (storedLocation) {
      const parsedLocation = JSON.parse(storedLocation)
      const thirtyMinutesInMs = 30 * 60 * 1000
      
      if (parsedLocation.timestamp && (new Date().getTime() - parsedLocation.timestamp < thirtyMinutesInMs)) {
        setLocation({
          loading: false,
          error: null,
          data: parsedLocation
        })
        return
      }
    }
    
    // If no recent location, get current location
    getLocation()
    
    // Set up 30-minute interval for location refresh
    const intervalId = setInterval(getLocation, 30 * 60 * 1000)
    
    return () => clearInterval(intervalId)
  }, [])

  const handleLocationClick = () => {
    getLocation()
  }

  return (
    <header className="bg-white shadow-soft border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
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
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {/* Location Button */}
            <button 
              onClick={handleLocationClick}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
              title="Click to refresh your location"
            >
              <MapPin className="w-4 h-4 mr-1 text-primary-600" />
              {location.loading ? (
                <span className="animate-pulse">Locating...</span>
              ) : location.error ? (
                <span className="text-red-500">Enable location</span>
              ) : location.data ? (
                <span>
                  {location.data.area ? `${location.data.area}, ` : ''}
                  {location.data.city}
                </span>
              ) : (
                <span>Get location</span>
              )}
            </button>

            {status === "loading" ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {session.user.name}</span>
                <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}