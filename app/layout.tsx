import { Press_Start_2P, VT323 } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { AuthSessionProvider } from "@/components/auth/session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Aurora",
  description: "Tim's token furnace",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

const pixelHeading = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel-heading",
})

const pixelBody = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "dark",
        pixelBody.variable,
        pixelHeading.variable,
        "font-pixel"
      )}
    >
      <body>
        <ThemeProvider forcedTheme="dark" enableSystem={false}>
          <AuthSessionProvider>
            <AppShell>{children}</AppShell>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
