import { Inter } from "next/font/google"
import SessionProvider from "../components/providers/SessionProvider"
import Header from "../components/layout/Header"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "GlobeTrotter - Travel Planning Made Easy",
  description: "Plan your perfect trip with customized itineraries, budgets, and activity recommendations.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <Header />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  )
}
