import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "next-themes"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Trust Ethiopia - Service Reviews & Ratings",
  description:
    "Discover trusted reviews of services and businesses in Ethiopia. Share your experience and help others make informed decisions.",
  icons: {
    icon: [
      {
        url: "/trustethiiopia.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/trustethiiopia.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/trustethiiopia.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/trustethiiopia.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
            <div className="flex flex-col min-h-screen">
              <main>{children}</main>
              
            </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}