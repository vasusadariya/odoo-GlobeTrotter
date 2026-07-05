"use client"

import { AnimatePresence, motion } from "framer-motion"
import LogoLoader from "./LogoLoader"

// Full-bleed loading transition (e.g. while a trip's data is first
// fetched). Mount with `show` true, flip to false once data arrives —
// AnimatePresence handles the fade-out.
export default function FullscreenLoader({ show, caption = "Charting your trip…" }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <LogoLoader size={120} fullscreen caption={caption} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
