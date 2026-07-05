import Link from "next/link"
import { Compass } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display italic">GlobeTrotter</span>
            </div>
            <p className="text-gray-400 max-w-md">
              Empowering travelers to create unforgettable journeys through intelligent trip planning and seamless
              itinerary management.
            </p>
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
                <Link href="/community" className="text-gray-400 hover:text-white transition-colors">
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
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© {new Date().getFullYear()} GlobeTrotter. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}