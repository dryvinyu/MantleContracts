import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import localFont from 'next/font/local'

import Header from '@/components/business/Header'
import CopilotProvider from '@/lib/providers/CopilotProvider'
import WalletProvider from '@/lib/providers/WalletProvider'
import { PortfolioProvider } from '@/lib/providers/PortfolioProvider'

import './globals.css'

const font = localFont({
  src: [
    {
      path: './fonts/NunitoSans.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-nunito-sans',
})

export const metadata: Metadata = {
  title: 'Mantle RealFi Console App',
  description: 'Mantle RealFi Console App',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${font.variable} antialiased w-screen min-h-screen flex flex-col`}
      >
        <div className="app-shell">
          <div className="app-shell__bg" />
          <div className="app-shell__grid" />
          <WalletProvider>
            <PortfolioProvider>
              <CopilotProvider>
                <Header />
                <main className="flex-1">{children}</main>
              </CopilotProvider>
            </PortfolioProvider>
          </WalletProvider>
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
