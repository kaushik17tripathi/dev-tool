import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/toolRegistry";

export async function generateMetadata(): Promise<Metadata> {
    const tool = getToolBySlug("list-sorter")!;
    return {
        title: `${tool.name} – Free Online Tool | DevToolbox`,
        description: tool.description,
        keywords: tool.keywords,
    };
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
