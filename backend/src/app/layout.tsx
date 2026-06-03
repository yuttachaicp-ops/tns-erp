import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TNS ERP v2.0 — COMMAND CENTER',
  description: 'TNS ERP Daily Operations System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
