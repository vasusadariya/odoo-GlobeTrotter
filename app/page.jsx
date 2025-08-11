"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plane, MapPin, Calendar, Users, Star, ArrowRight, Sparkles, Globe, Camera, Heart } from "lucide-react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const testimonials = [
    {
      name: "Sarah Chen",
      location: "San Francisco, CA",
      text: "GlobeTrotter made planning my 3-week European adventure so easy! The AI suggestions were spot-on.",
      avatar: "🌟",
      rating: 5,
    },
    {
      name: "Marcus Johnson",
      location: "New York, NY",
      text: "Best travel planning app I've ever used. The budget tracking saved me hundreds of dollars!",
      avatar: "✈️",
      rating: 5,
    },
    {
      name: "Elena Rodriguez",
      location: "Barcelona, Spain",
      text: "The collaborative features helped me plan the perfect group trip with friends across 4 countries.",
      avatar: "🗺️",
      rating: 5,
    },
  ]

  const features = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Smart Itineraries",
      description: "AI-powered trip planning that adapts to your preferences and budget",
      color: "from-blue-500 to-cyan-500",
      delay: "delay-100",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Visual Timeline",
      description: "Beautiful calendar views and interactive timeline planning",
      color: "from-purple-500 to-pink-500",
      delay: "delay-200",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Collaborative Planning",
      description: "Plan together with friends and family in real-time",
      color: "from-green-500 to-emerald-500",
      delay: "delay-300",
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Local Insights",
      description: "Discover hidden gems and local recommendations",
      color: "from-orange-500 to-red-500",
      delay: "delay-400",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Coverage",
      description: "Plan trips to 195+ countries with local expertise",
      color: "from-indigo-500 to-purple-500",
      delay: "delay-500",
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Memory Keeper",
      description: "Capture and organize your travel memories beautifully",
      color: "from-pink-500 to-rose-500",
      delay: "delay-600",
    },
  ]

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="mt-4 text-gray-600 animate-pulse">Preparing your adventure...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 backdrop-blur-sm rounded-full px-6 py-2 mb-8 border border-white/20">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Travel Planning</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                Plan Your Perfect
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                Adventure
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Create magical journeys with AI-powered itineraries, discover hidden gems, and share unforgettable
              experiences with fellow travelers around the world.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {session ? (
                <>
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl text-lg px-8 py-4 rounded-2xl"
                    >
                      <Plane className="w-5 h-5 mr-2 animate-bounce" />
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/trips/create">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto backdrop-blur-sm bg-white/50 border-white/30 hover:bg-white/70 transform hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-2xl"
                    >
                      <MapPin className="w-5 h-5 mr-2" />
                      Create New Trip
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/register">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl text-lg px-8 py-4 rounded-2xl group"
                    >
                      <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin" />
                      Start Planning Now
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto backdrop-blur-sm bg-white/50 border-white/30 hover:bg-white/70 transform hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-2xl"
                    >
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Everything You Need for Epic Adventures
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive travel planning tools designed to make your journey unforgettable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 backdrop-blur-sm bg-white/70 border-white/20 overflow-hidden animate-fade-in-up ${feature.delay}`}
              >
                <CardContent className="p-8 relative">
                  <div
                    className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${feature.color.split(" ")[1]}, ${feature.color.split(" ")[3]})`,
                    }}
                  ></div>

                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
                  >
                    {feature.icon}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>

                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-5 h-5 text-blue-600 transform group-hover:translate-x-2 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 backdrop-blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Loved by Travelers Worldwide
            </h2>
            <p className="text-xl text-gray-600">Join thousands of happy adventurers</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-6 h-6 text-yellow-400 fill-current animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>

                <blockquote className="text-2xl md:text-3xl font-medium text-gray-900 mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>

                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">{testimonials[currentTestimonial].name}</div>
                    <div className="text-gray-600">{testimonials[currentTestimonial].location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? "bg-blue-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center text-white">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-8">
            <Heart className="w-4 h-4 text-pink-300 animate-pulse" />
            <span className="text-sm font-medium">Join 50,000+ Happy Travelers</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to Start Your
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              Dream Adventure?
            </span>
          </h2>

          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-90 leading-relaxed">
            Join thousands of travelers who trust GlobeTrotter to plan their perfect journeys. Your next adventure is
            just one click away!
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {session ? (
              <Link href="/trips/create">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl text-lg px-8 py-4 rounded-2xl group"
                >
                  <Plane className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                  Create Your First Trip
                  <Sparkles className="w-5 h-5 ml-2 group-hover:animate-spin" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl text-lg px-8 py-4 rounded-2xl group"
                  >
                    <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin" />
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/public-trips">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transform hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-2xl bg-transparent"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Explore Public Trips
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  GlobeTrotter
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                Empowering travelers to create unforgettable journeys through intelligent trip planning and seamless
                itinerary management. Your adventure starts here.
              </p>
              <div className="flex space-x-4">
                {["twitter", "facebook", "instagram", "linkedin"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transform hover:scale-110 transition-all duration-300"
                  >
                    <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Quick Links</h3>
              <ul className="space-y-3">
                {["Explore Destinations", "Public Trips", "Create Trip", "My Dashboard"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Support</h3>
              <ul className="space-y-3">
                {["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 GlobeTrotter. All rights reserved. Built with ❤️ for the Odoo Hackathon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
