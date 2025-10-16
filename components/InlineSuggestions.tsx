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
   * Shows the COMPLETE original text with AI suggestions overlaid:
   * - All original unchanged text is visible in normal color
   * - Deletions are shown in red with strikethrough
   * - Insertions are shown in green right after deletions
   *
   * Algorithm:
   * 1. Walk through original text position by position
   * 2. When we hit a change group, show: unchanged text before it, then deletions, then insertions
   * 3. Continue until all text is rendered
   */
  const renderContentWithSuggestions = () => {
    // If no change groups, just show the original content as-is
    if (!changeGroups || changeGroups.length === 0) {
      console.log("No change groups, showing original content");
      return <span className="text-foreground">{originalContent}</span>;
    }

    // If original content is empty, nothing to show
    if (!originalContent) {
      console.log("No original content to display");
      return <span className="text-muted-foreground">No content</span>;
    }

    const segments: JSX.Element[] = [];
    let currentPos = 0;
    let segmentKey = 0;

    // Sort change groups by startPos to process them in order
    const sortedGroups = [...changeGroups].sort((a, b) => a.startPos - b.startPos);

    console.log("=== InlineSuggestions Render Debug ===");
    console.log("Original content length:", originalContent.length);
    console.log("Original content preview:", originalContent.substring(0, 100) + "...");
    console.log("Number of change groups:", sortedGroups.length);
    console.log("Change groups:", JSON.stringify(sortedGroups, null, 2));

    for (const group of sortedGroups) {
      console.log(`\n[Group] Processing position ${group.startPos}-${group.endPos}, currentPos: ${currentPos}`);
      console.log(`[Group] Deletions: ${group.deletions.length}, Insertions: ${group.insertions.length}`);

      // 1. Add ALL unchanged text BEFORE this change group
      if (currentPos < group.startPos) {
        const unchangedText = originalContent.substring(currentPos, group.startPos);
        console.log(`[Unchanged] Adding ${unchangedText.length} chars from ${currentPos} to ${group.startPos}`);
        console.log(`[Unchanged] Text preview: "${unchangedText.substring(0, 50)}..."`);
        segments.push(
          <span key={`unchanged-${segmentKey++}`} className="text-foreground">
            {unchangedText}
          </span>
        );
      } else if (currentPos > group.startPos) {
        console.warn(`[Warning] currentPos (${currentPos}) is beyond group.startPos (${group.startPos})! This might cause text to be skipped.`);
      }

      // 2. Show ALL deletions (red strikethrough) - this is the original text being removed
      if (group.deletions && group.deletions.length > 0) {
        for (const deletion of group.deletions) {
          console.log(`Adding deletion at ${deletion.position}: "${deletion.text}"`);
          segments.push(
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

      // 3. Show ALL insertions (green) - this is new text being added
      if (group.insertions && group.insertions.length > 0) {
        for (const insertion of group.insertions) {
          console.log(`Adding insertion at ${insertion.position}: "${insertion.text}"`);
          segments.push(
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

      // 4. Update position: we've now processed up to the end of this group's deletions
      // Use the group's endPos which represents where deletions end in the original
      currentPos = group.endPos;
      console.log(`After group, currentPos updated to: ${currentPos}`);
    }

    // 5. Add ALL remaining unchanged text at the END
    if (currentPos < originalContent.length) {
      const remainingText = originalContent.substring(currentPos);
      console.log(`\n[Final] Adding ${remainingText.length} chars of remaining text from ${currentPos} to end`);
      console.log(`[Final] Text preview: "${remainingText.substring(0, 50)}..."`);
      segments.push(
        <span key={`unchanged-end-${segmentKey++}`} className="text-foreground">
          {remainingText}
        </span>
      );
    } else if (currentPos > originalContent.length) {
      console.error(`[Error] currentPos (${currentPos}) exceeds original content length (${originalContent.length})!`);
    }

    console.log(`\n=== Render Summary ===`);
    console.log(`Total segments rendered: ${segments.length}`);
    console.log(`Original content length: ${originalContent.length}`);
    console.log(`Final currentPos: ${currentPos}`);

    // Calculate total rendered length for validation
    const totalLength = segments.reduce((acc, seg) => {
      const text = seg.props.children;
      return acc + (typeof text === 'string' ? text.length : 0);
    }, 0);
    console.log(`Total rendered text length: ${totalLength}`);

    if (totalLength < originalContent.length) {
      console.error(`[Error] Some text was NOT rendered! Missing ${originalContent.length - totalLength} characters.`);
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
