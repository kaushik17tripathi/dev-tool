"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools, type Tool } from "@/lib/toolRegistry";
import { Hammer } from "lucide-react";

const FOOTER_FEATURED_SLUGS = [
    "json-formatter",
    "base64-encoder-decoder",
    "jwt-decoder",
    "uuid-generator",
    "password-generator",
    "regex-tester",
] as const;

function featuredFooterTools(): Tool[] {
    return FOOTER_FEATURED_SLUGS.map((slug) => tools.find((t) => t.slug === slug)).filter(
        (t): t is Tool => t !== undefined
    );
}

export default function Footer() {
    const pathname = usePathname();
    const featured = featuredFooterTools();

    const isActive = (href: string) => pathname === href;

    return (
        <footer className="relative mt-32 border-t border-border/50 bg-background-base">
            {/* Gradient top border effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>

            <div className="container mx-auto px-4 max-w-7xl">
                {/* Big wordmark */}
                <div className="py-16 md:py-20">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="bg-text-primary p-2 rounded-full group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <Hammer className="w-5 h-5 text-background-base" />
                        </div>
                        <span className="text-4xl md:text-5xl font-display font-black tracking-tighter">DevWallah</span>
                    </Link>
                    <p className="text-text-muted font-medium mt-4 max-w-md leading-relaxed">
                        A private, blazing-fast, and free collection of developer tools.
                        Everything runs locally in your browser sandbox.
                    </p>
                </div>

                {/* 4 Column Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-12 border-t border-border/40">
                    {/* Popular Tools */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-6">Popular Tools</h4>
                        <ul className="space-y-3">
                            {featured.slice(0, 3).map((tool) => {
                                const href = `/tools/${tool.slug}`;
                                return (
                                    <li key={tool.slug}>
                                        <Link
                                            href={href}
                                            className={`text-sm font-medium transition-colors hover:text-accent ${isActive(href) ? 'text-accent' : 'text-text-muted'}`}
                                        >
                                            {tool.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* More Tools */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-6">More Tools</h4>
                        <ul className="space-y-3">
                            {featured.slice(3).map((tool) => {
                                const href = `/tools/${tool.slug}`;
                                return (
                                    <li key={tool.slug}>
                                        <Link
                                            href={href}
                                            className={`text-sm font-medium transition-colors hover:text-accent ${isActive(href) ? 'text-accent' : 'text-text-muted'}`}
                                        >
                                            {tool.name}
                                        </Link>
                                    </li>
                                );
                            })}
                            <li>
                                <Link href="/#tools" className="text-sm font-bold text-accent hover:underline">
                                    Browse all →
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-6">Resources</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/about" className={`text-sm font-medium transition-colors hover:text-accent ${isActive('/about') ? 'text-accent' : 'text-text-muted'}`}>
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="/changelog" className={`text-sm font-medium transition-colors hover:text-accent ${isActive('/changelog') ? 'text-accent' : 'text-text-muted'}`}>
                                    Changelog
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className={`text-sm font-medium transition-colors hover:text-accent ${isActive('/contact') ? 'text-accent' : 'text-text-muted'}`}>
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-6">Legal</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/privacy" className={`text-sm font-medium transition-colors hover:text-accent ${isActive('/privacy') ? 'text-accent' : 'text-text-muted'}`}>
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className={`text-sm font-medium transition-colors hover:text-accent ${isActive('/terms') ? 'text-accent' : 'text-text-muted'}`}>
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-border/40 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-text-muted text-xs font-medium">
                        © {new Date().getFullYear()} DevWallah. Made with precision for developers.
                    </p>
                    <p className="text-text-muted/50 text-xs font-medium">
                        All tools run 100% client-side. Your data never touches a server.
                    </p>
                </div>
            </div>
        </footer>
    );
}
