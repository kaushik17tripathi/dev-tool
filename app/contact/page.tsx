import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = {
    title: "Contact & feedback",
    description:
        "Send feedback, report bugs, or suggest new developer tools for DevWallah. We read every message.",
    alternates: baseUrl ? { canonical: `${baseUrl}/contact` } : undefined,
    openGraph: {
        title: "Contact DevWallah",
        description:
            "Get in touch with feedback, bug reports, or tool ideas for our free developer utilities.",
        ...(baseUrl ? { url: `${baseUrl}/contact` } : {}),
    },
};

export default function ContactPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 pt-16 relative">
            {/* Background glow */}
            <div className="absolute inset-0 -z-10 h-[400px] w-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-accent/15 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none"></div>

            <div className="text-center max-w-2xl mx-auto mb-16 space-y-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Get in Touch</span>
                <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter">
                    Contact & Feedback
                </h1>
                <p className="text-xl text-text-muted font-medium leading-relaxed">
                    Questions, bugs, or ideas for new tools — tell us what you need.
                </p>
            </div>
            <ContactForm />
        </div>
    );
}
