"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"

const QUICK_REACTIONS = ["👍", "❤️", "🎉", "🤔"]

export default function ItineraryComments({ tripId, itineraryItemId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `/api/trips/${tripId}/comments?itineraryItemId=${encodeURIComponent(itineraryItemId)}`,
      )
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (expanded) fetchComments()
  }, [expanded])

  const postEntry = async (payload) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itineraryItemId, ...payload }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to post")
      setComments((prev) => [...prev, data.comment])
    } catch (error) {
      toast.error(error.message || "Failed to post")
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setIsSubmitting(true)
    await postEntry({ kind: "comment", text: text.trim() })
    setText("")
    setIsSubmitting(false)
  }

  const handleReaction = async (emoji) => {
    await postEntry({ kind: "reaction", emoji })
  }

  const commentEntries = comments.filter((c) => c.kind === "comment")
  const reactionEntries = comments.filter((c) => c.kind === "reaction")

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        💬 {expanded ? "Hide" : "Show"} comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReaction(emoji)}
                className="text-lg hover:scale-110 transition-transform"
                title="React"
              >
                {emoji}
              </button>
            ))}
            {reactionEntries.length > 0 && (
              <span className="text-xs text-gray-400 ml-1">{reactionEntries.length} reactions</span>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-gray-400">Loading comments...</p>
          ) : (
            <div className="space-y-2">
              {commentEntries.map((comment) => (
                <div key={comment._id} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-gray-800">{comment.author?.name || "Someone"}</span>
                  <span className="text-gray-600 ml-2">{comment.text}</span>
                </div>
              ))}
              {commentEntries.length === 0 && <p className="text-xs text-gray-400">No comments yet.</p>}
            </div>
          )}

          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="text-sm text-primary-600 font-medium disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
