import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import Image from 'next/image';
import { cn, scrollableContainerStyle, ensureNoTruncation } from "@/lib/utils";

interface EnhancedMarkdownProps {
  content: string;
  className?: string;
  maxHeight?: string;
  preventTruncation?: boolean;
  darkMode?: boolean;
  maxContentSize?: number;
}

export function EnhancedMarkdown({ 
  content, 
  className, 
  maxHeight = "70vh", 
  preventTruncation = true,
  darkMode = true,
  maxContentSize = 100000000 // Default to 100MB to handle very large responses
}: EnhancedMarkdownProps) {
  // Common class names for the markdown container
  const markdownClassNames = cn(
    // Base prose styles
    "prose max-w-none",
    darkMode ? "prose-invert" : "prose-slate",
    
    // Heading styles
    "prose-headings:scroll-m-20 prose-headings:font-semibold",
    "prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-slate-200 dark:prose-h1:border-slate-700",
    "prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4",
    "prose-h3:text-lg prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-3",
    
    // Paragraph and text styles
    "prose-p:leading-7 prose-p:my-4",
    
    // Link styles
    "prose-a:text-indigo-600 dark:prose-a:text-indigo-400",
    "prose-a:font-medium prose-a:underline prose-a:underline-offset-4 prose-a:decoration-slate-400/50",
    "prose-a:hover:decoration-indigo-500 dark:prose-a:decoration-slate-500/50 dark:prose-a:hover:decoration-indigo-400",
    
    // Inline element styles
    "prose-strong:font-semibold prose-em:italic",
    "prose-code:rounded-md prose-code:bg-slate-100/60 dark:prose-code:bg-slate-800/40",
    "prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm",
    
    // Block element styles
    "prose-pre:p-4 prose-pre:overflow-auto prose-pre:rounded-lg",
    "prose-pre:bg-slate-50 dark:prose-pre:bg-slate-900/90",
    "prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700 prose-pre:my-4",
    "prose-pre:font-mono prose-pre:text-sm",
    
    // Image styles
    "prose-img:rounded-md prose-img:border prose-img:border-slate-200 dark:prose-img:border-slate-700",
    "prose-img:my-6 prose-img:shadow-md",
    
    // Separator styles
    "prose-hr:border-slate-200 dark:prose-hr:border-slate-700 prose-hr:my-8",
    
    // Quote styles
    "prose-blockquote:border-l-4 prose-blockquote:border-slate-300 dark:prose-blockquote:border-slate-600",
    "prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-6 prose-blockquote:bg-slate-50/50 dark:prose-blockquote:bg-slate-900/50",
    "prose-blockquote:rounded-r-md prose-blockquote:py-1 prose-blockquote:text-slate-700/90 dark:prose-blockquote:text-slate-300/90",
    
    // List styles
    "prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6",
    "prose-li:my-1 prose-li:pl-1.5",
    
    // Table styles
    "prose-table:border prose-table:border-slate-200 dark:prose-table:border-slate-700",
    "prose-table:rounded-md prose-table:overflow-hidden prose-table:my-6 prose-table:w-full",
    "prose-th:bg-slate-100/50 dark:prose-th:bg-slate-800/50 prose-th:p-2 prose-th:font-semibold prose-th:text-left",
    "prose-td:border-t prose-td:border-slate-200 dark:prose-td:border-slate-700 prose-td:p-2",
    "prose-td:align-top",
    
    // Overflow handling
    "break-words whitespace-normal scrollable",
    
    className
  );

  // Combine scrollable container style with no-truncation style if needed
  const containerStyle = {
    ...scrollableContainerStyle(maxHeight),
    ...(preventTruncation ? ensureNoTruncation() : {})
  };
  
  // Handle potentially large content to prevent browser rendering issues
  // If content is JSON, ensure it's not truncated
  let processedContent = content;
  
  // Try to detect if content is JSON and handle it specially to avoid truncation
  if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      // For JSON, ensure proper formatting and no truncation
      const jsonObj = JSON.parse(content);
      processedContent = JSON.stringify(jsonObj, null, 2);
    } catch (e) {
      // If it's not valid JSON or too large, use the original content
      console.warn('Failed to parse content as JSON:', e);
    }
  }

  return (
    <div className={markdownClassNames} style={containerStyle}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeSlug]}
        components={{
          // Custom link handling
          a: ({ className, children, ...props }) => {
            return (
              <a 
                className={cn("transition-colors duration-200", className)} 
                target="_blank" 
                rel="noopener noreferrer" 
                {...props}
              >
                {children}
              </a>
            );
          },
          
          // Custom table handling
          table: ({ className, children, ...props }) => {
            return (
              <div className="overflow-x-auto my-6">
                <table className={cn("min-w-full", className)} {...props}>
                  {children}
                </table>
              </div>
            );
          },
          
          // Enhanced image handling with fallback to standard img for external URLs
          img: ({ className, alt, src, ...props }) => {
            // For external URLs, we still use the img tag
            if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={cn("mx-auto max-h-96 object-contain", className)}
                  loading="lazy"
                  alt={alt || "Image"}
                  src={src}
                  {...props}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              );
            }
            
            // For internal images, use Next.js Image component
            if (typeof src === 'string') {
              return (
                <div className="flex justify-center my-4">
                  <Image
                      src={src || ''}
                    alt={alt || "Image"}
                    width={600}
                    height={400}
                    className={cn("max-h-96 object-contain", className)}
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              );
            }
            
            return null;
          },
          
          // Enhance code blocks with better styling
          pre: ({ className, children, ...props }) => {
            return (
              <pre 
                className={cn(
                  "p-4 overflow-auto rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm font-mono",
                  className
                )}
                {...props}
              >
                {children}
              </pre>
            );
          },
          
          code: ({ className, children, ...props }) => {
            // Check if this is an inline code (within paragraph)
            const isInline = !className?.includes('language-');
            
            if (isInline) {
              return (
                <code 
                  className={cn(
                    "rounded-md bg-slate-100/60 dark:bg-slate-800/40 px-1.5 py-0.5 font-mono text-sm",
                    className
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            // For code blocks, we'll let the pre handle most of the styling
            return (
              <code
                className={cn("block text-sm font-mono", className)}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}