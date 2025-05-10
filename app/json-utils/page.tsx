'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  validateJson, 
  completeJson, 
  formatJson,
  JsonValidationResult
} from '@/lib/json-validator';

export default function JsonUtilsPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<JsonValidationResult | null>(null);
  const [useCompleteMode, setUseCompleteMode] = useState(false);
  const [liveValidation, setLiveValidation] = useState(true);
  const [indentSize, setIndentSize] = useState(2);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Validate JSON input
  const validateJsonInput = useCallback(() => {
    if (!jsonInput.trim()) {
      setValidationResult(null);
      return;
    }
    
    if (useCompleteMode) {
      // Just use completeJson function
      const result = completeJson(jsonInput, indentSize);
      setValidationResult({
        isValid: !!result,
        needsCompletion: !!result,
        completedJson: result,
        formattedJson: result,
        errorMessage: !result ? 'JSON could not be completed' : null
      });
    } else {
      // Use full validation
      const result = validateJson(jsonInput, indentSize);
      setValidationResult(result);
    }
  }, [jsonInput, indentSize, useCompleteMode]);
  
  // Validate JSON when input changes (if live validation is enabled)
  useEffect(() => {
    if (!liveValidation || !jsonInput.trim()) return;
    
    // Debounce validation to avoid excessive processing
    const timer = setTimeout(() => {
      validateJsonInput();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [jsonInput, liveValidation, validateJsonInput]);

  // Handle text area input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  };
  
  // Create demo JSON examples
  const addValidExample = () => {
    const validExample = {
      name: "JSON Validator Demo",
      features: ["Validation", "Completion", "Formatting"],
      settings: {
        autoFormat: true,
        indentSize: 2,
        allowCompletion: true
      },
      stats: {
        validCount: 42,
        invalidCount: 0,
        completedCount: 13
      },
      created: new Date().toISOString()
    };
    
    setJsonInput(JSON.stringify(validExample, null, 2));
  };
  
  const addInvalidExample = () => {
    // This JSON is intentionally invalid (has extra comma)
    const invalidJson = `{
      "name": "Invalid JSON Example",
      "description": "This JSON has syntax errors",
      "errors": [
        "extra comma", 
        "unclosed array",
      ],
      "timestamp": "${new Date().toISOString()}"
    }`;
    
    setJsonInput(invalidJson);
  };
  
  const addIncompleteExample = () => {
    // This JSON is intentionally incomplete (missing closing brackets)
    const incompleteJson = `{
      "name": "Incomplete JSON Example",
      "description": "Missing closing brackets",
      "nested": {
        "level1": {
          "level2": {
            "items": [
              "one",
              "two",
              "three"
    `;
    
    setJsonInput(incompleteJson);
  };
  
  const formatCurrentJson = () => {
    if (!jsonInput.trim()) return;
    
    const formatted = formatJson(jsonInput, indentSize);
    if (formatted) {
      setJsonInput(formatted);
    }
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">JSON Utility Functions</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        A collection of utility functions for working with JSON: validation, completion, and formatting.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">JSON Input</h2>
          
          <div className="mb-4 flex items-center space-x-4">
            <button 
              onClick={addValidExample}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Valid Example
            </button>
            <button 
              onClick={addInvalidExample}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Invalid Example
            </button>
            <button 
              onClick={addIncompleteExample}
              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
            >
              Incomplete Example
            </button>
          </div>
          
          <div className="mb-4">
            <textarea 
              ref={textareaRef}
              className="w-full h-96 p-4 rounded-md bg-gray-100 dark:bg-gray-900 font-mono text-sm"
              value={jsonInput}
              onChange={handleInputChange}
              placeholder="Enter JSON here..."
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="space-x-2">
              <button 
                onClick={validateJsonInput}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Validate
              </button>
              <button 
                onClick={formatCurrentJson}
                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Format
              </button>
              <button 
                onClick={() => setJsonInput('')}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <label className="mr-2 text-sm">Indent:</label>
                <select 
                  value={indentSize}
                  onChange={(e) => setIndentSize(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-gray-800 border rounded text-sm"
                >
                  <option value={0}>0 (Compact)</option>
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-4">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={liveValidation}
                onChange={() => setLiveValidation(!liveValidation)}
                className="mr-2"
              />
              <span className="text-sm">Live Validation</span>
            </label>
            
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={useCompleteMode}
                onChange={() => setUseCompleteMode(!useCompleteMode)}
                className="mr-2"
              />
              <span className="text-sm">Complete-Only Mode</span>
            </label>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Validation Result</h2>
          
          {!validationResult ? (
            <div className="h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg">
              <p className="text-gray-500">No validation result yet. Enter JSON and press Validate.</p>
            </div>
          ) : validationResult.isValid ? (
            <div className="h-96 overflow-auto">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 rounded-full mr-2 bg-green-500" />
                <span>
                  {validationResult.needsCompletion 
                    ? 'JSON was completed and is now valid' 
                    : 'Valid JSON'}
                </span>
                <button 
                  onClick={() => handleCopy(validationResult.formattedJson || '')}
                  className="ml-auto px-2 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  Copy
                </button>
              </div>
              
              {validationResult.needsCompletion && (
                <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-700">
                  <p className="text-xs text-gray-500">
                    Added missing brackets to complete the JSON structure
                  </p>
                </div>
              )}
              
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto font-mono text-sm">
                {validationResult.formattedJson || validationResult.completedJson}
              </pre>
            </div>
          ) : (
            <div className="h-96 overflow-auto">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 rounded-full mr-2 bg-red-500" />
                <span>Invalid JSON</span>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-700 mb-4">
                <h3 className="text-sm font-medium mb-2">Error:</h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {validationResult.errorMessage || 'Unknown error'}
                </p>
                {validationResult.errorPosition && (
                  <p className="text-xs text-gray-500 mt-1">
                    at line {validationResult.errorPosition.line}, column {validationResult.errorPosition.column}
                  </p>
                )}
              </div>
              
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto font-mono text-sm">
                {jsonInput}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4">How to Use the JSON Utilities</h2>
        
        <div className="prose dark:prose-invert max-w-none">
          <p>The JSON utilities provide several functions for working with JSON data:</p>
          
          <h3>1. Validate JSON</h3>
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mb-4">
{`import { validateJson } from '@/lib/json-validator';

// Get detailed validation result
const result = validateJson(myJsonString, 2); // Second parameter is indent size

if (result.isValid) {
  // Use result.formattedJson for pretty-printed JSON
  // Check result.needsCompletion to see if it was completed
} else {
  // Handle error with result.errorMessage
}`}
          </pre>
          
          <h3>2. Quick Validation</h3>
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mb-4">
{`import { isValidJson } from '@/lib/json-validator';

// Simple boolean check
if (isValidJson(myJsonString)) {
  // JSON is valid
} else {
  // JSON is invalid
}`}
          </pre>
          
          <h3>3. Complete Incomplete JSON</h3>
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mb-4">
{`import { completeJson } from '@/lib/json-validator';

// Try to add missing closing brackets/braces
const completed = completeJson(incompleteJsonString, 2);

if (completed) {
  // Use completed JSON
} else {
  // JSON couldn't be completed
}`}
          </pre>
          
          <h3>4. Format JSON</h3>
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mb-4">
{`import { formatJson } from '@/lib/json-validator';

// Format JSON with specified indentation
const formatted = formatJson(myJsonString, 2);

if (formatted) {
  // Use formatted JSON
} else {
  // JSON was invalid and couldn't be formatted
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}