"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools, type Tool } from "@/lib/toolRegistry";

/** Featured in the footer; full catalog is on the home page. */
const FOOTER_FEATURED_SLUGS = [
    "json-formatter",
    "base64-encoder-decoder",
    "jwt-decoder",
    "uuid-generator",
] as const;

function featuredFooterTools(): Tool[] {
    return FOOTER_FEATURED_SLUGS.map((slug) => tools.find((t) => t.slug === slug)).filter(
        (t): t is Tool => t !== undefined
    );
}

function toolLinkClass(pathname: string | null, href: string): string {
    const base = "transition-colors hover:text-accent";
    const active = pathname === href;
    return active ? `${base} text-accent font-medium` : `${base} text-text-muted`;
}

export default function Footer() {
    const pathname = usePathname();
    const featured = featuredFooterTools();

    return (
        <footer className="border-t border-border py-14 bg-background-base mt-20">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-14 md:items-start">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-xl font-bold mb-4">DevWallah</h3>
                        <p className="text-text-muted mb-4 max-w-sm leading-relaxed">
                            A private, fast, and free collection of tools for developers.
                            Everything runs locally in your browser. No data ever leaves your machine.
                        </p>
                        <Link href="/about" className="text-accent hover:underline text-sm font-medium">
                            Learn more about our mission →
                        </Link>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Tools</h4>
                        <ul className="space-y-2">
                            {featured.map((tool) => {
                                const href = `/tools/${tool.slug}`;
                                return (
                                    <li key={tool.slug}>
                                        <Link
                                            href={href}
                                            className={toolLinkClass(pathname, href)}
                                            aria-current={pathname === href ? "page" : undefined}
                                        >
                                            {tool.name}
                                        </Link>
                                    </li>
                                );
                            })}
                            <li className="pt-1">
                                <Link
                                    href="/#tools"
                                    className="text-sm font-medium text-accent hover:underline"
                                >
                                    Browse all tools →
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-text-muted">
                            <li>
                                <Link
                                    href="/contact"
                                    className={toolLinkClass(pathname, "/contact")}
                                    aria-current={pathname === "/contact" ? "page" : undefined}
                                >
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-accent transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-accent transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-border pt-10 pb-2">
                    <p className="text-center text-text-muted text-sm leading-relaxed">
                        © {new Date().getFullYear()} DevWallah. Built with ❤️ for developers.
                    </p>
                </div>
            </div>
        </footer>
    );
}
