"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import DiffDisplay from "./DiffDisplay";
import ChangeActionButtons from "./ChangeActionButtons";

interface DocumentEditorProps {
  documentId: Id<"documents">;
}

export default function DocumentEditor({ documentId }: DocumentEditorProps) {
  const { user } = useUser();
  const [editMode, setEditMode] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [viewDiff, setViewDiff] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const document = useQuery(api.documents.getDiffContent, { documentId });
  const updateContent = useMutation(api.documents.updateContent);
  const approveChange = useMutation(api.documents.approveChange);
  const rejectChange = useMutation(api.documents.rejectChange);

  useEffect(() => {
    if (document) {
      setCurrentText(document.currentContent);
    }
  }, [document]);

  const handleSaveEdit = async () => {
    if (!user || !document) return;

    try {
      await updateContent({
        documentId,
        currentContent: currentText,
        userId: user.id,
      });
      setEditMode(false);
      setViewDiff(true);
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    setIsActionLoading(true);

    try {
      await approveChange({
        documentId,
        userId: user.id,
      });
      setViewDiff(false);
    } catch (error) {
      console.error("Failed to approve changes:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    setIsActionLoading(true);

    try {
      await rejectChange({
        documentId,
        userId: user.id,
      });
      setViewDiff(false);
      setEditMode(false);
    } catch (error) {
      console.error("Failed to reject changes:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (document) {
      setCurrentText(document.currentContent);
    }
    setEditMode(false);
  };

  if (!document) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  const hasChanges = document.originalContent !== document.currentContent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-mona-heading">Document Editor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Status:{" "}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                document.status === "approved"
                  ? "bg-green-100 text-green-800"
                  : document.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : document.status === "pendingReview"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {document.status === "pendingReview"
                ? "Pending Review"
                : document.status.charAt(0).toUpperCase() +
                  document.status.slice(1)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && !editMode && (
            <>
              <button
                onClick={() => setViewDiff(!viewDiff)}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  viewDiff
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-accent"
                }`}
              >
                {viewDiff ? "Hide" : "View"} Diff
              </button>
              {viewDiff && (
                <button
                  onClick={() => setSplitView(!splitView)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-border bg-card hover:bg-accent transition-colors"
                >
                  {splitView ? "Inline" : "Split"} View
                </button>
              )}
            </>
          )}
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-80 transition-opacity"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Document
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={currentText === document.currentContent}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor or Content Display */}
      {editMode ? (
        <div className="bg-card border border-border rounded-lg p-4">
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            className="w-full min-h-[400px] bg-transparent border-none outline-none text-sm font-mono resize-y"
            placeholder="Start typing your content..."
          />
        </div>
      ) : viewDiff && hasChanges ? (
        <div className="space-y-4">
          <DiffDisplay
            oldValue={document.originalContent}
            newValue={document.currentContent}
            splitView={splitView}
            showDiffOnly={true}
          />
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Review the changes and approve or reject them.
            </p>
            <ChangeActionButtons
              onApprove={handleApprove}
              onReject={handleReject}
              isLoading={isActionLoading}
              hasChanges={hasChanges}
            />
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-mono text-sm text-foreground bg-transparent">
              {document.currentContent}
            </pre>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
        <p>Created: {new Date(document.createdAt).toLocaleString()}</p>
        <p>Last Updated: {new Date(document.updatedAt).toLocaleString()}</p>
        <p>Last Edited By: {document.lastEditedBy}</p>
      </div>
    </div>
  );
}
