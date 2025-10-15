"use client";

import React, { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { IconSparkles, IconCheck, IconX, IconLoader2 } from "@tabler/icons-react";

interface AISidebarProps {
  documentId: Id<"documents">;
  currentContent: string;
}

export default function AISidebar({ documentId, currentContent }: AISidebarProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex hooks
  const generateSuggestions = useAction(api.suggestionActions.generateSuggestions);
  const acceptSuggestion = useMutation(api.suggestionMutations.acceptSuggestion);
  const rejectSuggestion = useMutation(api.suggestionMutations.rejectSuggestion);
  const bulkAcceptSuggestions = useMutation(api.suggestionMutations.bulkAcceptSuggestions);
  const bulkRejectSuggestions = useMutation(api.suggestionMutations.bulkRejectSuggestions);

  const pendingSuggestions = useQuery(
    api.suggestionQueries.getPendingSuggestionsForDocument,
    { documentId }
  );

  const handleGenerateSuggestions = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await generateSuggestions({
        documentId,
        currentContent,
        prompt: prompt.trim(),
      });
      setPrompt("");
    } catch (err) {
      console.error("Error generating suggestions:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate suggestions. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptSuggestion = async (suggestionId: Id<"suggestions">) => {
    try {
      await acceptSuggestion({ suggestionId });
    } catch (err) {
      console.error("Error accepting suggestion:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to accept suggestion"
      );
    }
  };

  const handleRejectSuggestion = async (suggestionId: Id<"suggestions">) => {
    try {
      await rejectSuggestion({ suggestionId });
    } catch (err) {
      console.error("Error rejecting suggestion:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reject suggestion"
      );
    }
  };

  const handleAcceptAll = async () => {
    if (!pendingSuggestions || pendingSuggestions.length === 0) return;

    try {
      const suggestionIds = pendingSuggestions.map((s) => s._id);
      await bulkAcceptSuggestions({ documentId, suggestionIds });
    } catch (err) {
      console.error("Error accepting all suggestions:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to accept all suggestions"
      );
    }
  };

  const handleRejectAll = async () => {
    if (!pendingSuggestions || pendingSuggestions.length === 0) return;

    try {
      const suggestionIds = pendingSuggestions.map((s) => s._id);
      await bulkRejectSuggestions({ documentId, suggestionIds });
    } catch (err) {
      console.error("Error rejecting all suggestions:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reject all suggestions"
      );
    }
  };

  const getSuggestionTypeLabel = (type: "insert" | "delete" | "replace") => {
    switch (type) {
      case "insert":
        return "Insert";
      case "delete":
        return "Delete";
      case "replace":
        return "Replace";
    }
  };

  const getSuggestionTypeColor = (type: "insert" | "delete" | "replace") => {
    switch (type) {
      case "insert":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "replace":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <IconSparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Assistant</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Ask AI to suggest improvements to your document
        </p>
      </div>

      {/* Prompt Input */}
      <div className="p-4 border-b border-border">
        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., 'Fix grammar errors', 'Make it more concise', 'Improve clarity'..."
            className="w-full min-h-[80px] p-3 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isGenerating}
          />
          <Button
            onClick={handleGenerateSuggestions}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <IconSparkles className="w-4 h-4 mr-2" />
                Generate Suggestions
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto">
        {pendingSuggestions === undefined ? (
          <div className="flex items-center justify-center py-8">
            <IconLoader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingSuggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <IconSparkles className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No pending suggestions
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Enter a prompt above to get AI suggestions
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Bulk Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground">
                {pendingSuggestions.length} Pending Suggestion
                {pendingSuggestions.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAcceptAll}
                  className="text-xs"
                >
                  <IconCheck className="w-3 h-3 mr-1" />
                  Accept All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRejectAll}
                  className="text-xs"
                >
                  <IconX className="w-3 h-3 mr-1" />
                  Reject All
                </Button>
              </div>
            </div>

            {/* Individual Suggestions */}
            {pendingSuggestions.map((suggestion, index) => (
              <div
                key={suggestion._id}
                className="p-3 border border-border rounded-lg bg-background/50 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSuggestionTypeColor(
                      suggestion.type
                    )}`}
                  >
                    {getSuggestionTypeLabel(suggestion.type)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {suggestion.type !== "insert" && suggestion.originalText && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Original:
                      </span>
                      <p className="mt-1 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-red-900 dark:text-red-100 font-mono">
                        {suggestion.originalText}
                      </p>
                    </div>
                  )}

                  {suggestion.type !== "delete" && suggestion.suggestedText && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Suggested:
                      </span>
                      <p className="mt-1 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-green-900 dark:text-green-100 font-mono">
                        {suggestion.suggestedText}
                      </p>
                    </div>
                  )}

                  <div className="pt-1">
                    <span className="font-medium text-muted-foreground">
                      Position:
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {suggestion.startIndex}
                      {suggestion.startIndex !== suggestion.endIndex &&
                        ` - ${suggestion.endIndex}`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptSuggestion(suggestion._id)}
                    className="flex-1"
                  >
                    <IconCheck className="w-3 h-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectSuggestion(suggestion._id)}
                    className="flex-1"
                  >
                    <IconX className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
