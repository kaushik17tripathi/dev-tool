import React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Tag, BookOpen, Rss } from "lucide-react";
import { blogPosts, BlogPost } from "@/lib/blogRegistry";

export const metadata = {
    title: "Blog – DevWallah",
    description: "Tutorials, deep dives, and guides for the most powerful tools in the DevWallah suite. Learn JWT authentication, API testing, mock servers, regex, and more.",
};

const categoryColors: Record<string, string> = {
    Tutorial: "bg-accent/10 text-accent border border-accent/20",
    Guide: "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20",
    "Deep Dive": "bg-violet-500/10 text-violet-400 border border-violet-400/20",
    Comparison: "bg-amber-500/10 text-amber-400 border border-amber-400/20",
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className={`group block bg-background-card border border-border hover:border-accent/30 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5 hover:-translate-y-1 ${featured ? "md:col-span-2" : ""}`}
        >
            {/* Card top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-accent/60 via-accent to-transparent" />

            <div className={`p-8 ${featured ? "md:p-12" : ""}`}>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${categoryColors[post.category] || "bg-border text-text-muted"}`}>
                        {post.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> {post.readTime} min read
                    </span>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-auto">
                        {formatDate(post.publishedAt)}
                    </span>
                </div>

                <h2 className={`font-display font-black tracking-tight text-text-primary mb-4 group-hover:text-accent transition-colors duration-300 ${featured ? "text-3xl md:text-4xl" : "text-xl"}`}>
                    {post.title}
                </h2>

                <p className="text-text-muted font-medium leading-relaxed mb-8 line-clamp-3">
                    {post.description}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-background-input border border-border rounded-full text-text-muted">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-accent opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default function BlogPage() {
    const sorted = [...blogPosts].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    const [featured, ...rest] = sorted;

    return (
        <div className="max-w-5xl mx-auto space-y-20 py-8 pt-16">
            {/* Hero */}
            <section className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-text-primary text-background-base rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">DevWallah Blog</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[0.9]">
                    Guides,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-muted">
                        Tutorials & Deep Dives.
                    </span>
                </h1>
                <p className="text-xl text-text-muted font-medium leading-relaxed max-w-2xl">
                    Practical articles on developer tooling, authentication, API design,
                    and everything in between. Written by developers, for developers.
                </p>

                <div className="flex items-center gap-2 text-sm text-text-muted font-medium border border-border bg-background-card rounded-2xl px-5 py-3 w-fit">
                    <Rss className="w-4 h-4 text-accent" />
                    <span>{blogPosts.length} articles published</span>
                </div>
            </section>

            {/* Featured post */}
            <section>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted block mb-6">
                    Latest Article
                </span>
                <BlogCard post={featured} featured />
            </section>

            {/* All posts grid */}
            <section className="space-y-8">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted block">
                    All Articles
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rest.map((post) => (
                        <BlogCard key={post.slug} post={post} />
                    ))}
                </div>
            </section>
        </div>
    );
}
