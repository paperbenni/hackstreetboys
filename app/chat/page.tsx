"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponseDisplay } from "@/components/prompt/response-display";
import { ApiKeyWarning } from "@/components/api-key-warning";
import { PromptForm } from "@/components/prompt/prompt-form";

export default function Home() {
  const [response, setResponse] = useState<string>("");
  const [responseModel, setResponseModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseTimestamp, setResponseTimestamp] = useState<Date | null>(null);

  const handleSubmitPrompt = (model: string) => {
    setIsLoading(true);
    setResponseModel(model);
  };

  const handleResponse = (text: string) => {
    setResponse(text);
    setIsLoading(false);
    setResponseTimestamp(new Date());
  };

  return (
    <div className="grid grid-rows-[1fr_20px] items-center justify-items-center min-h-[calc(100vh-64px)] p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <main className="flex flex-col gap-[32px] row-start-1 items-center w-full max-w-4xl bg-white/50 dark:bg-black/20 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-slate-200 dark:border-slate-700">
        <ApiKeyWarning />

        <Card className="w-full mt-8 border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800 dark:text-slate-300">
              Talk to AI Models via OpenRouter
            </CardTitle>
            <CardDescription>
              Send prompts to leading AI models from Anthropic, OpenAI, Google,
              and more through a single API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PromptForm
              onResponseAction={handleResponse}
              onSubmitAction={handleSubmitPrompt}
            />

            <ResponseDisplay
              response={response}
              modelId={responseModel}
              timestamp={responseTimestamp || undefined}
              isLoading={isLoading}
              maxHeight="70vh"
            />
          </CardContent>
        </Card>
      </main>
      <footer className="row-start-3 py-3 px-6"></footer>
    </div>
  );
}
