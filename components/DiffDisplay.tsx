"use client";

import React from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

interface DiffDisplayProps {
  oldValue: string;
  newValue: string;
  splitView?: boolean;
  showDiffOnly?: boolean;
}

export default function DiffDisplay({
  oldValue,
  newValue,
  splitView = false,
  showDiffOnly = true,
}: DiffDisplayProps) {
  // Custom styles for dark theme matching
  const customStyles = {
    variables: {
      light: {
        diffViewerBackground: "hsl(var(--card))",
        diffViewerColor: "hsl(var(--foreground))",
        addedBackground: "hsl(142 76% 36% / 0.15)",
        addedColor: "hsl(142 76% 36%)",
        removedBackground: "hsl(0 72% 51% / 0.15)",
        removedColor: "hsl(0 72% 51%)",
        wordAddedBackground: "hsl(142 76% 36% / 0.25)",
        wordRemovedBackground: "hsl(0 72% 51% / 0.25)",
        addedGutterBackground: "hsl(142 76% 36% / 0.1)",
        removedGutterBackground: "hsl(0 72% 51% / 0.1)",
        gutterBackground: "hsl(var(--muted))",
        gutterBackgroundDark: "hsl(var(--muted))",
        highlightBackground: "hsl(var(--accent))",
        highlightGutterBackground: "hsl(var(--accent))",
        codeFoldGutterBackground: "hsl(var(--muted))",
        codeFoldBackground: "hsl(var(--muted))",
        emptyLineBackground: "transparent",
        gutterColor: "hsl(var(--muted-foreground))",
        addedGutterColor: "hsl(142 76% 36%)",
        removedGutterColor: "hsl(0 72% 51%)",
        codeFoldContentColor: "hsl(var(--muted-foreground))",
        diffViewerTitleBackground: "hsl(var(--muted))",
        diffViewerTitleColor: "hsl(var(--foreground))",
        diffViewerTitleBorderColor: "hsl(var(--border))",
      },
    },
    line: {
      padding: "8px 12px",
      fontSize: "14px",
      lineHeight: "1.6",
      fontFamily: "ui-monospace, monospace",
    },
    gutter: {
      padding: "8px 8px",
      minWidth: "50px",
      textAlign: "right" as const,
      fontSize: "12px",
    },
    marker: {
      padding: "8px 4px",
    },
    wordDiff: {
      padding: "2px 0",
      display: "inline-block",
    },
    contentText: {
      wordBreak: "break-word" as const,
      whiteSpace: "pre-wrap" as const,
    },
  };

  // Check if there are no changes
  const hasChanges = oldValue !== newValue;

  if (!hasChanges) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-mona-medium mb-2">No Changes Detected</h3>
        <p className="text-sm text-muted-foreground">
          The current content is identical to the original.
        </p>
      </div>
    );
  }

  return (
    <div className="diff-viewer-wrapper border border-border rounded-lg overflow-hidden">
      <ReactDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={splitView}
        compareMethod={DiffMethod.WORDS}
        showDiffOnly={showDiffOnly}
        useDarkTheme={false}
        styles={customStyles}
        leftTitle="Original"
        rightTitle="Current"
      />
    </div>
  );
}
