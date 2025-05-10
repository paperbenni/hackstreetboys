import { EnhancedMarkdown } from './enhanced-markdown';
import { useTheme } from 'next-themes';

interface MarkdownProps {
  content: string;
  className?: string;
  maxHeight?: string;
  preventTruncation?: boolean;
  maxContentSize?: number;
}

export function Markdown({ content, className, maxHeight = "70vh", preventTruncation = true, maxContentSize }: MarkdownProps) {
  const { resolvedTheme } = useTheme() || { resolvedTheme: undefined };
  const isDarkMode = resolvedTheme === 'dark';

  return (
    <EnhancedMarkdown
      content={content}
      className={className}
      maxHeight={maxHeight}
      preventTruncation={preventTruncation}
      darkMode={isDarkMode}
      maxContentSize={maxContentSize}
    />
  );
}