import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'JSON Schema Validator',
    description: 'Validate a JSON document against a JSON Schema to ensure it matches the expected structure.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
