"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import Button from "./ui/Button_1"
import Input from "./ui/Input_1"

export default function InviteCollaboratorModal({ tripId, onClose }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("collaborator")
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite")
      }

      toast.success(`Invite sent to ${email}`)
      setEmail("")
      onClose()
    } catch (error) {
      toast.error(error.message || "Failed to send invite")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Invite a Collaborator</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="collaborator">Collaborator - can edit the itinerary</option>
              <option value="viewer">Viewer - can view and comment only</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button type="submit" loading={isSending} disabled={isSending || !email.trim()}>
              Send Invite
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
