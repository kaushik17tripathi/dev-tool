import React from "react";
import Link from "next/link";

export const metadata = {
    title: "Privacy Policy – DevWallah",
    description: "DevWallah privacy policy: We do not collect, store, or transmit any of your data.",
};

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto py-12 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
                <p className="text-text-muted">Last Updated: March 9, 2026</p>
            </div>

            <section className="space-y-6">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">1. Our Commitment to Privacy</h2>
                    <p className="text-text-muted leading-relaxed">
                        At DevWallah, your privacy is our single most important feature.
                        We believe that you should be able to use developer tools without
                        worrying about where your sensitive data is being sent.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">2. Local Processing Only</h2>
                    <p className="text-text-muted leading-relaxed font-bold">
                        All tools on DevWallah process data exclusively on your device.
                    </p>
                    <p className="text-text-muted leading-relaxed">
                        When you paste a JSON string, a JWT token, or generate a password,
                        the processing is done by the JavaScript running in your browser.
                        No data is uploaded to our servers as part of these operations.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">3. No Personal Data Collection</h2>
                    <p className="text-text-muted leading-relaxed">
                        We do not require you to create an account, provide an email address,
                        or reveal any personal information to use our tools.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">4. Analytics</h2>
                    <p className="text-text-muted leading-relaxed">
                        We use a privacy-friendly analytics service (like Plausible or Umami)
                        to understand high-level traffic patterns. This does NOT collect any
                        PII (Personally Identifiable Information) and does not use cookies in
                        a way that tracks individuals across the web.
                    </p>
                </div>

                <div className="space-y-4 pt-8 border-t border-border">
                    <h2 className="text-xl font-bold">Contact</h2>
                    <p className="text-text-muted">
                        If you have any questions about this policy, please reach out
                        via our <Link href="/contact" className="text-accent hover:underline">contact page</Link>.
                    </p>
                </div>
            </section>
        </div>
    );
}
