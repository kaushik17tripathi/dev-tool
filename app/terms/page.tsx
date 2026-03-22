import React from "react";
import Link from "next/link";

export const metadata = {
    title: "Terms of Service – DevWallah",
    description:
        "Terms of Service for DevWallah: acceptable use, disclaimers, and limitations for our free developer tools.",
};

export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto py-12 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
                <p className="text-text-muted">Last Updated: March 22, 2026</p>
            </div>

            <section className="space-y-6">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">1. Agreement to Terms</h2>
                    <p className="text-text-muted leading-relaxed">
                        By accessing or using DevWallah (“we,” “us,” or “the site”), you agree to these Terms of
                        Service. If you do not agree, please do not use the site.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">2. Description of Service</h2>
                    <p className="text-text-muted leading-relaxed">
                        DevWallah provides free, browser-based developer utilities. Features and tools may change
                        or be discontinued at any time without notice.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">3. Acceptable Use</h2>
                    <p className="text-text-muted leading-relaxed">
                        You agree to use the site only for lawful purposes. You must not attempt to disrupt the
                        service, probe for vulnerabilities in ways that violate applicable law, or use the tools to
                        harm others or infringe third-party rights.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">4. No Warranty</h2>
                    <p className="text-text-muted leading-relaxed">
                        The site and all tools are provided “as is” and “as available,” without warranties of any
                        kind, express or implied. We do not warrant that results will be accurate, complete, or
                        suitable for any particular purpose.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">5. Limitation of Liability</h2>
                    <p className="text-text-muted leading-relaxed">
                        To the fullest extent permitted by law, DevWallah and its contributors shall not be
                        liable for any indirect, incidental, special, consequential, or punitive damages, or any
                        loss of data, profits, or goodwill, arising from your use of the site.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">6. Changes</h2>
                    <p className="text-text-muted leading-relaxed">
                        We may update these terms from time to time. Continued use of the site after changes
                        constitutes acceptance of the revised terms.
                    </p>
                </div>

                <div className="space-y-4 pt-8 border-t border-border">
                    <h2 className="text-xl font-bold">Contact</h2>
                    <p className="text-text-muted">
                        Questions about these terms? Reach out via our <Link href="/contact" className="text-accent hover:underline">contact page</Link>.
                    </p>
                </div>
            </section>
        </div>
    );
}
