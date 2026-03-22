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
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    Contact & feedback
                </h1>
                <p className="text-text-muted leading-relaxed">
                    Questions, bugs, or ideas for new tools — tell us what you need.
                </p>
            </div>
            <ContactForm />
        </div>
    );
}
