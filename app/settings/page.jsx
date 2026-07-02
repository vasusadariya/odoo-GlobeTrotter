"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, MapPin, Bell, Shield } from "lucide-react"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    preferences: {
      currency: "USD",
      language: "en",
      notifications: {
        email: true,
        push: false,
        marketing: false,
      },
      privacy: {
        profileVisible: true,
        tripsVisible: false,
      },
    },
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login")
    }
  }, [status, router])

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session) return

      try {
        console.log("Fetching user data for session:", session.user)
        const response = await fetch("/api/user")

        if (response.ok) {
          const data = await response.json()
          console.log("Fetched user data:", data.user)
          setUserData(data.user)

          setFormData((prev) => ({
            name: data.user.name || session.user.name || "",
            email: data.user.email || session.user.email || "",
            preferences: {
              currency: data.user.preferences?.currency || "USD",
              language: data.user.preferences?.language || "en",
              notifications: {
                email: data.user.preferences?.notifications?.email ?? true,
                push: data.user.preferences?.notifications?.push ?? false,
                marketing: data.user.preferences?.notifications?.marketing ?? false,
              },
              privacy: {
                profileVisible: data.user.preferences?.privacy?.profileVisible ?? true,
                tripsVisible: data.user.preferences?.privacy?.tripsVisible ?? false,
              },
            },
          }))
        } else {
          console.log("User not found in database, using session data")
          setFormData((prev) => ({
            ...prev,
            name: session.user.name || "",
            email: session.user.email || "",
          }))
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setFormData((prev) => ({
          ...prev,
          name: session.user.name || "",
          email: session.user.email || "",
        }))
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchUserData()
    }
  }, [session])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePreferenceChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: {
          ...prev.preferences[category],
          [field]: value,
        },
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email, // Include email in save request
          preferences: formData.preferences,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setUserData(data.user)
        alert("Settings saved successfully!")
      } else {
        alert("Error saving settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Error saving settings")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600">Manage your account preferences and settings</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.preferences.currency}
                    onChange={(e) => handlePreferenceChange("", "currency", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={formData.preferences.language}
                    onChange={(e) => handlePreferenceChange("", "language", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Bell className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive trip updates and reminders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.preferences.notifications?.email || false}
                    onChange={(e) => handlePreferenceChange("notifications", "email", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                    <p className="text-sm text-gray-600">Get notified about important updates</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.preferences.notifications?.push || false}
                    onChange={(e) => handlePreferenceChange("notifications", "push", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
                    <p className="text-sm text-gray-600">Receive travel tips and offers</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.preferences.notifications?.marketing || false}
                    onChange={(e) => handlePreferenceChange("notifications", "marketing", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Privacy</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Profile Visibility</h3>
                    <p className="text-sm text-gray-600">Make your profile visible to other users</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.preferences.privacy?.profileVisible || false}
                    onChange={(e) => handlePreferenceChange("privacy", "profileVisible", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Trip Visibility</h3>
                    <p className="text-sm text-gray-600">Allow others to see your public trips</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.preferences.privacy?.tripsVisible || false}
                    onChange={(e) => handlePreferenceChange("privacy", "tripsVisible", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member since</span>
                  <span className="text-sm font-medium">
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last updated</span>
                  <span className="text-sm font-medium">
                    {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            {userData?.location && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Current Location</h3>
                </div>
                <p className="text-sm text-gray-600">
                  {userData.location.city}
                  {userData.location.area && `, ${userData.location.area}`}
                </p>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
