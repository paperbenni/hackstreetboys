'use client';

import { useState } from 'react';

export default function SimpleJsonDemo() {
  const [jsonInput, setJsonInput] = useState('');
  const [streamedOutput, setStreamedOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamInterval, setStreamInterval] = useState<NodeJS.Timeout | null>(null);

  /**
   * This demo is designed to show a simple JSON validation example
   * But the JSON tree visualization has been removed as requested
   */
  
  // Function to validate JSON
  const isValidJson = (str: string): boolean => {
    if (!str || str.trim() === '') return false;
    
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  // Start streaming example JSON
  const startStreaming = () => {
    if (isStreaming) return;
    
    setIsStreaming(true);
    setStreamedOutput('');
    
    // Example JSON to stream character by character
    const sampleJSON = `{
  "name": "JSON Validator Example",
  "version": 1.0,
  "features": [
    "Basic Validation",
    "Real-time Updates",
    "Error Reporting"
  ],
  "settings": {
    "autoSave": true,
    "theme": "dark",
    "notifications": {
      "email": false,
      "push": true
    }
  },
  "lastUpdated": "2023-09-15T14:30:00Z"
}`;
    
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < sampleJSON.length) {
        setStreamedOutput(prev => prev + sampleJSON[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setStreamInterval(null);
        setIsStreaming(false);
      }
    }, 50); // Stream a character every 50ms
    
    setStreamInterval(interval);
  };
  
  // Stop the streaming demonstration
  const stopStreaming = () => {
    if (streamInterval) {
      clearInterval(streamInterval);
      setStreamInterval(null);
      setIsStreaming(false);
    }
  };
  
  // Reset all state
  const resetDemo = () => {
    stopStreaming();
    setJsonInput('');
    setStreamedOutput('');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          JSON Validation Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Input JSON
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <textarea 
                  className="w-full h-64 p-3 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  placeholder="Enter JSON here..."
                  value={isStreaming ? streamedOutput : jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  disabled={isStreaming}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {!isStreaming ? (
                  <>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                      onClick={startStreaming}
                    >
                      Demo Streaming
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
                      onClick={resetDemo}
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                    onClick={stopStreaming}
                  >
                    Stop Streaming
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800 text-sm">
              <p>
                <strong className="font-medium">Tip:</strong> The JSON tree viewer has been removed. 
                You can still input valid JSON here but it will only be validated, not displayed as a tree.
              </p>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              JSON Validation Result
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 min-h-[440px]">
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                <p className="text-sm">
                  <strong>Validation status:</strong> This validator checks if the input is valid JSON.
                </p>
              </div>
              
              <div className="flex items-center mb-4">
                <div 
                  className={`w-3 h-3 rounded-full mr-2 ${isValidJson(streamedOutput || jsonInput) ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span>
                  {isValidJson(streamedOutput || jsonInput)
                    ? 'Valid JSON detected'
                    : 'Invalid JSON or waiting for input...'}
                </span>
              </div>
              
              {!isValidJson(streamedOutput || jsonInput) && (streamedOutput || jsonInput) && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-700">
                  <h3 className="text-sm font-medium mb-2">Error:</h3>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Unable to parse JSON. Please check for syntax errors.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            About This Demo
          </h2>
          
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            This is a simplified JSON validator that checks if your input is valid JSON. It previously included
            a tree visualization component, but this has been removed as requested.
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md font-mono text-sm mb-4 overflow-auto">
{`// Example of basic JSON validation
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
}`}
          </div>
        </div>
      </div>
    </div>
  );
}