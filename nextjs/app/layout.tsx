import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DOM Replay",
  description: "Depth of Market Simulator using historical data",
}

declare global {
  interface Window {
    plausible: (eventName: string, {}) => void
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          data-domain="orderflowreplay.com"
          data-api="/plausible/event"
          src="/js/script.tagged-events.js"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
