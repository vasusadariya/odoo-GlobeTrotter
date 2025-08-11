"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  TrendingUp,
  Globe,
  Camera,
  Star,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalDestinations: 0,
    totalBudget: 0,
    upcomingTrips: 0,
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) router.push("/auth/login")
  }, [session, status, router])

  useEffect(() => {
    if (session) {
      fetchTrips()
    }
  }, [session])

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/trips")
      if (response.ok) {
        const data = await response.json()
        const tripsData = data.trips || []
        setTrips(tripsData)

        // Calculate stats
        const totalDestinations = tripsData.reduce((acc, trip) => acc + (trip.destinations?.length || 0), 0)
        const totalBudget = tripsData.reduce((acc, trip) => acc + (trip.budgetLimit || 0), 0)
        const upcomingTrips = tripsData.filter((trip) => new Date(trip.startDate) > new Date()).length

        setStats({
          totalTrips: tripsData.length,
          totalDestinations,
          totalBudget,
          upcomingTrips,
        })
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const upcomingTrips = trips.filter((trip) => new Date(trip.startDate) > new Date()).slice(0, 3)
  const recentTrips = trips.slice(0, 4)

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="mt-4 text-gray-600 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
        {/* Welcome Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent animate-fade-in">
            Welcome back, {session.user?.name}! ✈️
          </h1>
          <p className="text-xl text-gray-600 animate-fade-in-up delay-200">
            Ready to plan your next incredible adventure?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              title: "Total Trips",
              value: stats.totalTrips,
              icon: <Plane className="w-6 h-6" />,
              color: "from-blue-500 to-cyan-500",
              bgColor: "from-blue-50 to-cyan-50",
            },
            {
              title: "Destinations",
              value: stats.totalDestinations,
              icon: <MapPin className="w-6 h-6" />,
              color: "from-green-500 to-emerald-500",
              bgColor: "from-green-50 to-emerald-50",
            },
            {
              title: "Total Budget",
              value: `$${stats.totalBudget.toLocaleString()}`,
              icon: <DollarSign className="w-6 h-6" />,
              color: "from-purple-500 to-pink-500",
              bgColor: "from-purple-50 to-pink-50",
            },
            {
              title: "Upcoming",
              value: stats.upcomingTrips,
              icon: <Calendar className="w-6 h-6" />,
              color: "from-orange-500 to-red-500",
              bgColor: "from-orange-50 to-red-50",
            },
          ].map((stat, index) => (
            <Card
              key={index}
              className={`backdrop-blur-sm bg-gradient-to-br ${stat.bgColor} border-white/20 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 animate-fade-in-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform duration-300`}
                  >
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/trips/create">
            <Card className="group hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer backdrop-blur-sm bg-gradient-to-br from-blue-500 to-purple-600 border-0 text-white overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Plan New Trip</h3>
                    <p className="text-blue-100">Start your next adventure</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/trips">
            <Card className="group hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer backdrop-blur-sm bg-white/70 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">My Trips</h3>
                    <p className="text-gray-600">View all your trips</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <Globe className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/search/cities">
            <Card className="group hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer backdrop-blur-sm bg-white/70 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Discover</h3>
                    <p className="text-gray-600">Find destinations</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <Star className="w-6 h-6 group-hover:animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="group hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer backdrop-blur-sm bg-white/70 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Memories</h3>
                  <p className="text-gray-600">Your travel photos</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Trips */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-sm bg-white/70 border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                    <Clock className="w-6 h-6 mr-2 text-blue-600" />
                    Upcoming Adventures
                  </CardTitle>
                  <Link href="/trips">
                    <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingTrips.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingTrips.map((trip, index) => (
                      <Link key={trip.id} href={`/trips/${trip.id}`}>
                        <div className="group p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                {trip.name || `Trip to ${trip.destinations?.[0]?.name}`}
                              </h3>
                              <p className="text-gray-600 mb-2">
                                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {trip.destinations?.length || 0} destinations
                                </span>
                                <Badge variant="secondary" className="capitalize">
                                  {trip.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Link href={`/trips/${trip._id || trip.id}/itinerary`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:bg-blue-50"
                                >
                                  Plan
                                </Button>
                              </Link>
                              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plane className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming trips</h3>
                    <p className="text-gray-600 mb-4">Start planning your next adventure!</p>
                    <Link href="/trips/create">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Plan New Trip
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Travel Inspiration */}
            <Card className="backdrop-blur-sm bg-gradient-to-br from-pink-50 to-orange-50 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-pink-600 animate-pulse" />
                  Travel Inspiration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Santorini, Greece", emoji: "🇬🇷", trend: "Trending" },
                    { name: "Kyoto, Japan", emoji: "🇯🇵", trend: "Popular" },
                    { name: "Bali, Indonesia", emoji: "🇮🇩", trend: "Hot" },
                    { name: "Iceland", emoji: "🇮🇸", trend: "Adventure" },
                  ].map((destination, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                          {destination.emoji}
                        </span>
                        <div>
                          <span className="text-gray-700 font-medium">{destination.name}</span>
                          <div className="text-xs text-gray-500">{destination.trend}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Budget Summary */}
            <Card className="backdrop-blur-sm bg-gradient-to-br from-green-50 to-emerald-50 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">${stats.totalBudget.toLocaleString()}</div>
                  <p className="text-sm text-gray-600 mb-4">Total planned budget</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">65% allocated to upcoming trips</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="backdrop-blur-sm bg-gradient-to-br from-indigo-50 to-purple-50 border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-indigo-600" />
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Trips shared</span>
                    <span className="font-semibold text-gray-900">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Followers</span>
                    <span className="font-semibold text-gray-900">127</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Following</span>
                    <span className="font-semibold text-gray-900">89</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4 hover:bg-indigo-50 bg-transparent">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
