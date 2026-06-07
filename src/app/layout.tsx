import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Scrum Poker',
  description: 'Fast, focused planning poker for your team. Self-hosted, no sign-up.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
