"use client";

import React from "react";
import { Id } from "../convex/_generated/dataModel";
import { HoverableChange } from "./HoverableChange";

type ChangeGroup = {
  startPos: number;
  endPos: number;
  deletions: Array<{ text: string; position: number }>;
  insertions: Array<{ text: string; position: number }>;
  status?: "pending" | "accepted" | "rejected";
};

type ChangeGroupStatus = "pending" | "accepted" | "rejected";

interface InlineSuggestionsProps {
  suggestionId: Id<"aiSuggestions">;
  originalContent: string;
  changeGroups: ChangeGroup[];
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onAcceptChange?: (index: number) => void;
  onRejectChange?: (index: number) => void;
  isLoading?: boolean;
}

/**
 * Component that renders inline AI suggestions with highlighting
 * - Deletions are highlighted in red
 * - Insertions are highlighted in green
 * - Continuous modifications are grouped together
 * - Non-continuous changes are separated with unchanged text
 */
export default function InlineSuggestions({
  suggestionId,
  originalContent,
  changeGroups,
  onAcceptAll,
  onRejectAll,
  onAcceptChange,
  onRejectChange,
  isLoading = false,
}: InlineSuggestionsProps) {

  const handleAcceptChange = (index: number) => {
    if (onAcceptChange) {
      onAcceptChange(index);
    }
  };

  const handleRejectChange = (index: number) => {
    if (onRejectChange) {
      onRejectChange(index);
    }
  };

  const handleAcceptAll = () => {
    if (onAcceptAll) {
      onAcceptAll();
    }
  };

  const handleRejectAll = () => {
    if (onRejectAll) {
      onRejectAll();
    }
  };

  // Use the status from the backend (changeGroups now have status from DB)
  const remainingChanges = changeGroups.filter((g) => (g.status || "pending") === "pending").length;
  const hasIndividualActions = changeGroups.some((g) => (g.status || "pending") !== "pending");

  /**
   * Render the full content with inline AI-suggested changes
   * Shows:
   * - Unchanged text in normal style
   * - Deletions in red with strikethrough
   * - Insertions in green
   * - Change groups wrapped in hoverable components
   */
  const renderContentWithSuggestions = () => {
    // If no change groups, show the original content
    if (!changeGroups || changeGroups.length === 0) {
      console.log("No change groups, showing no changes message");
      return <span className="text-muted-foreground">No AI suggestions</span>;
    }

    const segments: JSX.Element[] = [];
    let segmentKey = 0;
    let lastEndPos = 0;

    // Sort change groups by startPos to process them in order
    const sortedGroups = [...changeGroups].sort((a, b) => a.startPos - b.startPos);

    console.log("=== InlineSuggestions Render Debug ===");
    console.log("Number of change groups:", sortedGroups.length);
    console.log("Change groups:", JSON.stringify(sortedGroups, null, 2));
    console.log("Original content length:", originalContent.length);

    for (let groupIndex = 0; groupIndex < sortedGroups.length; groupIndex++) {
      const group = sortedGroups[groupIndex];
      const status = group.status || "pending";

      console.log(`\n[Group ${groupIndex}] Processing position ${group.startPos}-${group.endPos}`);
      console.log(`[Group ${groupIndex}] Deletions: ${group.deletions.length}, Insertions: ${group.insertions.length}`);

      // Add unchanged text before this change group
      if (group.startPos > lastEndPos) {
        const unchangedText = originalContent.substring(lastEndPos, group.startPos);
        console.log(`Adding unchanged text from ${lastEndPos} to ${group.startPos}: "${unchangedText}"`);
        segments.push(
          <span key={`unchanged-${segmentKey++}`} className="text-foreground">
            {unchangedText}
          </span>
        );
      }

      // Update lastEndPos for the next iteration
      lastEndPos = group.endPos;

      // Build the change group elements (deletions + insertions)
      const changeGroupElements: JSX.Element[] = [];

      // Show deletions (red strikethrough) - the original text being removed
      if (group.deletions && group.deletions.length > 0) {
        for (const deletion of group.deletions) {
          console.log(`Adding deletion at ${deletion.position}: "${deletion.text}"`);
          changeGroupElements.push(
            <span
              key={`deletion-${segmentKey++}`}
              className="bg-red-100 text-red-800 line-through dark:bg-red-900/30 dark:text-red-300"
              title="AI suggests removing this text"
            >
              {deletion.text}
            </span>
          );
        }
      }

      // Show insertions (green) - new text being added
      if (group.insertions && group.insertions.length > 0) {
        for (const insertion of group.insertions) {
          console.log(`Adding insertion at ${insertion.position}: "${insertion.text}"`);
          changeGroupElements.push(
            <span
              key={`insertion-${segmentKey++}`}
              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              title="AI suggests adding this text"
            >
              {insertion.text}
            </span>
          );
        }
      }

      // Wrap change group with HoverableChange component
      segments.push(
        <HoverableChange
          key={`change-group-${groupIndex}`}
          groupIndex={groupIndex}
          status={status}
          onAccept={() => handleAcceptChange(groupIndex)}
          onReject={() => handleRejectChange(groupIndex)}
        >
          {changeGroupElements}
        </HoverableChange>
      );
    }

    // Add any remaining unchanged text after the last change group
    if (lastEndPos < originalContent.length) {
      const remainingText = originalContent.substring(lastEndPos);
      console.log(`Adding remaining unchanged text from ${lastEndPos} to end: "${remainingText}"`);
      segments.push(
        <span key={`unchanged-${segmentKey++}`} className="text-foreground">
          {remainingText}
        </span>
      );
    }

    console.log(`\n=== Render Summary ===`);
    console.log(`Total change groups rendered: ${sortedGroups.length}`);
    console.log(`Total segments (including unchanged text): ${segments.length}`);

    return segments;
  };

  return (
    <div className="space-y-4">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            AI Suggestions Available
            {hasIndividualActions && (
              <span className="ml-2 text-xs text-blue-700 dark:text-blue-300">
                ({remainingChanges} remaining)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRejectAll && remainingChanges > 0 && (
            <button
              onClick={handleRejectAll}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasIndividualActions ? "Reject Remaining" : "Reject All"}
            </button>
          )}
          {onAcceptAll && remainingChanges > 0 && (
            <button
              onClick={handleAcceptAll}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Applying..." : hasIndividualActions ? "Accept Remaining" : "Accept All"}
            </button>
          )}
          {hasIndividualActions && remainingChanges === 0 && (
            <button
              onClick={handleAcceptAll}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Applying..." : "Apply Changes"}
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
          <span>Deletion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
          <span>Insertion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span>Hover to accept/reject individual changes</span>
        </div>
      </div>

      {/* Content with inline suggestions */}
      <div className="bg-card border border-border rounded-lg p-6 overflow-visible">
        <div className="prose prose-sm max-w-none overflow-visible">
          <div className="whitespace-pre-wrap font-mono text-sm bg-transparent leading-relaxed overflow-visible">
            {renderContentWithSuggestions()}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-xs text-muted-foreground px-2">
        <p>
          {changeGroups.length} change {changeGroups.length === 1 ? "group" : "groups"} suggested
          {changeGroups.length > 0 && " • "}
          {changeGroups.reduce((acc, g) => acc + g.deletions.length, 0)} deletion
          {changeGroups.reduce((acc, g) => acc + g.deletions.length, 0) !== 1 && "s"}
          {", "}
          {changeGroups.reduce((acc, g) => acc + g.insertions.length, 0)} insertion
          {changeGroups.reduce((acc, g) => acc + g.insertions.length, 0) !== 1 && "s"}
        </p>
        {hasIndividualActions && (
          <p className="mt-1 flex items-center gap-4">
            <span className="text-green-600 dark:text-green-400">
              ✓ {changeGroups.filter(g => (g.status || "pending") === "accepted").length} accepted
            </span>
            <span className="text-red-600 dark:text-red-400">
              ✗ {changeGroups.filter(g => (g.status || "pending") === "rejected").length} rejected
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              ⏳ {remainingChanges} pending
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
