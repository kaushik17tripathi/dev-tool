import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.devwallah.com';

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: {
        default: "DevWallah – Free & Private Online Developer Tools",
        template: "%s | DevWallah"
    },
    description: "A collection of fast, private, and free developer tools like JSON Formatter, Base64 Encoder, JWT Decoder, and more. No data ever leaves your browser.",
    icons: {
        icon: "/favicon.ico",
    },
    openGraph: {
        title: "DevWallah – Free & Private Online Developer Tools",
        description: "A collection of fast, private, and free developer tools. 100% client-side, 100% private.",
        url: baseUrl,
        siteName: "DevWallah",
        locale: "en_US",
        type: "website",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "DevWallah – Free & Private Online Developer Tools",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "DevWallah – Free & Private Online Developer Tools",
        description: "Fast, private, and free developer tools that run entirely in your browser.",
        images: ["/og-image.png"],
        creator: "@kaushik17",
    },
    alternates: {
        canonical: "/",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: "7KrxUR8tBCvO_D0CcXEIBRQZS3tHbGzvgaCPKB7WMcg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen flex flex-col`}>
                <ThemeProvider
                    attribute="data-theme"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Navbar />
                    <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
                        {children}
                    </main>
                    <Footer />
                </ThemeProvider>
                {process.env.NEXT_PUBLIC_GA_ID && (
                    <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
                )}
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
