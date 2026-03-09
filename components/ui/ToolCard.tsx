import Link from "next/link";
import * as Icons from "lucide-react";
import { type Tool } from "@/lib/toolRegistry";
import { Star, ArrowRight } from "lucide-react";

interface ToolCardProps {
    tool: Tool;
    isFavorite?: boolean;
    onToggleFavorite?: (slug: string) => void;
}

export default function ToolCard({ tool, isFavorite, onToggleFavorite }: ToolCardProps) {
    const IconComponent = (Icons as any)[tool.icon] || Icons.HelpCircle;

    return (
        <div className="group relative bg-background-card border border-border rounded-2xl p-6 card-hover shadow-sm flex flex-col h-full transition-all overflow-hidden">
            {/* Favorite Toggle */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite?.(tool.slug);
                }}
                className={`absolute top-4 right-4 p-2 rounded-xl transition-all z-20 
                    ${isFavorite
                        ? 'text-yellow-500 bg-yellow-500/10 opacity-100 scale-110'
                        : 'text-text-muted hover:text-yellow-500 hover:bg-yellow-500/10 opacity-0 group-hover:opacity-100'
                    }`}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <Link href={`/tools/${tool.slug}`} className="absolute inset-0 z-10" />

            <div className="flex items-start justify-between mb-4 relative z-0">
                <div className="bg-background-input p-3 rounded-xl border border-border group-hover:border-accent group-hover:bg-accent/5 transition-colors">
                    <IconComponent className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-background-input px-2 py-1 rounded border border-border">
                    {tool.category}
                </span>
            </div>

            <h3 className="text-lg font-bold mb-2 group-hover:text-accent transition-colors relative z-0">
                {tool.name}
            </h3>

            <p className="text-text-muted text-sm line-clamp-2 mb-4 flex-grow relative z-0">
                {tool.description}
            </p>

            <div className="flex items-center text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity relative z-0">
                <span>Try it now</span>
                <ArrowRight className="w-4 h-4 ml-1" />
            </div>
        </div>
    );
}
