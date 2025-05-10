import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type ClientMessage = {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

const LlmClientExample = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to submit prompt to the LLM API
  const handleSubmit = async (): Promise<void> => {
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    // Add user message to the conversation
    const userMessage: ClientMessage = {
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Call the API endpoint that uses our LLM service
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ 
            role: m.role, 
            content: m.content 
          })),
          model: 'anthropic/claude-3-haiku:beta', // You can customize the model
          stream: false, // Use non-streaming mode for simplicity
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      
      // Add assistant's response to the conversation
      setMessages(prev => [
        ...prev, 
        {
          content: assistantContent,
          role: 'assistant',
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error processing LLM request:', error);
      // Add error message
      setMessages(prev => [
        ...prev, 
        {
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          role: 'assistant',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>LLM Client Example</CardTitle>
        <CardDescription>
          Direct interaction with LLM service from client component
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-100 dark:bg-blue-900 ml-8' 
                  : 'bg-gray-100 dark:bg-gray-800 mr-8'
              }`}
            >
              <div className="font-medium mb-1">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 mr-8">
              <div className="font-medium mb-1">Assistant</div>
              <div className="animate-pulse">Thinking...</div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          <textarea
            placeholder="Type your message here..."
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            className="min-h-[100px] w-full p-2 border rounded"
            disabled={isProcessing}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="text-xs text-gray-500">
            Press Ctrl+Enter to submit
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Send'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LlmClientExample;