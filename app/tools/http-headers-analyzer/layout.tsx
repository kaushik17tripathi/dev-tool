import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/toolRegistry';

export const metadata: Metadata = {
    title: 'HTTP Headers Analyzer',
    description: 'Analyze raw HTTP headers to understand their purpose and security implications.',
};

export default function HTTPHeadersAnalyzerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
