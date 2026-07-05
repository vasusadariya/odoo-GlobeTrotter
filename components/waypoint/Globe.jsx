"use client"

import { useEffect, useRef, useState } from "react"
import createGlobe from "cobe"

const INK = [0.078, 0.145, 0.137] // #142523
const BRASS = [0.588, 0.412, 0.118] // #96691e
const PARCHMENT = [0.933, 0.949, 0.941] // #eef2f0

// Rotating schematic globe (WebGL via cobe) that plots real coordinates —
// used to show a user's actual trip destinations, not decoration.
export default function Globe({ markers = [], size = 280, className = "" }) {
  const canvasRef = useRef(null)
  const phiRef = useRef(0)
  const pointerRef = useRef({ down: false, lastX: 0 })
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(query.matches)
    const handler = (e) => setReducedMotion(e.matches)
    query.addEventListener("change", handler)
    return () => query.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    let width = canvasRef.current.offsetWidth

    const onResize = () => {
      if (canvasRef.current) width = canvasRef.current.offsetWidth
    }
    window.addEventListener("resize", onResize)

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0.6,
      theta: 0.3,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 14000,
      mapBrightness: 5,
      baseColor: PARCHMENT,
      markerColor: BRASS,
      glowColor: INK,
      scale: 1,
      offset: [0, 0],
      markers: markers.map((m) => ({ location: m.location, size: m.size || 0.06 })),
      onRender: (state) => {
        if (!pointerRef.current.down && !reducedMotion) {
          phiRef.current += 0.0022
        }
        state.phi = phiRef.current
        state.width = width * 2
        state.height = width * 2
      },
    })

    return () => {
      globe.destroy()
      window.removeEventListener("resize", onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, JSON.stringify(markers)])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={markers.length ? `Globe plotting ${markers.length} trip destination${markers.length === 1 ? "" : "s"}` : "Rotating globe"}
      className={className}
      style={{ width: size, height: size, maxWidth: "100%", aspectRatio: 1, cursor: "grab" }}
      onPointerDown={(e) => {
        pointerRef.current.down = true
        pointerRef.current.lastX = e.clientX
        e.currentTarget.style.cursor = "grabbing"
      }}
      onPointerUp={(e) => {
        pointerRef.current.down = false
        e.currentTarget.style.cursor = "grab"
      }}
      onPointerOut={(e) => {
        pointerRef.current.down = false
        e.currentTarget.style.cursor = "grab"
      }}
      onPointerMove={(e) => {
        if (pointerRef.current.down) {
          const delta = e.clientX - pointerRef.current.lastX
          phiRef.current += delta * 0.006
          pointerRef.current.lastX = e.clientX
        }
      }}
    />
  )
}
