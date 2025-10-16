"use client";

import React, { useState } from "react";

type ChangeGroup = {
  startPos: number;
  endPos: number;
  deletions: Array<{ text: string; position: number }>;
  insertions: Array<{ text: string; position: number }>;
};

type ChangeGroupStatus = "pending" | "accepted" | "rejected";

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
  // Track the status of each change group individually
  const [changeStatuses, setChangeStatuses] = useState<ChangeGroupStatus[]>(
    changeGroups.map(() => "pending")
  );
  const [hoveredChangeIndex, setHoveredChangeIndex] = useState<number | null>(null);

  const handleAcceptChange = (index: number) => {
    setChangeStatuses((prev) =>
      prev.map((status, i) => (i === index ? "accepted" : status))
    );
  };

  const handleRejectChange = (index: number) => {
    setChangeStatuses((prev) =>
      prev.map((status, i) => (i === index ? "rejected" : status))
    );
  };

  const handleAcceptAll = () => {
    if (onAccept) {
      onAccept();
    }
  };

  const handleRejectAll = () => {
    if (onReject) {
      onReject();
    }
  };

  const remainingChanges = changeStatuses.filter((s) => s === "pending").length;
  const hasIndividualActions = changeStatuses.some((s) => s !== "pending");

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

    for (let groupIndex = 0; groupIndex < sortedGroups.length; groupIndex++) {
      const group = sortedGroups[groupIndex];
      const status = changeStatuses[groupIndex];
      const isHovered = hoveredChangeIndex === groupIndex;

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

      // Wrap the entire change group in a container for hover interaction
      const changeGroupElements: JSX.Element[] = [];

      // 2. Show ALL deletions (red strikethrough) - this is the original text being removed
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

      // 3. Show ALL insertions (green) - this is new text being added
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

      // Wrap change group with hover interaction container
      segments.push(
        <span
          key={`change-group-${groupIndex}`}
          className={`relative inline-block group/change ${
            status === "accepted" ? "opacity-50" : status === "rejected" ? "opacity-30 line-through" : ""
          }`}
          onMouseEnter={() => status === "pending" && setHoveredChangeIndex(groupIndex)}
          onMouseLeave={() => setHoveredChangeIndex(null)}
        >
          {changeGroupElements}
          {/* Hover action buttons */}
          {isHovered && status === "pending" && (
            <span className="absolute -top-8 left-0 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg px-2 py-1 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptChange(groupIndex);
                }}
                className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                title="Accept this change"
              >
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejectChange(groupIndex);
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                title="Reject this change"
              >
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {/* Status indicator for accepted/rejected changes */}
          {status === "accepted" && (
            <span className="ml-1 inline-flex items-center text-green-600 dark:text-green-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          {status === "rejected" && (
            <span className="ml-1 inline-flex items-center text-red-600 dark:text-red-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </span>
      );

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
            {hasIndividualActions && (
              <span className="ml-2 text-xs text-blue-700 dark:text-blue-300">
                ({remainingChanges} remaining)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onReject && remainingChanges > 0 && (
            <button
              onClick={handleRejectAll}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasIndividualActions ? "Reject Remaining" : "Reject All"}
            </button>
          )}
          {onAccept && remainingChanges > 0 && (
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
        {hasIndividualActions && (
          <p className="mt-1 flex items-center gap-4">
            <span className="text-green-600 dark:text-green-400">
              ✓ {changeStatuses.filter(s => s === "accepted").length} accepted
            </span>
            <span className="text-red-600 dark:text-red-400">
              ✗ {changeStatuses.filter(s => s === "rejected").length} rejected
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
