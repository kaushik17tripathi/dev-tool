import type { Metadata } from 'next';
import { getToolBySlug } from '@/lib/toolRegistry';

export const metadata: Metadata = {
    title: 'cURL Comparator',
    description: 'Compare two cURL commands side-by-side to find differences in headers, body, or URL.',
};

export default function cURLComparatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
