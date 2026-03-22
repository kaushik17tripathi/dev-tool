import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/toolRegistry";

export async function generateMetadata(): Promise<Metadata> {
    const tool = getToolBySlug("json-to-typescript")!;
    return {
        title: `${tool.name} – Free Online Tool | DevWallah`,
        description: tool.description,
        keywords: tool.keywords,
    };
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
