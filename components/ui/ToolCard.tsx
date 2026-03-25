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
        <div className="group relative bg-background-card/65 backdrop-blur-xl border border-border/55 rounded-3xl p-6 transition-all duration-500 hover:border-accent/25 hover:bg-background-card/80 flex flex-col h-full overflow-hidden shadow-[0_1px_2px_rgb(var(--shadow)/0.05),0_22px_70px_-45px_rgb(var(--shadow)/0.32)]">
            {/* Favorite Toggle */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite?.(tool.slug);
                }}
                className={`absolute top-5 right-5 p-2 rounded-full transition-all z-20 
                    ${isFavorite
                        ? 'text-yellow-400 bg-yellow-400/10'
                        : 'text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100'
                    }`}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : 'stroke-[1.5]'}`} />
            </button>

            <Link href={`/tools/${tool.slug}`} className="absolute inset-0 z-10" />

            <div className="flex flex-col mb-4 relative z-0">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 text-accent border border-accent/15 rounded-2xl mb-8 group-hover:bg-accent group-hover:text-accent-fg group-hover:border-accent/30 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                    <IconComponent className="w-6 h-6" strokeWidth={1.5} />
                </div>
                
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">
                    {tool.category}
                </span>
            </div>

            <h3 className="text-xl font-display font-black tracking-tight mb-3 group-hover:text-accent transition-colors relative z-0">
                {tool.name}
            </h3>

            <p className="text-text-muted text-sm font-medium leading-relaxed line-clamp-2 md:line-clamp-3 mb-4 flex-grow relative z-0">
                {tool.description}
            </p>

            <div className="flex items-center justify-between text-text-primary mt-auto relative z-0">
                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:bg-accent group-hover:text-black group-hover:border-accent transition-all duration-300">
                    <ArrowRight className="w-4 h-4 group-hover:-rotate-45 transition-transform duration-300" strokeWidth={2} />
                </div>
            </div>
        </div>
    );
}
