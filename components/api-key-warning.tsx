"use client";

import { useState, useEffect } from 'react';

export function ApiKeyWarning() {
  const [isApiKeyMissing, setIsApiKeyMissing] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        // Use the dedicated endpoint to check if the API key is configured
        const response = await fetch('/api/check-api-key');
        const data = await response.json();
        setIsApiKeyMissing(!data.hasApiKey);
      } catch (error) {
        console.error('Error checking API key:', error);
        // Assume there might be an issue with the API key if we can't connect
        setIsApiKeyMissing(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkApiKey();
  }, []);

  if (isChecking || isApiKeyMissing === null) {
    return null; // Don't show anything while checking
  }

  if (!isApiKeyMissing) {
    return null; // Don't show anything if API key is present
  }

  return (
    <div className="w-full p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 dark:bg-yellow-900/60 dark:border-yellow-600 dark:text-yellow-200">
      <h3 className="font-bold text-lg">⚠️ OpenRouter API Key Not Configured</h3>
      <p className="mt-1">
        This application requires an OpenRouter API key to function properly.
      </p>
      <ol className="list-decimal ml-5 mt-2">
        <li>Sign up and get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/keys</a></li>
        <li>Create or edit the <code className="bg-yellow-200/50 dark:bg-yellow-800/50 px-1 rounded">.env</code> file in the project root</li>
        <li>Add your API key: <code className="bg-yellow-200/50 dark:bg-yellow-800/50 px-1 rounded">OPENAPI_KEY=your-api-key-here</code></li>
        <li>Restart the application</li>
      </ol>
    </div>
  );
}