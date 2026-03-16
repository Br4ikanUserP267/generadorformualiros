import type { Metadata } from 'next'
import { Inter, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });

export const metadata: Metadata = {
  title: 'Matriz de Riesgos - Clínica Santa María S.A.S',
  description: 'Sistema de gestión de matriz de riesgos para Clínica Santa María S.A.S',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" style={{ fontFamily: "'Inter', sans-serif" }}>
      <body className={`${inter.variable} ${syne.variable} antialiased`} style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
