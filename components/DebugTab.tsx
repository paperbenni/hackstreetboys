import React, { useState } from 'react';
import { scrollableContainerStyle, ensureNoTruncation } from '@/lib/utils';
import { EnhancedMarkdown } from './ui/enhanced-markdown';

interface DebugTabProps {
  markdown: string;
  maxHeight?: string;
  preventTruncation?: boolean;
  renderAsHtml?: boolean;
}

const DebugTab: React.FC<DebugTabProps> = ({ 
  markdown, 
  maxHeight = "70vh",
  preventTruncation = true,
  renderAsHtml = false
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'raw' | 'rendered'>(renderAsHtml ? 'rendered' : 'raw');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Combine scrollable container style with no-truncation style
  const containerStyle = {
    ...scrollableContainerStyle(maxHeight),
    ...(preventTruncation ? ensureNoTruncation() : {})
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Markdown Preview</h3>
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 text-sm ${
                viewMode === 'raw'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200'
              }`}
            >
              Raw
            </button>
            <button
              onClick={() => setViewMode('rendered')}
              className={`px-3 py-1 text-sm ${
                viewMode === 'rendered'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200'
              }`}
            >
              Rendered
            </button>
          </div>
        </div>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium"
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
      <div 
        className="flex-1 scrollable bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-md p-4 shadow-sm"
        style={containerStyle}
      >
        {viewMode === 'raw' ? (
          <pre 
            className="font-mono text-sm whitespace-pre-wrap break-words w-full m-0 p-0 bg-transparent no-truncate"
            style={{
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontSize: '0.875rem'
            }}
          >
            {markdown}
          </pre>
        ) : (
          <EnhancedMarkdown 
            content={markdown} 
            maxHeight="none"
            preventTruncation={true}
            darkMode={true}
          />
        )}
      </div>
    </div>
  );
};

export default DebugTab;