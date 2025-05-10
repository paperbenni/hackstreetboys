import React, { useState, useMemo } from 'react';
import { scrollableContainerStyle, ensureNoTruncation } from '@/lib/utils';

interface JsonTreeTabProps {
  jsonData: string;
  maxHeight?: string;
  preventTruncation?: boolean;
}

// Type for JSON node
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

const JsonTreeTab: React.FC<JsonTreeTabProps> = ({
  jsonData,
  maxHeight = "70vh",
  preventTruncation = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root"]));
  const [filter, setFilter] = useState("");
  
  // Try to parse the JSON data
  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(jsonData);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return null;
    }
  }, [jsonData]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const toggleNode = (path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allPaths = new Set<string>();
    
    const collectPaths = (obj: JsonValue, path: string = "root") => {
      allPaths.add(path);
      
      if (obj !== null && typeof obj === 'object') {
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            collectPaths(item, `${path}.${index}`);
          });
        } else {
          Object.entries(obj).forEach(([key, value]) => {
            collectPaths(value, `${path}.${key}`);
          });
        }
      }
    };
    
    collectPaths(parsedJson);
    setExpandedNodes(allPaths);
  };
  
  const collapseAll = () => {
    setExpandedNodes(new Set(["root"]));
  };

  // Main JSON tree renderer
  const renderJsonTree = (data: JsonValue, path: string = "root", level: number = 0): React.ReactNode => {
    if (data === null) {
      return <span className="text-gray-500">null</span>;
    }
    
    if (typeof data === 'boolean') {
      return <span className="text-orange-600 dark:text-orange-400">{data.toString()}</span>;
    }
    
    if (typeof data === 'number') {
      return <span className="text-blue-600 dark:text-blue-400">{data}</span>;
    }
    
    if (typeof data === 'string') {
      return <span className="text-green-600 dark:text-green-400">&quot;{data}&quot;</span>;
    }
    
    const isExpanded = expandedNodes.has(path);
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <span className="text-gray-500">[]</span>;
      }
      
      return (
        <div>
          <div 
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center"
            onClick={() => toggleNode(path)}
          >
            <span className="mr-1 text-gray-500 inline-block w-4 text-center">
              {isExpanded ? '▼' : '►'}
            </span>
            <span className="text-gray-500">
              Array({data.length})
            </span>
          </div>
          
          {isExpanded && (
            <div style={{ paddingLeft: '1.5rem' }}>
              {data.map((item, index) => (
                <div key={`${path}.${index}`} className="my-1">
                  <span className="text-gray-500 mr-2">{index}:</span>
                  {renderJsonTree(item, `${path}.${index}`, level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // It's an object
    const entries = Object.entries(data);
    
    if (entries.length === 0) {
      return <span className="text-gray-500">{"{}"}</span>;
    }
    
    return (
      <div>
        <div 
          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center"
          onClick={() => toggleNode(path)}
        >
          <span className="mr-1 text-gray-500 inline-block w-4 text-center">
            {isExpanded ? '▼' : '►'}
          </span>
          <span className="text-gray-500">
            Object({entries.length})
          </span>
        </div>
        
        {isExpanded && (
          <div style={{ paddingLeft: '1.5rem' }}>
            {entries.map(([key, value]) => {
              // If filter is active and no match, skip this entry
              if (filter && !key.toLowerCase().includes(filter.toLowerCase())) {
                return null;
              }
              
              return (
                <div key={`${path}.${key}`} className="my-1">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">&quot;{key}&quot;:</span>
                  {renderJsonTree(value, `${path}.${key}`, level + 1)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
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
          <h3 className="text-lg font-semibold">JSON Tree</h3>
          <div className="flex space-x-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200 text-sm"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200 text-sm"
            >
              Collapse All
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Filter by key..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 text-sm border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium"
          >
            {copied ? '✓ Copied!' : 'Copy JSON'}
          </button>
        </div>
      </div>
      <div 
        className="flex-1 scrollable bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-md p-4 shadow-sm"
        style={containerStyle}
      >
        {!parsedJson ? (
          <div className="text-red-500 p-4">
            <p className="font-bold">Invalid JSON</p>
            <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded overflow-auto">
              {jsonData}
            </pre>
          </div>
        ) : (
          <div className="font-mono" style={{ fontSize: '0.875rem' }}>
            {renderJsonTree(parsedJson)}
          </div>
        )}
      </div>
    </div>
  );
};

export default JsonTreeTab;