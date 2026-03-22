import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-border py-12 bg-background-base mt-20">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-xl font-bold mb-4">DevWallah</h3>
                        <p className="text-text-muted mb-4 max-w-sm">
                            A private, fast, and free collection of tools for developers.
                            Everything runs locally in your browser. No data ever leaves your machine.
                        </p>
                        <Link href="/about" className="text-accent hover:underline text-sm font-medium">Learn more about our mission →</Link>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Tools</h4>
                        <ul className="space-y-2 text-text-muted">
                            <li><Link href="/tools/json-formatter" className="hover:text-accent transition-colors">JSON Formatter</Link></li>
                            <li><Link href="/tools/base64-encode-decode" className="hover:text-accent transition-colors">Base64 Encoder</Link></li>
                            <li><Link href="/tools/jwt-decoder" className="hover:text-accent transition-colors">JWT Decoder</Link></li>
                            <li><Link href="/tools/uuid-generator" className="hover:text-accent transition-colors">UUID Generator</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-text-muted">
                            <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-accent transition-colors text-text-muted/50 cursor-not-allowed">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-border pt-8 text-center text-text-muted text-sm">
                    <p>© {new Date().getFullYear()} DevWallah. Built with ❤️ for developers.</p>
                </div>
            </div>
        </footer>
    );
}
