import type { Metadata } from 'next'
import { Inter, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });

export const metadata: Metadata = {
  title: 'Matriz de Riesgos - Clínica Santa María S.A.S',
  description: 'Sistema de gestión de matriz de riesgos para Clínica Santa María S.A.S',
  generator: 'v0.app',
  icons: {
    icon: '/matriz-riesgos/csmLOGO_1_.png',
    shortcut: '/matriz-riesgos/csmLOGO_1_.png',
    apple: '/matriz-riesgos/csmLOGO_1_.png',
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
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
