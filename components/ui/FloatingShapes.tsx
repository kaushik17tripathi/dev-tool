"use client";

/**
 * Very subtle, slow-moving geometric shapes floating behind page content.
 * Pure CSS animations. Near-invisible opacity for texture, not distraction.
 */
export default function FloatingShapes() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
            {/* Large circle top-right */}
            <div
                className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full border border-border/20 opacity-[0.04]"
                style={{ animation: "floatSlow 25s ease-in-out infinite" }}
            />
            {/* Small square mid-left */}
            <div
                className="absolute top-1/3 -left-16 w-32 h-32 border border-border/30 rotate-45 opacity-[0.03]"
                style={{ animation: "floatSlow 20s ease-in-out infinite reverse" }}
            />
            {/* Medium circle bottom-left */}
            <div
                className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full border border-accent/10 opacity-[0.04]"
                style={{ animation: "floatSlow 30s ease-in-out infinite" }}
            />
            {/* Tiny dot cluster right */}
            <div
                className="absolute top-2/3 right-1/6 w-48 h-48 rounded-full bg-accent/5 blur-3xl opacity-[0.06]"
                style={{ animation: "floatSlow 22s ease-in-out infinite reverse" }}
            />
            {/* Large rotating square bottom right */}
            <div
                className="absolute -bottom-20 -right-20 w-80 h-80 border border-border/15 opacity-[0.03]"
                style={{ animation: "floatRotate 35s linear infinite" }}
            />
        </div>
    );
}
