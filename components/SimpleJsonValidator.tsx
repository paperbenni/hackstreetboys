import React, { useState, useEffect, useCallback } from 'react';
import JsonTreeTab from './JsonTreeTab';

interface SimpleJsonValidatorProps {
  input: string;
  pollingInterval?: number;
}

const SimpleJsonValidator: React.FC<SimpleJsonValidatorProps> = ({
  input,
  pollingInterval = 500, // Default checking every 500ms
}) => {
  const [isValid, setIsValid] = useState(false);
  const [lastValidJson, setLastValidJson] = useState<string | null>(null);
  const [completedJson, setCompletedJson] = useState<string | null>(null);
  const [needsCompletion, setNeedsCompletion] = useState(false);
  
  // Checks if incomplete JSON can be made valid by adding missing closing brackets/braces
  const isCompletableJson = useCallback((str: string): [boolean, string | null] => {
    try {
      // Track opening brackets/braces/quotes
      const stack: string[] = [];
      let inString = false;
      let escaped = false;
      
      // Process each character
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        
        // Handle string literals
        if (char === '"' && !escaped) {
          inString = !inString;
        }
        
        // Skip processing if we're in a string unless it's a quote or escape
        if (inString) {
          escaped = char === '\\' && !escaped;
          continue;
        }
        
        // Reset escaped flag outside string
        escaped = false;
        
        // Track opening brackets
        if (char === '{' || char === '[') {
          stack.push(char === '{' ? '}' : ']');
        }
        // Check closing brackets
        else if (char === '}' || char === ']') {
          if (stack.length === 0 || stack.pop() !== char) {
            return [false, null]; // Mismatched brackets
          }
        }
      }
      
      // Can't complete if we're in the middle of a string
      if (inString) return [false, null];
      
      // Can be completed by adding remaining closing brackets
      if (stack.length > 0) {
        const completion = stack.reverse().join('');
        const completed = str + completion;
        try {
          // Verify the completed string is valid JSON
          JSON.parse(completed);
          return [true, completed];
        } catch {
          return [false, null];
        }
      }
      
      return [false, null]; // No unclosed brackets to fix
    } catch {
      return [false, null];
    }
  }, []);

  // JSON validation function wrapped in useCallback
  const isJsonString = useCallback((str: string): boolean => {
    try {
      JSON.parse(str);
      setNeedsCompletion(false);
      return true;
    } catch {
      // Try to make the JSON valid by completing it
      const [canComplete, completed] = isCompletableJson(str);
      if (canComplete && completed) {
        setCompletedJson(completed);
        setNeedsCompletion(true);
      }
      return canComplete;
    }
  }, [isCompletableJson, setNeedsCompletion, setCompletedJson]);

  // Check JSON validity on input change and periodically
  useEffect(() => {
    // Function to check and update state
    const checkJson = () => {
      if (!input) return;
      
      const valid = isJsonString(input);
      setIsValid(valid);
      
      if (valid) {
        setLastValidJson(input);
      }
    };

    // Initial check
    checkJson();
    
    // Set up interval for continuous checking
    const intervalId = setInterval(checkJson, pollingInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [input, pollingInterval, isJsonString]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-2">
            <div 
              className={`w-3 h-3 rounded-full mr-2 ${isValid ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span>
              {isValid 
                ? needsCompletion 
                  ? 'Incomplete JSON can be completed' 
                  : 'Valid JSON detected'
                : lastValidJson 
                  ? 'Waiting for valid JSON... (showing last valid)' 
                  : 'Waiting for valid JSON...'}
            </span>
          </div>
        </div>
      
        {/* Display the JSON tree if we have valid JSON */}
        {lastValidJson && (
          <>
            {needsCompletion && completedJson && (
              <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-700">
                <h3 className="text-sm font-medium mb-2">Added closing brackets:</h3>
                <div className="relative">
                  <pre className="font-mono text-sm overflow-auto p-2 bg-white dark:bg-gray-800 rounded">
                    {completedJson}
                  </pre>
                  <div className="absolute top-0 right-0 p-1">
                    <button 
                      onClick={() => navigator.clipboard.writeText(completedJson || '')}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                      Copy
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  The validator has added missing closing brackets to complete the JSON structure
                </p>
              </div>
            )}
            <JsonTreeTab jsonData={needsCompletion && completedJson ? completedJson : lastValidJson} />
          </>
        )}
    </div>
  );
};

export default SimpleJsonValidator;