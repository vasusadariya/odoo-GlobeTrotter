"use client"

import Link from "next/link"
// import { useSession } from "next-auth/react"
import Button from "../components/ui/Button_1"
import { useState } from "react"
import Image from "next/image"

export default function HomePage() {
  // const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")

  // Destination data
  const destinations = [
    {
      name: "Italy",
      count: 12,
      image: "/Mahibhai.jpg"
    },
    {
      name: "Japan",
      count: 15,
      image: "/Mahibhai.jpg"
    },
    {
      name: "Indonesia",
      count: 14,
      image: "/Mahibhai.jpg"
    }
  ]

  // if (status === "loading") {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   )
  // }

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
        <Link href="/trips/create">
          <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-50 shadow-lg px-8 py-3 text-lg rounded-full">
            Book Now
          </Button>
        </Link>
      </div>
    </div>
  </div>
</div>

      {/* Search Section */}
      <div className="bg-white py-8 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-1/2">
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-5 py-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Search destinations, activities, or experiences..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary-600 text-white p-2 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Filter
              </button>
              <button className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Sort
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Regional Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Our Destination</p>
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
            {destinations.map((destination, index) => (
              <div 
                key={index} 
                className="group relative rounded-xl overflow-hidden h-72 shadow-lg transition-transform duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all z-10"></div>
                <Image 
                  src={destination.image} 
                  alt={destination.name} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full z-20">
                  <p className="text-xs font-medium text-gray-700">{destination.count} Destination</p>
                </div>
                <div className="absolute bottom-6 left-6 z-20">
                  <h3 className="text-2xl font-bold text-white drop-shadow-md">{destination.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to plan the perfect trip</h2>
            <p className="text-xl text-gray-600">Comprehensive travel planning made simple</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 11V9m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Itineraries</h3>
              <p className="text-gray-600">
                Create personalized multi-city travel plans with dates, activities, and budgets.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Discovery</h3>
              <p className="text-gray-600">
                Find activities and destinations through intelligent search and recommendations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Tracking</h3>
              <p className="text-gray-600">Get cost breakdowns and visual calendars to manage your travel expenses.</p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Visual Calendars</h3>
              <p className="text-gray-600">View your trip timeline in beautiful calendar and timeline formats.</p>
            </div>

            {/* Feature 5 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100">
              <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share & Connect</h3>
              <p className="text-gray-600">
                Share your travel plans publicly or with friends for inspiration and collaboration.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Interface</h3>
              <p className="text-gray-600">
                Dynamic user interfaces that adapt to each user&apos;s trip flow and preferences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - Simplified without session checks */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start your adventure?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who trust GlobeTrotter to plan their perfect trips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-gray-50">
                Get Started Free
              </Button>
            </Link>
            <Link href="/public-trips">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600 bg-transparent"
              >
                Explore Public Trips
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold">GlobeTrotter</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering travelers to create unforgettable journeys through intelligent trip planning and seamless
                itinerary management.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z.017 0z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/search/cities" className="text-gray-400 hover:text-white transition-colors">
                    Explore Destinations
                  </Link>
                </li>
                <li>
                  <Link href="/public-trips" className="text-gray-400 hover:text-white transition-colors">
                    Public Trips
                  </Link>
                </li>
                <li>
                  <Link href="/trips/create" className="text-gray-400 hover:text-white transition-colors">
                    Create Trip
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                    My Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2025 GlobeTrotter. All rights reserved. Built for the Odoo Hackathon.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}