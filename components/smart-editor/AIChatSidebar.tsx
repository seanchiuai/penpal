"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AIChatSidebarProps {
  isAIPending: boolean;
  isLoading: boolean;
  onSendPrompt: (prompt: string) => Promise<void>;
  onAcceptChanges: () => Promise<void>;
  onRejectChanges: () => Promise<void>;
}

export function AIChatSidebar({
  isAIPending,
  isLoading,
  onSendPrompt,
  onAcceptChanges,
  onRejectChanges,
}: AIChatSidebarProps) {
  const [prompt, setPrompt] = useState("");

  const handleSendPrompt = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      await onSendPrompt(prompt.trim());
      setPrompt("");
      toast.success("AI is processing your request...");
    } catch (error) {
      console.error("Error sending prompt:", error);
      toast.error("Failed to send prompt");
    }
  };

  const handleAccept = async () => {
    try {
      await onAcceptChanges();
      toast.success("Changes accepted successfully");
    } catch (error) {
      console.error("Error accepting changes:", error);
      toast.error("Failed to accept changes");
    }
  };

  const handleReject = async () => {
    try {
      await onRejectChanges();
      toast.success("Changes rejected");
    } catch (error) {
      console.error("Error rejecting changes:", error);
      toast.error("Failed to reject changes");
    }
  };

  return (
    <div className="h-full flex flex-col border-l bg-muted/20">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">AI Assistant</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask the AI to help improve your document
        </p>
      </div>

      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        {/* AI Prompt Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What would you like to change?</CardTitle>
            <CardDescription>
              Describe how you want to modify your document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Make this more concise, fix grammar errors, add more detail to the introduction..."
              className="min-h-[120px] resize-none"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSendPrompt();
                }
              }}
            />
            <Button
              onClick={handleSendPrompt}
              disabled={isLoading || !prompt.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Suggestions
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit
            </p>
          </CardContent>
        </Card>

        {/* Accept/Reject Actions */}
        {isAIPending && (
          <>
            <Separator />
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-base">AI Suggestions Ready</CardTitle>
                <CardDescription>
                  Review the suggested changes and decide whether to accept or reject them
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleAccept}
                  className="w-full"
                  variant="default"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Accept All Changes
                </Button>
                <Button
                  onClick={handleReject}
                  className="w-full"
                  variant="outline"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject All Changes
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Quick Prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>
              Common editing tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              "Fix grammar and spelling errors",
              "Make this more concise",
              "Expand on the key points",
              "Improve the tone to be more professional",
              "Simplify the language for a general audience",
            ].map((quickPrompt) => (
              <Button
                key={quickPrompt}
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2 px-3"
                onClick={() => setPrompt(quickPrompt)}
                disabled={isLoading}
              >
                {quickPrompt}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-base text-blue-900 dark:text-blue-100">
              Tips for Better Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <ul className="list-disc list-inside space-y-1">
              <li>Be specific about what you want to change</li>
              <li>Review AI suggestions carefully before accepting</li>
              <li>You can make manual edits at any time</li>
              <li>Save your work frequently</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
