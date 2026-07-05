"use client"

import { useState } from "react"
import { MapPin } from "lucide-react"

const GRADIENTS = ["from-brass to-route", "from-ink to-brass", "from-route to-ink"]

function gradientFor(seed) {
  const hash = (seed || "").split("").reduce((sum, c) => sum + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

// A photo with a designed fallback (brand-toned gradient + icon) instead of
// a broken-image icon or a flat placeholder square when no photo resolves.
export default function PhotoTile({ src, alt, seed, className = "", icon: Icon = MapPin }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br ${gradientFor(seed || alt)} ${className}`}>
        <Icon className="h-6 w-6 text-parchment/80" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`object-cover ${className}`} onError={() => setFailed(true)} />
  )
}
