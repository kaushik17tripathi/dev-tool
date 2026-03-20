import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Fake JSON Generator',
    description: 'Generate realistic fake JSON data from a custom schema for testing and prototyping.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
