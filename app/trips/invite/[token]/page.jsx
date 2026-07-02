"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import toast from "react-hot-toast"
import Button from "../../../../components/ui/Button_1"

export default function AcceptInvitePage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()

  const [invite, setInvite] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAccepting, setIsAccepting] = useState(false)

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/trips/invites/${params.token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "This invite is invalid or has expired")
          return
        }

        setInvite(data)
      } catch (err) {
        console.error("Error fetching invite:", err)
        setError("Failed to load invite")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvite()
  }, [params.token])

  const acceptInvite = async () => {
    setIsAccepting(true)
    try {
      const response = await fetch(`/api/trips/invites/${params.token}`, { method: "POST" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invite")
      }

      toast.success("You've joined the trip!")
      router.push(`/trips/${data.tripId}`)
    } catch (err) {
      toast.error(err.message || "Failed to accept invite")
    } finally {
      setIsAccepting(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're invited!</h1>
        <p className="text-gray-600 mb-1">
          {invite?.inviter?.name || "Someone"} invited you to help plan
        </p>
        <p className="text-xl font-semibold text-gray-900 mb-6">{invite?.trip?.name}</p>
        <p className="text-sm text-gray-500 mb-6">
          You'll join as a <span className="font-medium">{invite?.role}</span>
        </p>
        <Button onClick={acceptInvite} loading={isAccepting} disabled={isAccepting} className="w-full">
          Accept Invite
        </Button>
      </div>
    </div>
  )
}
