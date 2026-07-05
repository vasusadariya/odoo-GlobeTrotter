"use client"

import { useEffect, useRef, useState } from "react"

// Rotating schematic globe — plain Canvas 2D wireframe (meridians/parallels
// projected with simple orthographic rotation), not a third-party WebGL
// globe library. cobe's dot-map renderer produced a blank sphere with no
// visible continents in both v2.0.1 and v0.6.5 in testing (confirmed via
// an isolated reference-config test, so it wasn't a tuning issue) — this
// hand-rolled version has no shader/readback dependency, so its output is
// fully predictable, and it fits the "navigation instrument" aesthetic
// (wireframe armillary sphere) better than a photorealistic dot-map anyway.
export default function Globe({ markers = [], size = 280, className = "" }) {
  const canvasRef = useRef(null)
  const thetaRef = useRef(0.6)
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
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const dpr = window.devicePixelRatio || 1

    function sizeCanvas() {
      const cssSize = canvas.clientWidth || size
      canvas.width = cssSize * dpr
      canvas.height = cssSize * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    sizeCanvas()
    window.addEventListener("resize", sizeCanvas)

    function project(lat, lon, theta, R) {
      const latR = (lat * Math.PI) / 180
      const lonR = (lon * Math.PI) / 180
      const x = Math.cos(latR) * Math.sin(lonR)
      const y = Math.sin(latR)
      const z = Math.cos(latR) * Math.cos(lonR)
      const xr = x * Math.cos(theta) + z * Math.sin(theta)
      const zr = -x * Math.sin(theta) + z * Math.cos(theta)
      return { x: xr * R, y: -y * R, z: zr }
    }

    function draw(theta) {
      const cssSize = canvas.clientWidth || size
      const cx = cssSize / 2
      const cy = cssSize / 2
      const R = cssSize * 0.42

      ctx.clearRect(0, 0, cssSize, cssSize)

      // Soft brass atmosphere glow behind the sphere
      const glow = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.35)
      glow.addColorStop(0, "rgba(217,168,86,0.35)")
      glow.addColorStop(1, "rgba(217,168,86,0)")
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // Sphere base — subtle radial shading for depth
      const base = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R)
      base.addColorStop(0, "rgba(60,90,86,0.9)")
      base.addColorStop(1, "rgba(20,37,35,0.95)")
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = base
      ctx.fill()

      ctx.strokeStyle = "rgba(217,168,86,0.55)"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()

      // Meridians (lines of longitude)
      const lonSteps = 10
      const latSteps = 24
      for (let m = 0; m < lonSteps; m++) {
        const lon0 = (m * 360) / lonSteps
        let prev = null
        for (let i = 0; i <= latSteps; i++) {
          const lat = -90 + (i * 180) / latSteps
          const p = project(lat, lon0, theta, R)
          if (prev) {
            const alpha = 0.08 + 0.3 * ((p.z + prev.z) / 2 + 1) / 2
            ctx.strokeStyle = `rgba(217,168,86,${alpha.toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(cx + prev.x, cy + prev.y)
            ctx.lineTo(cx + p.x, cy + p.y)
            ctx.stroke()
          }
          prev = p
        }
      }

      // Parallels (lines of latitude)
      for (let lat = -60; lat <= 60; lat += 30) {
        let prev = null
        for (let j = 0; j <= 48; j++) {
          const lon = (j * 360) / 48
          const p = project(lat, lon, theta, R)
          if (prev) {
            const alpha = 0.06 + 0.28 * ((p.z + prev.z) / 2 + 1) / 2
            ctx.strokeStyle = `rgba(238,242,240,${alpha.toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(cx + prev.x, cy + prev.y)
            ctx.lineTo(cx + p.x, cy + p.y)
            ctx.stroke()
          }
          prev = p
        }
      }

      // Plotted destination markers
      markers.forEach((mk) => {
        const [lat, lon] = mk.location
        const p = project(lat, lon, theta, R)
        if (p.z > -0.15) {
          const alpha = Math.max(0.35, (p.z + 1) / 2)
          const r = p.z > 0.3 ? 4.5 : 3
          ctx.globalAlpha = alpha
          ctx.beginPath()
          ctx.arc(cx + p.x, cy + p.y, r, 0, Math.PI * 2)
          ctx.fillStyle = "#d9a856"
          ctx.fill()
          if (p.z > 0.3) {
            ctx.beginPath()
            ctx.arc(cx + p.x, cy + p.y, r + 4, 0, Math.PI * 2)
            ctx.strokeStyle = "#d9a856"
            ctx.globalAlpha = alpha * 0.4
            ctx.lineWidth = 1
            ctx.stroke()
          }
          ctx.globalAlpha = 1
        }
      })
    }

    let raf
    if (reducedMotion) {
      draw(thetaRef.current)
    } else {
      const loop = () => {
        if (!pointerRef.current.down) thetaRef.current += 0.0022
        draw(thetaRef.current)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      window.removeEventListener("resize", sizeCanvas)
      if (raf) cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, JSON.stringify(markers)])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={markers.length ? `Globe plotting ${markers.length} trip destination${markers.length === 1 ? "" : "s"}` : "Rotating globe"}
      className={className}
      style={{ width: size, height: size, maxWidth: "100%", aspectRatio: 1, cursor: "grab", display: "block" }}
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
          thetaRef.current += delta * 0.006
          pointerRef.current.lastX = e.clientX
        }
      }}
    />
  )
}
