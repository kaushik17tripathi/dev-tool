"use client";

import { useEffect } from "react";
import AppRoot from "@/components/AppRoot";
import "./sql-visualizer.css";

export default function SQLVisualizerPage() {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    return (
        <div className="sql-visualizer-page">
            <div className="sql-visualizer">
                <AppRoot />
            </div>
        </div>
    );
}
