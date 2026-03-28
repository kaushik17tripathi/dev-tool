import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Tag, Calendar, User, ExternalLink, Info, AlertTriangle, Lightbulb } from "lucide-react";
import { blogPosts, getBlogPostBySlug, BlogSection } from "@/lib/blogRegistry";
import { getToolBySlug } from "@/lib/toolRegistry";

export async function generateStaticParams() {
    return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = getBlogPostBySlug(params.slug);
    if (!post) return {};
    return {
        title: `${post.title} – DevWallah Blog`,
        description: post.description,
    };
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

const categoryColors: Record<string, string> = {
    Tutorial: "bg-accent/10 text-accent border border-accent/20",
    Guide: "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20",
    "Deep Dive": "bg-violet-500/10 text-violet-400 border border-violet-400/20",
    Comparison: "bg-amber-500/10 text-amber-400 border border-amber-400/20",
};

const calloutStyles: Record<string, { border: string; bg: string; icon: React.ReactNode; label: string }> = {
    info: {
        border: "border-l-4 border-blue-500/60",
        bg: "bg-blue-500/5",
        icon: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
        label: "Note",
    },
    warning: {
        border: "border-l-4 border-amber-500/60",
        bg: "bg-amber-500/5",
        icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
        label: "Warning",
    },
    tip: {
        border: "border-l-4 border-emerald-500/60",
        bg: "bg-emerald-500/5",
        icon: <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
        label: "Tip",
    },
};

function RenderSection({ section }: { section: BlogSection }) {
    switch (section.type) {
        case "heading":
            return (
                <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight text-text-primary mt-12 mb-4 first:mt-0">
                    {section.text}
                </h2>
            );
        case "subheading":
            return (
                <h3 className="text-lg font-display font-bold tracking-tight text-text-primary mt-8 mb-3">
                    {section.text}
                </h3>
            );
        case "paragraph":
            return (
                <p className="text-text-muted font-medium leading-relaxed text-base">
                    {section.text}
                </p>
            );
        case "code":
            return (
                <div className="rounded-2xl overflow-hidden border border-border my-6">
                    {section.language && (
                        <div className="px-4 py-2 bg-background-input border-b border-border flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-error/60" />
                                <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                                <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">
                                {section.language}
                            </span>
                        </div>
                    )}
                    <pre className="bg-[#0d1117] text-[13px] text-gray-300 font-mono p-6 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                        {section.text}
                    </pre>
                </div>
            );
        case "list":
            return (
                <ul className="space-y-3 my-4">
                    {section.items?.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-text-muted font-medium leading-relaxed">
                            <span className="text-accent font-black text-xs mt-1 shrink-0">
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            );
        case "callout": {
            const style = calloutStyles[section.variant || "info"];
            return (
                <div className={`rounded-xl p-5 flex gap-3 my-6 ${style.border} ${style.bg}`}>
                    {style.icon}
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">
                            {style.label}
                        </span>
                        <p className="text-text-muted font-medium leading-relaxed text-sm">
                            {section.text}
                        </p>
                    </div>
                </div>
            );
        }
        default:
            return null;
    }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = getBlogPostBySlug(params.slug);
    if (!post) notFound();

    const relatedTool = post.relatedTool ? getToolBySlug(post.relatedTool) : null;
    const otherPosts = blogPosts
        .filter((p) => p.slug !== post.slug)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 3);

    return (
        <div className="max-w-3xl mx-auto py-8 pt-16">
            {/* Back */}
            <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-accent transition-colors mb-10"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
            </Link>

            {/* Article Header */}
            <header className="mb-12 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${categoryColors[post.category] || "bg-border text-text-muted"}`}>
                        {post.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> {post.readTime} min read
                    </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter leading-[1] text-text-primary">
                    {post.title}
                </h1>

                <p className="text-lg text-text-muted font-medium leading-relaxed">
                    {post.description}
                </p>

                <div className="flex flex-wrap gap-4 text-[11px] font-bold text-text-muted pt-2 border-t border-border">
                    <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {post.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(post.publishedAt)}
                    </span>
                </div>
            </header>

            {/* Related Tool CTA */}
            {relatedTool && (
                <Link
                    href={`/tools/${relatedTool.slug}`}
                    className="group flex items-center justify-between p-5 mb-12 bg-accent/5 border border-accent/20 rounded-2xl hover:bg-accent/10 hover:border-accent/40 transition-all duration-300"
                >
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent block mb-1">Try the Tool</span>
                        <span className="font-bold text-text-primary">{relatedTool.name}</span>
                        <p className="text-xs text-text-muted mt-1">{relatedTool.description}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-accent opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
            )}

            {/* Article body */}
            <article className="space-y-6">
                {post.content.map((section, idx) => (
                    <RenderSection key={idx} section={section} />
                ))}
            </article>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-14 pt-10 border-t border-border">
                <Tag className="w-4 h-4 text-text-muted mr-1" />
                {post.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-background-input border border-border rounded-full text-text-muted">
                        {tag}
                    </span>
                ))}
            </div>

            {/* More posts */}
            {otherPosts.length > 0 && (
                <section className="mt-16 space-y-6">
                    <h2 className="text-2xl font-display font-black tracking-tight">More Articles</h2>
                    <div className="space-y-4">
                        {otherPosts.map((p) => (
                            <Link
                                key={p.slug}
                                href={`/blog/${p.slug}`}
                                className="group flex items-center justify-between p-5 bg-background-card border border-border hover:border-accent/30 rounded-2xl transition-all duration-300 hover:shadow-lg"
                            >
                                <div className="pr-4">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${categoryColors[p.category] || ""}`}>
                                            {p.category}
                                        </span>
                                        <span className="text-[10px] text-text-muted font-bold">{p.readTime} min</span>
                                    </div>
                                    <span className="font-bold text-text-primary group-hover:text-accent transition-colors">
                                        {p.title}
                                    </span>
                                </div>
                                <ArrowLeft className="w-4 h-4 text-text-muted rotate-180 shrink-0 group-hover:text-accent transition-colors" />
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
