"use client";

import React, { useMemo, useState } from "react";
import { Send, Copy, Check, Loader2 } from "lucide-react";

function buildPlainText(params: {
    name: string;
    email: string;
    subject: string;
    message: string;
}): string {
    const lines: string[] = [];
    if (params.name.trim()) lines.push(`Name: ${params.name.trim()}`);
    if (params.email.trim()) lines.push(`Reply-to: ${params.email.trim()}`);
    if (lines.length) lines.push("");
    lines.push(params.message.trim());
    return lines.join("\n");
}

export default function ContactForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [company, setCompany] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [copyDone, setCopyDone] = useState(false);

    const plainText = useMemo(
        () => buildPlainText({ name, email, subject, message }),
        [name, email, subject, message]
    );

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(plainText);
        setCopyDone(true);
        setTimeout(() => setCopyDone(false), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = message.trim();
        if (!trimmed) return;

        setError(null);
        setSuccess(false);
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    subject,
                    message,
                    company,
                }),
            });

            const data = (await res.json().catch(() => ({}))) as {
                error?: string;
            };

            if (res.ok) {
                setSuccess(true);
                setMessage("");
                setSubject("");
                return;
            }

            if (res.status === 503) {
                setError(
                    data.error ??
                        "Email is not configured here yet. You can copy your message below."
                );
                return;
            }

            setError(data.error ?? "Something went wrong. Please try again.");
        } catch {
            setError("Network error. Check your connection and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact" className="max-w-2xl mx-auto scroll-mt-24">
            <div className="bg-background-card border border-border rounded-2xl p-8 md:p-10 shadow-xl shadow-accent/5">
                <h2 className="text-xl font-bold mb-2">Your message</h2>
                <p className="text-text-muted text-sm mb-8 leading-relaxed">
                    Submit below — we deliver it in the background (no mail app required).
                </p>

                {success && (
                    <div
                        className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-text-primary"
                        role="status"
                    >
                        Thanks — your message was sent. We will read it soon.
                    </div>
                )}

                {error && (
                    <div
                        className="mb-6 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-text-primary space-y-3"
                        role="alert"
                    >
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => void copyToClipboard()}
                            className="btn-secondary inline-flex items-center gap-2 py-2 px-4 text-sm"
                        >
                            {copyDone ? (
                                <>
                                    <Check className="w-4 h-4 text-success" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy message as text
                                </>
                            )}
                        </button>
                    </div>
                )}

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
                    <div className="sr-only" aria-hidden="true">
                        <label htmlFor="contact-company">Company</label>
                        <input
                            id="contact-company"
                            type="text"
                            name="company"
                            tabIndex={-1}
                            autoComplete="off"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="contact-name" className="label">
                                Name{" "}
                                <span className="font-normal normal-case tracking-normal text-text-muted">
                                    (optional)
                                </span>
                            </label>
                            <input
                                id="contact-name"
                                type="text"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field w-full"
                                placeholder="Ada Lovelace"
                            />
                        </div>
                        <div>
                            <label htmlFor="contact-email" className="label">
                                Email{" "}
                                <span className="font-normal normal-case tracking-normal text-text-muted">
                                    (optional)
                                </span>
                            </label>
                            <input
                                id="contact-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field w-full"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="contact-subject" className="label">
                            Subject{" "}
                            <span className="font-normal normal-case tracking-normal text-text-muted">
                                (optional)
                            </span>
                        </label>
                        <input
                            id="contact-subject"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="input-field w-full"
                            placeholder="Feature idea / bug / …"
                        />
                    </div>

                    <div>
                        <label htmlFor="contact-message" className="label">
                            Message
                        </label>
                        <textarea
                            id="contact-message"
                            required
                            rows={6}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="input-field w-full resize-y min-h-[140px]"
                            placeholder="Write whatever you need to send…"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending…
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send message
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
