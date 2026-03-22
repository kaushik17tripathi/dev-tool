import { marked } from "marked";
import markedFootnote from "marked-footnote";

marked.use(markedFootnote());

export function renderMarkdownToHtml(markdown: string): string {
    return marked.parse(markdown, { async: false }) as string;
}
