import type { Metadata } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"
import FloatingShapes from "@/components/ui/FloatingShapes";

const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });
const dmSans = DM_Sans({ subsets: ["latin"], variable: '--font-dm-sans' });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: '--font-jetbrains' });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.devwallah.com';

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    applicationName: "DevWallah",
    publisher: "DevWallah",
    icons: {
        icon: [
            { url: "/favicon.svg", type: "image/svg+xml" },
            { url: "/icon.svg", type: "image/svg+xml" },
        ],
        shortcut: "/favicon.svg",
        apple: "/favicon.svg",
    },
    appleWebApp: {
        title: "DevWallah",
        statusBarStyle: "default",
    },
    title: {
        default: "DevWallah – Free & Private Online Developer Tools",
        template: "%s | DevWallah"
    },
    description: "A collection of fast, private, and free developer tools like JSON Formatter, Base64 Encoder, JWT Decoder, and more. No data ever leaves your browser.",
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
            <body className={`${dmSans.className} ${outfit.variable} ${jetbrains.variable} font-sans min-h-screen flex flex-col antialiased selection:bg-accent selection:text-accent-fg relative`}>
                <ThemeProvider
                    attribute="data-theme"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <div
                        className="absolute inset-0 -z-30"
                        style={{
                            backgroundImage:
                                "radial-gradient(1150px circle at 18% -10%, rgb(var(--accent) / var(--accent-glow)), transparent 58%), radial-gradient(850px circle at 88% 0%, rgb(var(--accent) / calc(var(--accent-glow) * 0.7)), transparent 56%), linear-gradient(to bottom, rgb(var(--background-base)) 0%, rgb(var(--background-base)) 65%, rgb(var(--background-base) / 0.92) 100%)",
                        }}
                    />
                    <div className="absolute inset-0 -z-20 h-full w-full bg-grid [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                    <FloatingShapes />
                    <Navbar />
                    <main className="flex-grow container mx-auto px-4 py-12 max-w-7xl relative z-0">
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
