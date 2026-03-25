import React from "react";
import { Hammer, Shield, Zap, Star, Globe, Lock, Cpu, Users } from "lucide-react";

export const metadata = {
    title: "About DevWallah – Our Mission & Privacy First Approach",
    description: "Learn more about DevWallah, a collection of free and private developer tools built for speed and security.",
};

export default function AboutPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-24 py-8 pt-16">
            {/* Hero */}
            <section className="space-y-8 max-w-3xl">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">About</span>
                <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[0.9]">
                    Built by developers,<br />for developers.
                </h1>
                <p className="text-xl text-text-muted font-medium leading-relaxed max-w-2xl">
                    We built DevWallah to provide a fast, reliable, and above all,
                    private set of utilities for everyday developer tasks.
                </p>
            </section>

            {/* Values Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/50 p-px overflow-hidden">
                <div className="bg-background-card p-12 space-y-6 hover:bg-background-input/50 transition-colors duration-500">
                    <div className="w-14 h-14 bg-text-primary text-background-base rounded-2xl flex items-center justify-center">
                        <Shield className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-display font-black tracking-tight">Privacy First</h2>
                    <p className="text-text-muted font-medium leading-relaxed">
                        Many online tools send your data to their servers for processing.
                        DevWallah is different. Every single tool runs 100% locally
                        in your browser. Your JSON, passwords, and tokens never leave your machine.
                    </p>
                </div>

                <div className="bg-background-card p-12 space-y-6 hover:bg-background-input/50 transition-colors duration-500">
                    <div className="w-14 h-14 bg-text-primary text-background-base rounded-2xl flex items-center justify-center">
                        <Zap className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-display font-black tracking-tight">Built for Speed</h2>
                    <p className="text-text-muted font-medium leading-relaxed">
                        DevWallah is designed to be lean and lightning fast.
                        With zero ads and no intrusive tracking, you get a clean,
                        uninterrupted experience every time you use our tools.
                    </p>
                </div>

                <div className="bg-background-card p-12 space-y-6 hover:bg-background-input/50 transition-colors duration-500">
                    <div className="w-14 h-14 bg-text-primary text-background-base rounded-2xl flex items-center justify-center">
                        <Hammer className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-display font-black tracking-tight">Developer Centric</h2>
                    <p className="text-text-muted font-medium leading-relaxed">
                        As developers ourselves, we know what makes a tool great:
                        a clean UI, keyboard shortcuts, and sensible defaults.
                        We strive to make every tool feel &ldquo;just right&rdquo;.
                    </p>
                </div>

                <div className="bg-background-card p-12 space-y-6 hover:bg-background-input/50 transition-colors duration-500">
                    <div className="w-14 h-14 bg-text-primary text-background-base rounded-2xl flex items-center justify-center">
                        <Star className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-display font-black tracking-tight">Free Forever</h2>
                    <p className="text-text-muted font-medium leading-relaxed">
                        DevWallah is free to use and will always be. We believe
                        essential developer utilities should be accessible to everyone
                        without any cost or account requirement.
                    </p>
                </div>
            </section>

            {/* By the Numbers */}
            <section className="space-y-12">
                <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">By the Numbers</span>
                    <h2 className="text-4xl font-display font-black tracking-tight">DevWallah at a glance</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { icon: Cpu, value: "35+", label: "Tools Built" },
                        { icon: Lock, value: "0", label: "Server Calls" },
                        { icon: Globe, value: "100%", label: "Client-Side" },
                        { icon: Users, value: "Free", label: "For Everyone" },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center space-y-4 p-6">
                            <stat.icon className="w-8 h-8 text-text-muted mx-auto" strokeWidth={1.5} />
                            <div className="text-4xl font-display font-black text-accent tracking-tighter">{stat.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
