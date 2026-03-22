import React from "react";
import { Hammer, Shield, Zap, Star } from "lucide-react";

export const metadata = {
    title: "About DevWallah – Our Mission & Privacy First Approach",
    description: "Learn more about DevWallah, a collection of free and private developer tools built for speed and security.",
};

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-16 py-8">
            <section className="text-center space-y-6">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Our Mission</h1>
                <p className="text-xl text-text-muted leading-relaxed max-w-2xl mx-auto">
                    We built DevWallah to provide developers with a fast, reliable, and
                    above all, **private** set of utilities for everyday tasks.
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                    <div className="bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                        <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <h2 className="text-2xl font-bold">Privacy First</h2>
                    <p className="text-text-muted leading-relaxed">
                        Many online tools send your data to their servers for processing.
                        DevWallah is different. Every single tool we build runs **100% locally**
                        in your browser. Your JSON, passwords, and tokens never leave your machine.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                        <Zap className="w-6 h-6 text-accent" />
                    </div>
                    <h2 className="text-2xl font-bold">Built for Speed</h2>
                    <p className="text-text-muted leading-relaxed">
                        DevWallah is designed to be lean and lightning fast. 
                        With zero ads and no intrusive tracking, you get a clean, 
                        uninterrupted experience every time you use our tools.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                        <Hammer className="w-6 h-6 text-accent" />
                    </div>
                    <h2 className="text-2xl font-bold">Developer Centric</h2>
                    <p className="text-text-muted leading-relaxed">
                        As developers ourselves, we know what makes a tool great:
                        a clean UI, keyboard shortcuts, and sensible defaults.
                        We strive to make every tool feel "just right".
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                        <Star className="w-6 h-6 text-accent" />
                    </div>
                    <h2 className="text-2xl font-bold">Free Forever</h2>
                    <p className="text-text-muted leading-relaxed">
                        DevWallah is free to use and will always be. We believe
                        essential developer utilities should be accessible to everyone
                        without any cost or account requirement.
                    </p>
                </div>
            </div>
        </div>
    );
}
