"use client";

import React from "react";

type ChangeGroup = {
  startPos: number;
  endPos: number;
  deletions: Array<{ text: string; position: number }>;
  insertions: Array<{ text: string; position: number }>;
};

interface InlineSuggestionsProps {
  originalContent: string;
  changeGroups: ChangeGroup[];
  onAccept?: () => void;
  onReject?: () => void;
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
  originalContent,
  changeGroups,
  onAccept,
  onReject,
  isLoading = false,
}: InlineSuggestionsProps) {
  /**
   * Render the content with inline suggestions
   * This breaks down the text into segments with proper highlighting
   */
  const renderContentWithSuggestions = () => {
    if (!changeGroups || changeGroups.length === 0) {
      return <span className="text-foreground">{originalContent}</span>;
    }

    const segments: JSX.Element[] = [];
    let currentPos = 0;
    let segmentKey = 0;

    // Sort change groups by startPos to process them in order
    const sortedGroups = [...changeGroups].sort((a, b) => a.startPos - b.startPos);

    for (const group of sortedGroups) {
      // Add unchanged text before this group
      if (currentPos < group.startPos) {
        const unchangedText = originalContent.substring(currentPos, group.startPos);
        segments.push(
          <span key={`unchanged-${segmentKey++}`} className="text-foreground">
            {unchangedText}
          </span>
        );
      }

      // Render the change group
      const groupSegments: JSX.Element[] = [];

      // Add deletions (red highlight)
      if (group.deletions && group.deletions.length > 0) {
        for (const deletion of group.deletions) {
          groupSegments.push(
            <span
              key={`deletion-${segmentKey++}`}
              className="bg-red-100 text-red-800 line-through dark:bg-red-900/30 dark:text-red-300"
              title="Deletion suggested by AI"
            >
              {deletion.text}
            </span>
          );
        }
      }

      // Add insertions (green highlight) - placed adjacent to deletions if continuous
      if (group.insertions && group.insertions.length > 0) {
        for (const insertion of group.insertions) {
          groupSegments.push(
            <span
              key={`insertion-${segmentKey++}`}
              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              title="Insertion suggested by AI"
            >
              {insertion.text}
            </span>
          );
        }
      }

      // Wrap the group in a container
      segments.push(
        <span key={`group-${group.startPos}-${segmentKey++}`} className="inline">
          {groupSegments}
        </span>
      );

      // Update current position
      currentPos = Math.max(currentPos, group.endPos);
    }

    // Add any remaining unchanged text
    if (currentPos < originalContent.length) {
      const remainingText = originalContent.substring(currentPos);
      segments.push(
        <span key={`unchanged-end-${segmentKey++}`} className="text-foreground">
          {remainingText}
        </span>
      );
    }

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
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onReject && (
            <button
              onClick={onReject}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject
            </button>
          )}
          {onAccept && (
            <button
              onClick={onAccept}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Applying..." : "Accept"}
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
      </div>

      {/* Content with inline suggestions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-mono text-sm bg-transparent leading-relaxed">
            {renderContentWithSuggestions()}
          </pre>
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
      </div>
    </div>
  );
}
