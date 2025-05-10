'use client';

import { useState } from 'react';
import SimpleJsonValidator from '@/components/SimpleJsonValidator';

export default function SimpleJsonDemo() {
  const [jsonInput, setJsonInput] = useState('');
  const [streamedOutput, setStreamedOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamInterval, setStreamInterval] = useState<NodeJS.Timeout | null>(null);

  // Handle text area input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  };

  // Create nested but completable JSON example
  const createNestedIncompleteJson = () => {
    // This JSON is intentionally incomplete (missing closing brackets)
    const incompleteJson = `{
      "name": "Complex Incomplete Example",
      "metadata": {
        "version": "1.0.0",
        "created": "${new Date().toISOString()}"
      },
      "items": [
        {
          "id": 1,
          "properties": {
            "color": "blue",
            "size": "large",
            "features": ["waterproof", "durable", "lightweight"
          }
        },
        {
          "id": 2,
          "properties": {
            "color": "red",
            "size": "medium",
            "features": ["foldable", "compact"
          }
        }
      ],
      "settings": {
        "enabled": true,
        "config": {
          "timeout": 30,
          "retries": 3,
          "advanced": {
            "logging": true,
            "caching": {
              "enabled": true,
              "duration": 3600
            
          }
        }
      }
    }`;
    
    setJsonInput(incompleteJson);
  };

  // Start JSON streaming
  const startJsonStream = () => {
    if (streamInterval) {
      clearInterval(streamInterval);
    }

    const exampleJson = JSON.stringify({
      name: "Simple JSON Validator",
      description: "A lightweight JSON validator that uses a simple approach",
      features: ["Efficient", "Easy to understand", "Lightweight"],
      version: "1.0.0",
      created: new Date().toISOString()
    }, null, 2);

    let index = 0;
    setStreamedOutput('');
    setIsStreaming(true);

    const interval = setInterval(() => {
      if (index <= exampleJson.length) {
        setStreamedOutput(exampleJson.substring(0, index));
        index++;
      } else {
        clearInterval(interval);
        setStreamInterval(null);
        setIsStreaming(false);
      }
    }, 50);

    setStreamInterval(interval);
  };

  // Create incomplete JSON (missing closing brackets)
  const createCorruptedJson = () => {
    const validJson = JSON.stringify({
      test: "Incomplete JSON example",
      data: [1, 2, 3],
      nested: {
        level1: {
          level2: {
            array: [
              { id: 1, name: "Item 1" },
              { id: 2, name: "Item 2" }
            ]
          }
        }
      }
    }, null, 2);
    
    // Remove closing brackets to make it incomplete but potentially valid
    setStreamedOutput(validJson.substring(0, validJson.length - 5));
  };

  // Clean up on unmount
  const clearOutput = () => {
    if (streamInterval) {
      clearInterval(streamInterval);
      setStreamInterval(null);
    }
    setStreamedOutput('');
    setIsStreaming(false);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Simple JSON Validator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Streaming JSON Example</h2>
          <div className="flex gap-2 mb-4">
            <button 
              onClick={startJsonStream}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isStreaming}
            >
              {isStreaming ? 'Streaming...' : 'Stream Valid JSON'}
            </button>
            <button 
              onClick={createCorruptedJson}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Create Missing Brackets
            </button>
            <button 
              onClick={clearOutput}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto h-64 font-mono text-sm">
            {streamedOutput}
          </pre>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Test Incomplete JSON</h2>
          <div className="mb-4">
            <textarea 
              className="w-full h-64 p-4 rounded-md bg-gray-100 dark:bg-gray-900 font-mono text-sm"
              value={jsonInput}
              onChange={handleInputChange}
              placeholder="Enter JSON here..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button 
              onClick={createNestedIncompleteJson}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Incomplete JSON
            </button>
            <button 
              onClick={() => setJsonInput('')}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Enhanced JSON Validator Output</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
            <p className="text-sm">
              <strong>Auto-completion feature:</strong> This validator recognizes JSON that&apos;s incomplete but well-structured, 
              completing it by adding missing closing parentheses, brackets, or braces.
            </p>
          </div>
          <SimpleJsonValidator 
            input={streamedOutput || jsonInput} 
            pollingInterval={300}
          />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">About This Enhanced Validation Approach</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p>This JSON validator uses an enhanced approach to check if a string is valid JSON or could be completed to form valid JSON:</p>
          
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto">
{`function isJsonString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    // Try to make the JSON valid by completing it
    const [canComplete, completed] = isCompletableJson(str);
    if (canComplete && completed) {
      // Store the completed version for display
      setCompletedJson(completed);
    }
    return canComplete;
  }
}

// Checks if incomplete JSON can be made valid by adding missing closing brackets
function isCompletableJson(str) {
  // Track opening brackets, braces, and quotes
  const stack = [];
  let inString = false;
  
  // Process each character to track structure
  for (let i = 0; i < str.length; i++) {
    // Track strings, opening/closing brackets, etc.
  }
  
  if (stack.length > 0) {
    // Can be completed by adding missing closing brackets
    const completion = stack.reverse().join('');
    const completed = str + completion;
    return [true, completed];
  }
  
  return [false, null];
}`}
          </pre>
          
          <p>Key benefits of this approach:</p>
          <ul>
            <li>Simplicity: Clear, concise, and easy to understand</li>
            <li>Efficiency: Uses the browser&apos;s native JSON parser</li>
            <li>Reusability: Can be used anywhere in your code</li>
            <li>Forgiving: Handles incomplete but well-structured JSON</li>
            <li>Streaming-friendly: Works with JSON that&apos;s still being received</li>
            <li>Lightweight: No complex dependencies</li>
            <li>Visual: Shows the completed JSON with added closing brackets</li>
          </ul>
          
          <p>Implementation:</p>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto">
{`// Example usage in a component
import SimpleJsonValidator from '@/components/SimpleJsonValidator';

<SimpleJsonValidator input={jsonString} pollingInterval={500} />`}
          </pre>
        </div>
      </div>
    </div>
  );
}