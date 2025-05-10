import React, { useState, useEffect } from 'react';
import JsonTreeTab from './JsonTreeTab';
import { validateJson, JsonValidationResult } from '@/lib/json-validator';

interface SimpleJsonValidatorProps {
  input: string;
  pollingInterval?: number;
}

const SimpleJsonValidator: React.FC<SimpleJsonValidatorProps> = ({
  input,
  pollingInterval = 500, // Default checking every 500ms
}) => {
  const [validationResult, setValidationResult] = useState<JsonValidationResult>({
    isValid: false,
    needsCompletion: false,
    completedJson: null,
    formattedJson: null,
    errorMessage: null
  });
  const [lastValidJson, setLastValidJson] = useState<string | null>(null);

  // Check JSON validity on input change and periodically
  useEffect(() => {
    // Function to check and update state
    const checkJson = () => {
      if (!input) return;
      
      const result = validateJson(input);
      setValidationResult(result);
      
      if (result.isValid) {
        setLastValidJson(input);
      }
    };

    // Initial check
    checkJson();
    
    // Set up interval for continuous checking
    const intervalId = setInterval(checkJson, pollingInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [input, pollingInterval]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-2">
          <div 
            className={`w-3 h-3 rounded-full mr-2 ${validationResult.isValid ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span>
            {validationResult.isValid 
              ? validationResult.needsCompletion 
                ? 'Incomplete JSON can be completed' 
                : 'Valid JSON detected'
              : lastValidJson 
                ? 'Waiting for valid JSON... (showing last valid)' 
                : validationResult.errorMessage || 'Waiting for valid JSON...'}
          </span>
        </div>
      </div>
    
      {/* Display the JSON tree if we have valid JSON */}
      {(validationResult.isValid || lastValidJson) && (
        <>
          {validationResult.needsCompletion && validationResult.completedJson && (
            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-700">
              <h3 className="text-sm font-medium mb-2">Added closing brackets:</h3>
              <div className="relative">
                <pre className="font-mono text-sm overflow-auto p-2 bg-white dark:bg-gray-800 rounded">
                  {validationResult.formattedJson || validationResult.completedJson}
                </pre>
                <div className="absolute top-0 right-0 p-1">
                  <button 
                    onClick={() => navigator.clipboard.writeText(validationResult.formattedJson || validationResult.completedJson || '')}
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
          <JsonTreeTab 
            jsonData={
              validationResult.needsCompletion && validationResult.formattedJson 
                ? validationResult.formattedJson 
                : validationResult.isValid && validationResult.formattedJson
                  ? validationResult.formattedJson
                  : lastValidJson || ''
            } 
          />
        </>
      )}

      {!validationResult.isValid && validationResult.errorMessage && !lastValidJson && (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-700">
          <h3 className="text-sm font-medium mb-2">Error:</h3>
          <p className="text-sm text-red-600 dark:text-red-400">{validationResult.errorMessage}</p>
          {validationResult.errorPosition && (
            <p className="text-xs text-gray-500 mt-1">
              at line {validationResult.errorPosition.line}, column {validationResult.errorPosition.column}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleJsonValidator;