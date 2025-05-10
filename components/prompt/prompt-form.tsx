"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, RefreshCw } from "lucide-react";
import { OPENROUTER_MODELS, DEFAULT_MODEL } from "@/lib/api/openrouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { processStreamingResponse } from "@/lib/utils";

const formSchema = z.object({
  prompt: z.string().min(1, {
    message: "Prompt cannot be empty.",
  }),
  model: z.string().min(1, {
    message: "Please select a model.",
  }),
});

interface PromptFormProps {
  onResponseAction: (response: string) => void;
  onSubmitAction?: (model: string) => void;
}

export function PromptForm({ onResponseAction, onSubmitAction }: PromptFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      model: DEFAULT_MODEL,
    },
  });

  async function handleFormSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    
    // Notify parent component that submission is starting
    if (onSubmitAction) onSubmitAction(values.model);
    
    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: values.model,
          messages: [
            { role: "user", content: values.prompt }
          ],
          stream: true, // Enable streaming
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errorMessage = errData?.error || `API request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      // Clear previous response before starting
      onResponseAction("");
      
      // Use the utility function to process streaming response
      try {
        await processStreamingResponse(
          response,
          // On each delta update, send it to the UI
          (contentDelta) => {
            onResponseAction(contentDelta);
          },
          // When complete, make sure we have the full content
          (fullContent) => {
            if (fullContent) {
              onResponseAction(fullContent);
            } else {
              onResponseAction("No response received");
            }
          }
        );
      } catch (err) {
        console.error('Error processing stream:', err);
        onResponseAction("Error processing response");
      }
      
      // Reset only the prompt field, keeping the model selection
      form.setValue("prompt", "");
    } catch (err) {
      console.error("Error calling API:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      
      onResponseAction(""); // Clear any previous response
    } finally {
      setIsLoading(false);
    }
  }

  const selectedModel = OPENROUTER_MODELS.find(model => model.id === form.watch("model"));

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OPENROUTER_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {selectedModel && (
            <Card className="bg-blue-50/70 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800">
              <CardContent className="pt-4 text-xs text-blue-700 dark:text-blue-300">
                <p><strong>{selectedModel.name}</strong> - {selectedModel.description}</p>
                <p className="mt-1">Context: {selectedModel.context_length.toLocaleString()} tokens | Pricing: {selectedModel.pricing?.prompt} (prompt), {selectedModel.pricing?.completion} (completion)</p>
              </CardContent>
            </Card>
          )}
          
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Prompt</FormLabel>
                <FormControl>
                  <div className="flex flex-col">
                    <textarea 
                      className="w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400"
                      placeholder="Enter your prompt here..." 
                      disabled={isLoading}
                      {...field} 
                    />
                    <div className="flex justify-end mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mr-2 border-blue-200 dark:border-blue-800"
                        onClick={() => form.setValue("prompt", "")}
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Clear
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                          </>
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-900 text-red-800 dark:text-red-300 rounded-md">
          {error === "API key not configured on server" ? (
            <>
              <strong>Error: OpenAI API key not configured!</strong>
              <p className="mt-2">Please add your OPENAPI_KEY to the .env file to use this application.</p>
              <p className="text-xs mt-1">Get an API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">https://openrouter.ai/keys</a></p>
            </>
          ) : (
            error
          )}
        </div>
      )}
    </div>
  );
}