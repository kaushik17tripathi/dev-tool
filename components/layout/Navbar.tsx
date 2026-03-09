import Link from "next/link";
import { Hammer } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Navbar() {
    return (
        <nav className="border-b border-border bg-background-base sticky top-0 z-50 transition-colors">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl text-text-primary">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-accent p-1.5 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-accent/20">
                        <Hammer className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">DevToolbox</span>
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-text-muted hover:text-text-primary transition-colors font-medium">Tools</Link>
                    <Link href="/about" className="text-text-muted hover:text-text-primary transition-colors font-medium">About</Link>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link
                        href="https://github.com/kaushik-tripathi/devtoolbox"
                        target="_blank"
                        className="hidden sm:flex btn-secondary py-1.5 px-4 text-xs items-center gap-2"
                    >
                        <span>GitHub</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
