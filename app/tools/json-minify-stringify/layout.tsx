import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'JSON Minify & Stringify',
    description: 'Minify JSON and convert it to an escaped string literal for use in code.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
