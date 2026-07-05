"use client"

import { motion, useReducedMotion } from "framer-motion"

const WORD = "Globe Trotter"

// Compass-needle arrival animation for the GlobeTrotter mark: the ring
// draws in, the needle spins twice and settles like it found north, then
// the wordmark cascades in letter by letter. Pass a changing `replayKey` to
// restart it (e.g. an incrementing number from a "Replay" button).
export default function LogoLoader({ size = 96, fullscreen = false, replayKey = 0, caption }) {
  const reduce = useReducedMotion()

  const needleTransition = reduce
    ? { duration: 0 }
    : { duration: 1.6, times: [0, 0.35, 0.65, 0.82, 1], ease: "easeOut" }
  const needleAnimate = reduce
    ? { rotate: 360, opacity: 1, scale: 1 }
    : { rotate: [-160, -160, 390, 345, 360], opacity: [0, 1, 1, 1, 1], scale: [0.6, 0.6, 1, 1, 1] }

  return (
    <div
      className={fullscreen ? "flex flex-col items-center gap-5" : "flex flex-col items-center gap-3"}
      key={replayKey}
    >
      <svg width={size} height={size} viewBox="0 0 120 120" className="overflow-visible">
        <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(150,105,30,0.22)" strokeWidth="1.5" />
        <motion.circle
          cx="60"
          cy="60"
          r="46"
          fill="none"
          stroke={fullscreen ? "#d9a856" : "#96691e"}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reduce ? { duration: 0 } : { duration: 1, ease: "easeOut" }}
        />
        <motion.g
          style={{ originX: "60px", originY: "60px" }}
          initial={false}
          animate={needleAnimate}
          transition={needleTransition}
        >
          <polygon points="60,20 66,60 60,64 54,60" fill="#a8402f" />
          <polygon points="60,100 66,60 60,56 54,60" fill="#8a9c98" />
          <circle cx="60" cy="60" r="5" fill={fullscreen ? "#d9a856" : "#96691e"} />
        </motion.g>
      </svg>

      <motion.p
        className={`font-display italic ${fullscreen ? "text-2xl text-parchment" : "text-xl text-ink"}`}
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.045, delayChildren: reduce ? 0 : 1.05 } } }}
      >
        {WORD.split("").map((char, i) => (
          <motion.span
            key={i}
            className="inline-block"
            variants={{
              hidden: { opacity: 0, y: reduce ? 0 : 6 },
              show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.4, ease: "easeOut" } },
            }}
          >
            {char === " " ? " " : char}
          </motion.span>
        ))}
      </motion.p>

      {caption && (
        <motion.p
          className="font-data text-xs uppercase tracking-wider text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 1.8 }}
        >
          {caption}
        </motion.p>
      )}
    </div>
  )
}
