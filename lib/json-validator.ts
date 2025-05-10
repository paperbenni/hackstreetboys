/**
 * Enhanced JSON Validator Utility
 * 
 * This utility provides functions to:
 * 1. Validate JSON strings
 * 2. Complete incomplete JSON by adding missing closing brackets/braces
 * 3. Format JSON for pretty printing
 * 4. Track and repair common JSON syntax errors
 */

export type JsonValidationResult = {
  isValid: boolean;           // Is the JSON valid or can be made valid
  needsCompletion: boolean;   // Does the JSON need completion
  completedJson: string | null; // The completed JSON if needsCompletion is true
  formattedJson: string | null; // Pretty-printed JSON
  errorMessage: string | null; // Error message if validation failed
  errorPosition?: { // Position information for the error
    line: number;
    column: number;
  };
};

/**
 * Checks if a JSON string is valid or can be completed by adding missing brackets
 * 
 * @param jsonString - The JSON string to validate
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns JsonValidationResult object with validation details
 */
export function validateJson(jsonString: string, indent: number = 2): JsonValidationResult {
  // Default result
  const result: JsonValidationResult = {
    isValid: false,
    needsCompletion: false,
    completedJson: null,
    formattedJson: null,
    errorMessage: null
  };

  if (!jsonString?.trim()) {
    result.errorMessage = "Empty JSON string";
    return result;
  }

  // Try parsing the JSON as is
  try {
    const parsed = JSON.parse(jsonString);
    result.isValid = true;
    result.formattedJson = JSON.stringify(parsed, null, indent);
    return result;
  } catch (error) {
    // JSON is invalid, try to complete it
    const [canComplete, completed] = isCompletableJson(jsonString);
    
    if (canComplete && completed) {
      try {
        // Parse the completed JSON to confirm it's valid
        const parsed = JSON.parse(completed);
        result.isValid = true;
        result.needsCompletion = true;
        result.completedJson = completed;
        result.formattedJson = JSON.stringify(parsed, null, indent);
        return result;
      } catch (completeError) {
        // Completion didn't produce valid JSON
        result.errorMessage = getReadableError(completeError);
        return result;
      }
    }
    
    // Not completable, return the original error
    result.errorMessage = getReadableError(error);
    
    // Try to extract line and column from SyntaxError message
    if (error instanceof SyntaxError) {
      const posInfo = extractPositionFromError(error.message);
      if (posInfo) {
        result.errorPosition = posInfo;
      }
    }
    
    return result;
  }
}

/**
 * Checks if incomplete JSON can be made valid by adding missing closing brackets/braces
 * 
 * @param jsonString - The potentially incomplete JSON string
 * @returns [boolean, string | null] - Whether it can be completed and the completed JSON
 */
export function isCompletableJson(jsonString: string): [boolean, string | null] {
  try {
    // Track opening brackets/braces/quotes
    const stack: string[] = [];
    let inString = false;
    let escaped = false;
    
    // Process each character
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      
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
    
    // Can be completed by adding missing closing brackets
    if (stack.length > 0) {
      const completion = stack.reverse().join('');
      const completed = jsonString + completion;
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
}

/**
 * Format JSON with proper indentation
 * 
 * @param jsonString - The JSON string to format
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string or null if invalid
 */
export function formatJson(jsonString: string, indent: number = 2): string | null {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, indent);
  } catch {
    // If the JSON is invalid, try to complete it first
    const [canComplete, completed] = isCompletableJson(jsonString);
    if (canComplete && completed) {
      try {
        const parsed = JSON.parse(completed);
        return JSON.stringify(parsed, null, indent);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Convert JSON syntax errors into more readable messages
 * 
 * @param error - The error object from JSON.parse
 * @returns A more user-friendly error message
 */
function getReadableError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unknown JSON error";
  }
  
  const message = error.message;
  
  // Common JSON syntax errors and their readable versions
  if (message.includes("Unexpected end of JSON input")) {
    return "JSON is incomplete. It might be missing closing brackets.";
  }
  
  if (message.includes("Unexpected token")) {
    return message.replace("JSON.parse:", "Syntax error:").trim();
  }
  
  if (message.includes("Unexpected end of input")) {
    return "JSON is incomplete. It might be missing closing brackets or quotes.";
  }
  
  return message.replace("JSON.parse:", "").trim();
}

/**
 * Extract line and column position from JSON error message
 * 
 * @param errorMessage - The error message from JSON.parse
 * @returns Position object or undefined if position can't be extracted
 */
function extractPositionFromError(errorMessage: string): { line: number, column: number } | undefined {
  // Different JavaScript engines format error messages differently
  // Common patterns:
  // "... at line 5 column 10"
  // "... at position 42"
  
  // Try to extract line and column
  const lineColMatch = errorMessage.match(/at line (\d+) column (\d+)/i);
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10)
    };
  }
  
  // Try to extract just position (we would need to convert this to line/col)
  const posMatch = errorMessage.match(/at position (\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    return { line: 1, column: pos };  // Simplified, not accurate for multiline
  }
  
  return undefined;
}

/**
 * Quick check if a string is valid JSON
 * 
 * @param jsonString - The JSON string to check
 * @returns Boolean indicating if the string is valid JSON
 */
export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Complete JSON by adding missing brackets and return the result
 * 
 * @param jsonString - The potentially incomplete JSON string
 * @param indent - Number of spaces for indentation (default: 2) 
 * @returns The completed and formatted JSON or null if not completable
 */
export function completeJson(jsonString: string, indent: number = 2): string | null {
  const [canComplete, completed] = isCompletableJson(jsonString);
  if (canComplete && completed) {
    try {
      const parsed = JSON.parse(completed);
      return JSON.stringify(parsed, null, indent);
    } catch {
      return null;
    }
  }
  return null;
}