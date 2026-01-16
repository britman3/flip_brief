import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flip Brief Generator',
  description: 'Generate one-page property flip briefs with AI-powered location recommendations',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
