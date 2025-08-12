"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { MapPin, ChevronDown, User, Settings, LogOut } from "lucide-react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"

// Utility function to conditionally join classNames
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ")
}

export default function Header() {
  const { data: session, status } = useSession()
  const [location, setLocation] = useState({
    loading: true,
    error: null,
    data: null,
  })
  const [visible, setVisible] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const ref = useRef(null)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const getLocation = async () => {
    setLocation((prev) => ({ ...prev, loading: true, error: null }))

    if (!navigator.geolocation) {
      setLocation({
        loading: false,
        error: "Geolocation is not supported",
        data: null,
      })
      return
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        })
      })

      const { latitude, longitude } = position.coords

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en",
              "User-Agent": "GlobeTrotter/1.0",
            },
            signal: controller.signal,
          },
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error("Geocoding failed")
        }

        const data = await response.json()

        const locationData = {
          latitude,
          longitude,
          city: data.address.city || data.address.town || data.address.village || data.address.county || "Unknown",
          area: data.address.suburb || data.address.neighbourhood || data.address.road || "",
          timestamp: new Date().getTime(),
        }

        localStorage.setItem("userLocation", JSON.stringify(locationData))

        setLocation({
          loading: false,
          error: null,
          data: locationData,
        })

        if (session?.user) {
          updateLocationInBackend(latitude, longitude, locationData)
        }
      } catch (error) {
        console.error("Geocoding error:", error)

        setLocation({
          loading: false,
          error: "Location unavailable",
          data: null,
        })
      }
    } catch (error) {
      console.error("Location error:", error)
      setLocation({
        loading: false,
        error: "Location access denied",
        data: null,
      })
    }
  }

  const updateLocationInBackend = async (latitude, longitude, locationData) => {
    try {
      await fetch("/api/user/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude,
          longitude,
          city: locationData.city,
          area: locationData.area,
        }),
      })
    } catch (error) {
      console.error("Error updating location in backend:", error)
    }
  }

  useEffect(() => {
    const storedLocation = localStorage.getItem("userLocation")
    if (storedLocation) {
      const parsedLocation = JSON.parse(storedLocation)
      const thirtyMinutesInMs = 30 * 60 * 1000

      if (parsedLocation.timestamp && new Date().getTime() - parsedLocation.timestamp < thirtyMinutesInMs) {
        setLocation({
          loading: false,
          error: null,
          data: parsedLocation,
        })
        return
      }
    }

    getLocation()

    const intervalId = setInterval(getLocation, 30 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  const handleLocationClick = () => {
    getLocation()
  }

  return (
    <motion.header
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="sticky inset-x-0 top-0 z-50 w-full"
    >
      {/* Desktop Navigation */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(10px)" : "none",
          boxShadow: visible
            ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
            : "none",
          width: visible ? "40%" : "100%",
          y: visible ? 20 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
        style={{
          minWidth: "800px",
        }}
        className={cn(
          "relative z-50 mx-auto hidden max-w-7xl flex-row items-center justify-between self-start rounded-full px-4 py-2 lg:flex",
          visible && "bg-white/80 dark:bg-neutral-950/80",
        )}
      >
        {/* Logo */}
        <Link href="/" className="relative z-20 flex items-center space-x-2 px-2 py-1">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-black dark:text-white">GlobeTrotter</span>
        </Link>

        {/* Location and Auth */}
        <div className="relative z-20 flex items-center space-x-4">
          {/* Location Button */}
          <button
            onClick={handleLocationClick}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            title="Click to refresh your location"
          >
            <MapPin className="w-4 h-4 mr-1 text-blue-600" />
            {location.loading ? (
              <span className="animate-pulse">Locating...</span>
            ) : location.error ? (
              <span className="text-red-500">Enable location</span>
            ) : location.data ? (
              <span>
                {location.data.area ? `${location.data.area}, ` : ""}
                {location.data.city}
              </span>
            ) : (
              <span>Get location</span>
            )}
          </button>

          {/* Auth Buttons */}
          {status === "loading" ? (
            <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
          ) : session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden md:block">{session.user.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isUserDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                >
                  <Link
                    href="/dashboard"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <User className="w-4 h-4 mr-3" />
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false)
                      signOut({ callbackUrl: "/" })
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ y: -2 }}
                  className="px-4 py-2 rounded-md bg-transparent text-black text-sm font-medium hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800 transition-colors"
                >
                  Sign In
                </motion.button>
              </Link>
              <Link href="/auth/register">
                <motion.button
                  whileHover={{ y: -2 }}
                  className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium shadow-[0_0_24px_rgba(34,_42,_53,_0.06)] hover:bg-gray-900 transition-colors"
                >
                  Sign Up
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile Navigation */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(10px)" : "none",
          boxShadow: visible
            ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
            : "none",
          width: visible ? "90%" : "100%",
          paddingRight: visible ? "12px" : "0px",
          paddingLeft: visible ? "12px" : "0px",
          borderRadius: visible ? "4px" : "2rem",
          y: visible ? 20 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
        className={cn(
          "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-transparent px-0 py-2 lg:hidden",
          visible && "bg-white/80 dark:bg-neutral-950/80",
        )}
      >
        <div className="flex w-full flex-row items-center justify-between px-4">
          {/* Logo for mobile */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-black dark:text-white">GlobeTrotter</span>
          </Link>

          {/* Mobile menu toggle */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-black dark:text-white">
            {isMobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-white px-4 py-8 shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] dark:bg-neutral-950"
          >
            {/* Location */}
            <div className="w-full px-4 py-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              {location.loading ? (
                <span className="animate-pulse">Locating...</span>
              ) : location.error ? (
                <span className="text-red-500">{location.error}</span>
              ) : location.data ? (
                <span>
                  {location.data.area ? `${location.data.area}, ` : ""}
                  {location.data.city}
                </span>
              ) : (
                <span>Get location</span>
              )}
              <button onClick={handleLocationClick} className="ml-2 text-blue-600 text-sm">
                Refresh
              </button>
            </div>

            {/* Auth buttons */}
            {status === "loading" ? (
              <div className="w-full px-4 py-2">
                <div className="w-full h-10 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : session ? (
              <div className="w-full px-4 py-2 space-y-2">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{session.user.name}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-3" />
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    signOut({ callbackUrl: "/" })
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="w-full px-4 py-2 flex flex-col gap-2">
                <Link href="/auth/login" className="w-full">
                  <button className="w-full px-4 py-2 border border-gray-300 text-black rounded-md text-sm font-medium">
                    Sign In
                  </button>
                </Link>
                <Link href="/auth/register" className="w-full">
                  <button className="w-full px-4 py-2 bg-black text-white rounded-md text-sm font-medium">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.header>
  )
}
