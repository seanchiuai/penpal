"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import InlineSuggestions from "@/components/InlineSuggestions";
import { Id } from "@/convex/_generated/dataModel";

interface Diff {
  type: number; // -1: deletion, 0: unchanged, 1: insertion
  text: string;
}

type ChangeGroup = {
  startPos: number;
  endPos: number;
  deletions: Array<{ text: string; position: number }>;
  insertions: Array<{ text: string; position: number }>;
  status?: "pending" | "accepted" | "rejected";
};

interface DocumentEditorProps {
  content: string;
  proposedAIDiff?: string;
  isAIPending: boolean;
  aiSuggestionId?: Id<"aiSuggestions"> | null;
  changeGroups?: ChangeGroup[];
  onSave: (content: string) => Promise<void>;
  onAcceptAll?: () => Promise<void>;
  onRejectAll?: () => Promise<void>;
  onAcceptChange?: (index: number) => Promise<void>;
  onRejectChange?: (index: number) => Promise<void>;
}

export function DocumentEditor({
  content,
  proposedAIDiff,
  isAIPending,
  aiSuggestionId,
  changeGroups,
  onSave,
  onAcceptAll,
  onRejectAll,
  onAcceptChange,
  onRejectChange,
}: DocumentEditorProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when content changes from props
  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleSave = async () => {
    if (editedContent === content) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedContent);
      toast.success("Document saved successfully");
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  // Parse diff and render with highlighting
  const renderDiffView = () => {
    if (!proposedAIDiff) {
      return null;
    }

    try {
      const diffs: [number, string][] = JSON.parse(proposedAIDiff);

      // Debug logging to see what we're receiving
      console.log("Total diff segments:", diffs.length);
      const unchangedCount = diffs.filter(([type]) => type === 0).length;
      const deletionCount = diffs.filter(([type]) => type === -1).length;
      const insertionCount = diffs.filter(([type]) => type === 1).length;
      console.log(`Unchanged: ${unchangedCount}, Deletions: ${deletionCount}, Insertions: ${insertionCount}`);

      // Log first few segments to debug
      console.log("First 3 diff segments:", diffs.slice(0, 3));

      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            AI Suggested Changes:
          </div>
          <div className="p-4 border rounded-lg bg-muted/50 max-h-[500px] overflow-y-auto whitespace-pre-wrap font-mono text-sm">
            {diffs.map((diff, index) => {
              const [type, text] = diff;

              if (type === -1) {
                // Deletion
                return (
                  <span
                    key={index}
                    className="bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200 line-through"
                  >
                    {text}
                  </span>
                );
              } else if (type === 1) {
                // Insertion
                return (
                  <span
                    key={index}
                    className="bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200"
                  >
                    {text}
                  </span>
                );
              } else {
                // Unchanged (type === 0)
                return (
                  <span key={index} className="text-foreground">
                    {text}
                  </span>
                );
              }
            })}
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error parsing diff:", error);
      return (
        <div className="text-sm text-destructive">
          Error displaying AI suggestions
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-visible">
      <div className="flex-1 flex flex-col space-y-4 overflow-visible">
        {/* Show InlineSuggestions if AI suggestions are pending with changeGroups */}
        {isAIPending && aiSuggestionId && changeGroups && changeGroups.length > 0 ? (
          <div className="flex-1 overflow-visible">
            <InlineSuggestions
              suggestionId={aiSuggestionId}
              originalContent={content}
              changeGroups={changeGroups}
              onAcceptAll={onAcceptAll}
              onRejectAll={onRejectAll}
              onAcceptChange={onAcceptChange}
              onRejectChange={onRejectChange}
            />
          </div>
        ) : isAIPending && proposedAIDiff ? (
          /* Fallback to old diff view if using proposedAIDiff format */
          <div className="flex-1">
            {renderDiffView()}
          </div>
        ) : (
          /* Editor - only shown when no AI suggestions are pending */
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground">
                Document Content
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                disabled={isSaving || editedContent === content}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1 min-h-[400px] font-mono text-sm resize-none"
              placeholder="Start typing your document..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
