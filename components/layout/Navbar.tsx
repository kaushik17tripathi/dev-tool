"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Hammer, Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AccentPicker from "@/components/ui/AccentPicker";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <nav className={`pointer-events-auto bg-background-card/60 backdrop-blur-2xl border border-border/50 rounded-[32px] px-6 flex flex-col transition-all duration-500 shadow-[0_1px_2px_rgb(var(--shadow)/0.05),0_20px_55px_-35px_rgb(var(--shadow)/0.35)] max-w-5xl w-full text-text-primary ${isOpen ? 'h-[280px] pt-4 pb-8' : 'h-14 items-center justify-between'}`}>
                
                <div className="flex items-center justify-between w-full h-14 shrink-0">
                    <Link href="/" className="flex items-center gap-2 group" onClick={() => setIsOpen(false)}>
                        <div className="bg-accent/10 text-accent p-1.5 rounded-full border border-accent/15 group-hover:bg-accent group-hover:text-accent-fg group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                            <Hammer className="w-4 h-4" />
                        </div>
                        <span className="font-display font-black text-lg tracking-tighter">DevWallah</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        <Link href="/" className="text-sm font-bold text-text-muted hover:text-accent transition-colors">Tools</Link>
                        <Link href="/about" className="text-sm font-bold text-text-muted hover:text-accent transition-colors">About</Link>
                        <Link href="/contact" className="text-sm font-bold text-text-muted hover:text-accent transition-colors">Contact</Link>
                        <Link href="/changelog" className="text-sm font-bold text-text-muted hover:text-accent transition-colors">Updates</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <AccentPicker />
                        <ThemeToggle />
                        {/* Mobile Menu Toggle */}
                        <button 
                            onClick={toggleMenu}
                            className="p-2 md:hidden hover:bg-background-input rounded-full transition-colors"
                        >
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Links */}
                {isOpen && (
                    <div className="flex flex-col gap-4 mt-8 px-2 md:hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        <Link href="/" className="text-xl font-display font-black tracking-tight" onClick={() => setIsOpen(false)}>
                            Tools
                        </Link>
                        <Link href="/about" className="text-xl font-display font-black tracking-tight flex items-center justify-between group" onClick={() => setIsOpen(false)}>
                            About
                        </Link>
                        <Link href="/contact" className="text-xl font-display font-black tracking-tight flex items-center justify-between group" onClick={() => setIsOpen(false)}>
                            Contact
                        </Link>
                        <Link href="/changelog" className="text-xl font-display font-black tracking-tight flex items-center justify-between group" onClick={() => setIsOpen(false)}>
                            Changelog
                        </Link>
                    </div>
                )}
            </nav>
        </div>
    );
}
