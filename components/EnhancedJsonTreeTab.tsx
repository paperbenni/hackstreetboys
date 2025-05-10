import React, { useState, useEffect, useCallback } from 'react';
import JsonTreeTab from './JsonTreeTab';

interface EnhancedJsonTreeTabProps {
  jsonData: string;
  maxHeight?: string;
  preventTruncation?: boolean;
  pollingInterval?: number;
}

const EnhancedJsonTreeTab: React.FC<EnhancedJsonTreeTabProps> = ({
  jsonData,
  maxHeight = "70vh",
  preventTruncation = true,
  pollingInterval = 300,
}) => {
  // Track the validity state but don't expose it in the UI
  const [, setIsValid] = useState(false);
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
      
      // If we have a valid JSON object with no unclosed brackets, it's already complete
      if (stack.length === 0) {
        try {
          JSON.parse(str);
          return [true, str];
        } catch {
          return [false, null];
        }
      }
      
      return [false, null];
    } catch {
      return [false, null];
    }
  }, []);

  // JSON validation function wrapped in useCallback
  const isJsonString = useCallback((str: string): boolean => {
    if (!str || str.trim() === '') {
      return false;
    }
    
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

  // Check JSON validity on input change
  useEffect(() => {
    if (!jsonData) return;
    
    // Function to check and update state
    const checkJson = () => {   
      try {   
        const valid = isJsonString(jsonData);
        setIsValid(valid);
        
        if (valid) {
          if (needsCompletion && completedJson) {
            setLastValidJson(completedJson);
          } else {
            setLastValidJson(jsonData);
          }
        }
      } catch (error) {
        console.error("Error checking JSON:", error);
      }
    };

    // Initial check
    checkJson();
    
    // Set up interval for continuous checking
    const intervalId = setInterval(checkJson, pollingInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [jsonData, pollingInterval, isJsonString, completedJson, needsCompletion]);

  // If no valid JSON at all, show empty state
  if (!lastValidJson) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
        <p>Waiting for valid JSON data...</p>
        {jsonData && jsonData.trim() !== '' && jsonData !== '{}' && (
          <p className="text-xs mt-2 text-amber-600">Attempting to validate input data...</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-4">
      {needsCompletion && completedJson && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
            <h3 className="text-sm font-medium">Auto-completed JSON:</h3>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Missing closing brackets have been added to complete the JSON structure
          </p>
          <button 
            onClick={() => navigator.clipboard?.writeText?.(completedJson || '')}
            className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
            Copy completed JSON
          </button>
        </div>
      )}
      
      <JsonTreeTab 
        jsonData={lastValidJson}
        maxHeight={maxHeight}
        preventTruncation={preventTruncation}
      />
    </div>
  );
};

export default EnhancedJsonTreeTab;