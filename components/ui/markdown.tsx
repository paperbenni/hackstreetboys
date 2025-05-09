import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  const markdownClassNames = cn(
    "prose dark:prose-invert max-w-none prose-headings:scroll-m-20 prose-headings:font-semibold",
    "prose-h1:text-xl prose-h1:font-bold prose-h2:text-lg prose-h2:font-semibold",
    "prose-p:leading-7 prose-a:text-blue-600 dark:prose-a:text-blue-400",
    "prose-a:font-medium prose-a:underline prose-a:underline-offset-4 prose-a:decoration-blue-400/50",
    "prose-a:hover:decoration-blue-500 dark:prose-a:decoration-blue-500/50 dark:prose-a:hover:decoration-blue-400",
    "prose-strong:font-semibold prose-code:rounded-sm prose-code:bg-blue-100/60 dark:prose-code:bg-blue-900/40",
    "prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm",
    "prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-blue-100/30 dark:prose-pre:bg-blue-950/50",
    "prose-pre:border prose-pre:border-blue-200 dark:prose-pre:border-blue-800",
    "prose-pre:p-4 prose-img:rounded-md prose-img:border prose-img:border-border",
    "prose-hr:border-border prose-blockquote:border-l-4 prose-blockquote:border-blue-300 dark:prose-blockquote:border-blue-700",
    "prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-blue-800/80 dark:prose-blockquote:text-blue-300/80",
    "prose-ul:list-disc prose-ol:list-decimal",
    className
  );

  return (
    <div className={markdownClassNames}>
      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    </div>
  );
}