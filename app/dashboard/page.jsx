"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, Map, Search, Users, ArrowRight, Sparkles, AlertTriangle } from "lucide-react"
import Button from "../../components/ui/Button_1"
import PassCard from "../../components/waypoint/PassCard"
import LogoLoader from "../../components/waypoint/LogoLoader"
import Globe from "../../components/waypoint/Globe"

const QUICK_ACTIONS = [
  { href: "/trips/create", title: "Plan New Trip", desc: "Start planning your next adventure", icon: Plus, primary: true },
  { href: "/trips", title: "My Trips", desc: "View all your trips", icon: Map },
  { href: "/search/cities", title: "City Search", desc: "Find destinations", icon: Search },
  { href: "/community", title: "Community", desc: "Browse others' experiences", icon: Users },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalTripId, setModalTripId] = useState(null)
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) router.replace("/auth/login")
  }, [session, status, router])

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/trips")
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) fetchTrips()
  }, [session])

  const upcomingTrips = trips.filter((trip) => new Date(trip.startDate) > new Date()).slice(0, 3)
  const recentTrips = trips.slice(0, 4)

  const globeMarkers = useMemo(
    () =>
      trips
        .flatMap((trip) => trip.destinations || [])
        .filter((d) => d.coordinates?.lat && d.coordinates?.lng)
        .map((d) => ({ location: [d.coordinates.lat, d.coordinates.lng], size: 0.06 })),
    [trips],
  )

  const openModal = (tripId) => {
    setModalTripId(tripId)
    setPrompt("")
    setShowModal(true)
  }
  const closeModal = () => {
    setShowModal(false)
    setModalTripId(null)
    setPrompt("")
  }
  const handleGenerate = async () => {
    if (!modalTripId || !prompt) return
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/generate-and-view/${modalTripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraPrompt: prompt }),
      })
      if (response.ok) {
        const data = await response.json()
        closeModal()
        if (data.redirectUrl) router.push(data.redirectUrl)
      } else {
        alert("Failed to generate itinerary.")
      }
    } catch (err) {
      alert("Error generating itinerary.")
    }
    setIsGenerating(false)
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <LogoLoader replayKey={0} />
      </div>
    )
  }

  if (!session) return null

  return (
    <>
      <div className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header + Globe */}
          <div className="mb-8 grid grid-cols-1 gap-8 border-b border-ink/10 pb-8 md:grid-cols-[1.3fr_1fr] md:items-center">
            <div>
              <p className="mb-3 flex items-center gap-2 font-data text-xs uppercase tracking-widest text-brass">
                <span className="h-px w-7 bg-brass" />
                Logbook
              </p>
              <h1 className="mb-2 font-display text-4xl italic text-ink">Welcome back, {session.user.name}.</h1>
              <p className="text-lg text-ink/60">Ready to plan your next adventure?</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Globe markers={globeMarkers} size={220} />
              <p className="font-data text-[0.7rem] tracking-wide text-ink/40">
                {globeMarkers.length > 0
                  ? `Plotted — ${globeMarkers.length} destination${globeMarkers.length === 1 ? "" : "s"}`
                  : "Add a trip to plot your first waypoint"}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={
                    action.primary
                      ? "cursor-pointer rounded-md bg-ink p-6 text-parchment shadow-[0_1px_2px_rgba(20,37,35,0.06),0_8px_24px_rgba(20,37,35,0.08)]"
                      : "cursor-pointer rounded-md border border-ink/10 bg-parchment-raised p-6 shadow-[0_1px_2px_rgba(20,37,35,0.06),0_8px_24px_rgba(20,37,35,0.08)]"
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`mb-1 font-display text-lg italic ${action.primary ? "text-parchment" : "text-ink"}`}>
                        {action.title}
                      </h3>
                      <p className={`text-sm ${action.primary ? "text-parchment/70" : "text-ink/60"}`}>{action.desc}</p>
                    </div>
                    <div
                      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${
                        action.primary ? "bg-parchment/15 text-parchment" : "bg-brass/10 text-brass"
                      }`}
                    >
                      <action.icon className="h-5 w-5" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Upcoming Trips — Logbook */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl italic text-ink">Upcoming Trips</h2>
                <Link href="/trips">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse rounded-md border border-ink/10 bg-parchment-raised p-6">
                      <div className="mb-2 h-4 w-1/3 rounded bg-ink/10" />
                      <div className="h-3 w-1/2 rounded bg-ink/10" />
                    </div>
                  ))}
                </div>
              ) : upcomingTrips.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2"
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
                >
                  {upcomingTrips.map((trip) => (
                    <motion.div
                      key={trip.id}
                      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <PassCard trip={trip} />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/trips/${trip.id}/itinerary`}>
                          <Button variant="outline" size="sm">
                            Build Itinerary
                          </Button>
                        </Link>
                        <Link href={`/trips/${trip.id}/itinerary/view`}>
                          <Button size="sm">View Itinerary</Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ai"
                          onClick={() => openModal(trip.id)}
                          className="flex items-center gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Generate
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="rounded-md border border-ink/10 bg-parchment-raised p-12 text-center">
                  <Map className="mx-auto mb-4 h-14 w-14 text-ink/20" />
                  <h3 className="mb-2 font-display text-lg italic text-ink">No upcoming trips</h3>
                  <p className="mb-4 text-ink/60">Start planning your next adventure!</p>
                  <Link href="/trips/create">
                    <Button>Plan New Trip</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-md border border-ink/10 bg-parchment-raised p-6">
                <h3 className="mb-4 font-display text-lg italic text-ink">Recent Trips</h3>
                {recentTrips.length > 0 ? (
                  <div className="space-y-1">
                    {recentTrips.map((trip) => (
                      <Link key={trip.id} href={`/trips/${trip.id}`}>
                        <div className="group flex items-center justify-between rounded-md p-3 hover:bg-parchment-sunken">
                          <div>
                            <h4 className="font-medium text-ink text-sm">
                              {trip.name || `Trip to ${trip.destinations?.[0]?.name}`}
                            </h4>
                            <p className="font-data text-xs text-ink/40 tabular-nums">
                              {new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                              {new Date(trip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink/20 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink/50">No recent trips</p>
                )}
              </div>

              <div className="rounded-md border border-brass/25 bg-brass/5 p-6">
                <h3 className="mb-2 font-display text-lg italic text-ink">Budget Highlights</h3>
                <p className="mb-3 text-sm text-ink/60">Keep track of your travel expenses</p>
                <div className="font-data text-2xl font-semibold tabular-nums text-brass">
                  ${trips.reduce((total, trip) => total + (trip.budgetLimit || 0), 0).toLocaleString()}
                </div>
                <p className="font-data text-xs text-ink/40">Total planned budget</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Itinerary modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col items-center overflow-y-auto rounded-md bg-parchment-raised p-6 shadow-2xl">
            {isGenerating ? (
              <>
                <div className="mb-2 text-center">
                  <h3 className="mb-2 font-display text-xl italic text-ink">Charting your itinerary</h3>
                  <p className="text-sm text-ink/60">Our AI is plotting activities, restaurants, and attractions for you.</p>
                </div>
                <div className="flex w-full items-center justify-center py-6">
                  <LogoLoader replayKey={modalTripId} caption="Working on it…" />
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brass/10">
                    <Sparkles className="h-6 w-6 text-brass" />
                  </div>
                  <h2 className="mb-2 font-display text-xl italic text-ink">Generate AI Itinerary</h2>
                  <p className="text-sm text-ink/60">Describe your travel preferences and let AI create the perfect itinerary</p>
                </div>

                <div className="w-full space-y-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-ink">Tell us about your travel preferences</label>
                    <div className="relative">
                      <textarea
                        className="w-full resize-none rounded-md border border-ink/15 p-3 text-sm placeholder-ink/30 transition-colors focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/20"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., I love adventure sports, local cuisine, and historical sites. Budget-friendly options preferred..."
                        disabled={isGenerating}
                      />
                      <div className="absolute bottom-2 right-3 font-data text-xs text-ink/30">{prompt.length}/500</div>
                    </div>
                    {prompt.length > 0 && prompt.length < 10 && (
                      <p className="flex items-center text-xs text-amber-700">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Add more details for better AI recommendations
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-ink/10 pt-4 sm:flex-row">
                    <Button variant="ghost" onClick={closeModal} disabled={isGenerating} className="flex-1 py-2 text-sm font-medium">
                      Cancel
                    </Button>
                    <Button
                      variant="ai"
                      onClick={handleGenerate}
                      loading={isGenerating}
                      disabled={!prompt || isGenerating}
                      className="flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate Itinerary
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
