"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import React from "react"
import Link from "next/link"
import Button from "../../components/ui/Button_1"
import Lottie from "lottie-react";
import aiLoadingAnimation from "../../public/ai-loading.json";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTripId, setModalTripId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) router.replace("/auth/login"); // Not authenticated
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchTrips();
    }
  }, [session]);

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/trips");
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  const upcomingTrips = trips.filter((trip) => new Date(trip.startDate) > new Date()).slice(0, 3);
  const recentTrips = trips.slice(0, 4);

  // Modal handler
  const openModal = (tripId) => {
    setModalTripId(tripId);
    setPrompt("");
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setModalTripId(null);
    setPrompt("");
  };
  const handleGenerate = async () => {
    if (!modalTripId || !prompt) return;
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/generate-and-view/${modalTripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraPrompt: prompt })
      });
      console.log(response)
      if (response.ok) {
        const data = await response.json();
        closeModal();
        if (data.redirectUrl) {
          router.push(data.redirectUrl);
        }
      } else {
        alert("Failed to generate itinerary.");
      }
    } catch (err) {
      alert("Error generating itinerary.");
    }
    setIsGenerating(false);
  };


  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Welcome Header - Feature 2 Component */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {session.user.name}!</h1>
            <p className="text-lg text-gray-600">Ready to plan your next adventure?</p>
          </div>

          {/* Quick Actions - Feature 2 Component */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Link href="/trips/create">
              <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Plan New Trip</h3>
                    <p className="text-blue-100">Start planning your next adventure</p>
                  </div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/trips">
              <div className="bg-white rounded-2xl p-6 shadow-medium hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">My Trips</h3>
                    <p className="text-gray-600">View all your trips</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/search/cities">
              <div className="bg-white rounded-2xl p-6 shadow-medium hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">City Search</h3>
                    <p className="text-gray-600">Find destinations</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-white rounded-2xl p-6 shadow-medium">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Activities</h3>
                  <p className="text-gray-600">Browse experiences</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upcoming Trips - Feature 2 Component */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Trips</h2>
                <Link href="/trips">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-medium animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : upcomingTrips.length > 0 ? (
                <div className="space-y-4">
                  {upcomingTrips.map((trip) => (
                    <Link key={trip.id} href={`/trips/${trip.id}`}>
                      <div className="bg-white rounded-2xl p-6 shadow-medium hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {trip.name || `Trip to ${trip.destinations?.[0]?.name}`}
                            </h3>
                            <p className="text-gray-600 mb-2">
                              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{trip.destinations?.length || 0} destinations</span>
                              <span className="capitalize">{trip.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Link href={`/trips/${trip.id}/itinerary`}>
                              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                Build Itinerary
                              </Button>
                            </Link>
                            
                            <Link href={`/trips/${trip.id}/itinerary/view`}>
                              <Button size="sm" onClick={(e) => e.stopPropagation()}>
                                View Itinerary
                              </Button>
                            </Link>
                            <Button size="sm" variant="ai" onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openModal(trip.id);
                              }}>
                              Generate Itinerary
                            </Button>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 shadow-medium text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming trips</h3>
                  <p className="text-gray-600 mb-4">Start planning your next adventure!</p>
                  <Link href="/trips/create">
                    <Button>Plan New Trip</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Sidebar - Feature 2 Components */}
            <div className="space-y-6">
              {/* Recommended Destinations */}
              <div className="bg-white rounded-2xl p-6 shadow-medium">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Destinations</h3>
                <div className="space-y-3">
                  {[
                    { name: "Paris, France", image: "🇫🇷", popularity: "Very Popular" },
                    { name: "Tokyo, Japan", image: "🇯🇵", popularity: "Trending" },
                    { name: "New York, USA", image: "🇺🇸", popularity: "Popular" },
                    { name: "London, UK", image: "🇬🇧", popularity: "Popular" },
                  ].map((destination, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <span className="text-2xl">{destination.image}</span>
                      <div className="flex-1">
                        <span className="text-gray-700 font-medium">{destination.name}</span>
                        <div className="text-xs text-gray-500">{destination.popularity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Trips */}
              <div className="bg-white rounded-2xl p-6 shadow-medium">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Trips</h3>
                {recentTrips.length > 0 ? (
                  <div className="space-y-3">
                    {recentTrips.map((trip) => (
                      <Link key={trip.id} href={`/trips/${trip.id}`}>
                        <div className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {trip.name || `Trip to ${trip.destinations?.[0]?.name}`}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No recent trips</p>
                )}
              </div>

              {/* Budget Highlights - Feature 2 Component */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Highlights</h3>
                <p className="text-sm text-gray-600 mb-3">Keep track of your travel expenses</p>
                <div className="text-2xl font-bold text-green-600">
                  ${trips.reduce((total, trip) => total + (trip.budgetLimit || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">Total planned budget</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal for Generate Itinerary */}
      {/* {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Generate Itinerary</h2>
            <label className="block mb-2 text-sm font-medium text-gray-700">Prompt</label>
            <textarea
              className="w-full border rounded-lg p-2 mb-4"
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your preferences, activities, etc."
              disabled={isGenerating}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={closeModal} disabled={isGenerating}>Cancel</Button>
              <Button onClick={handleGenerate} loading={isGenerating} disabled={!prompt || isGenerating}>
                Generate
              </Button>
            </div>
          </div>
        </div>
      )} */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto flex flex-col items-center transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            {isGenerating ? (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI is crafting your itinerary</h3>
                  <p className="text-gray-600 text-sm">Please wait while we create the perfect travel plan for you...</p>
                </div>
                <div className="bg-white rounded-xl p-4 w-full flex justify-center items-center">
                  <Lottie 
                    animationData={aiLoadingAnimation} 
                    loop={true} 
                    style={{ 
                      width: 250, 
                      height: 250, 
                      backgroundColor: 'white',
                      borderRadius: '12px'
                    }} 
                  />
                </div>
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-purple-100">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Generate AI Itinerary</h2>
                  <p className="text-gray-600 text-sm">Describe your travel preferences and let AI create the perfect itinerary</p>
                </div>

                <div className="w-full space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">AI Travel Assistant</h3>
                    </div>
                    <p className="text-xs text-gray-600">
                      Our AI will analyze your preferences and create a personalized itinerary with activities, restaurants, and attractions tailored just for you.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Tell us about your travel preferences
                    </label>
                    <div className="relative">
                      <textarea
                        className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder-gray-400"
                        rows={3}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="e.g., I love adventure sports, local cuisine, and historical sites. Budget-friendly options preferred..."
                        disabled={isGenerating}
                      />
                      <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                        {prompt.length}/500
                      </div>
                    </div>
                    {prompt.length < 10 && (
                      <p className="text-xs text-amber-600 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Add more details for better AI recommendations
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      onClick={closeModal} 
                      disabled={isGenerating}
                      className="flex-1 py-2 font-medium text-sm"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="ai"
                      onClick={handleGenerate} 
                      loading={isGenerating} 
                      disabled={!prompt || isGenerating}
                      className="flex-1 py-2 font-medium text-sm relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Generate Itinerary
                      </div>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
