import { Inter, Newsreader, IBM_Plex_Mono } from "next/font/google"
import SessionProvider from "../components/providers/SessionProvider"
import Header from "../components/layout/Header"
import Footer from "../components/Footer"
import { Toaster } from "react-hot-toast"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

// Opt-in "Waypoint" design tokens (font-display / font-data Tailwind
// utilities) for pages migrating to the new visual direction. Exposed as
// CSS variables only — Inter stays the app-wide default via inter.className.
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-data",
  display: "swap",
})

export const metadata = {
  title: "GlobeTrotter - Travel Planning Made Easy",
  description: "Plan your perfect trip with customized itineraries, budgets, and activity recommendations.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${newsreader.variable} ${plexMono.variable}`}>
        <SessionProvider>
          <Header />
          <Toaster position="top-right" />
          <main>{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}
