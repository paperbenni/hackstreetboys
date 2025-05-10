import React, { useState } from 'react';

interface DebugTabProps {
  markdown: string;
}

const DebugTab: React.FC<DebugTabProps> = ({ markdown }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
        <h3 className="text-lg font-semibold">Raw Markdown Preview</h3>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-4">
        <pre className="whitespace-pre-wrap break-words text-sm font-mono">
          {markdown}
        </pre>
      </div>
    </div>
  );
};

export default DebugTab;