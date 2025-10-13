"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import DocumentEditor from "./DocumentEditor";

export default function DocumentsDashboard() {
  const { user } = useUser();
  const [selectedDocId, setSelectedDocId] = useState<Id<"documents"> | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOriginalContent, setNewOriginalContent] = useState("");
  const [newCurrentContent, setNewCurrentContent] = useState("");

  const documents = useQuery(api.documents.listAllDocuments);
  const createDocument = useMutation(api.documents.createDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newOriginalContent.trim()) return;

    try {
      const docId = await createDocument({
        originalContent: newOriginalContent.trim(),
        currentContent: newCurrentContent.trim() || newOriginalContent.trim(),
        userId: user.id,
      });
      setNewOriginalContent("");
      setNewCurrentContent("");
      setShowCreateForm(false);
      setSelectedDocId(docId);
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  const handleDeleteDocument = async (docId: Id<"documents">) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument({ documentId: docId });
      if (selectedDocId === docId) {
        setSelectedDocId(null);
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pendingReview":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status === "pendingReview"
      ? "Pending Review"
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mona-heading mb-2">Document Manager</h1>
        <p className="text-sm text-muted-foreground">
          Create documents, edit them, and review changes with inline diff
          viewer
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Document List */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-mona-medium">Documents</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
                title="Create new document"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>

            {showCreateForm && (
              <form
                onSubmit={handleCreateDocument}
                className="mb-4 p-3 bg-accent rounded-lg space-y-3"
              >
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Original Content
                  </label>
                  <textarea
                    value={newOriginalContent}
                    onChange={(e) => setNewOriginalContent(e.target.value)}
                    placeholder="Enter original content..."
                    className="w-full px-3 py-2 bg-card border border-border rounded text-sm font-mono resize-none"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Current Content (optional)
                  </label>
                  <textarea
                    value={newCurrentContent}
                    onChange={(e) => setNewCurrentContent(e.target.value)}
                    placeholder="Leave empty to match original..."
                    className="w-full px-3 py-2 bg-card border border-border rounded text-sm font-mono resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:opacity-80 transition-opacity"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewOriginalContent("");
                      setNewCurrentContent("");
                    }}
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {!documents ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No documents yet. Create one to get started!
                </div>
              ) : (
                documents.map((doc) => {
                  const hasChanges =
                    doc.originalContent !== doc.currentContent;
                  return (
                    <div
                      key={doc._id}
                      className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedDocId === doc._id
                          ? "bg-accent border-primary"
                          : "bg-card border-border hover:border-muted-foreground"
                      }`}
                      onClick={() => setSelectedDocId(doc._id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                                doc.status
                              )}`}
                            >
                              {getStatusLabel(doc.status)}
                            </span>
                            {hasChanges && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Modified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.originalContent.substring(0, 60)}
                            {doc.originalContent.length > 60 ? "..." : ""}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-all"
                          title="Delete document"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Document Editor */}
        <div className="lg:col-span-2">
          {selectedDocId ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <DocumentEditor documentId={selectedDocId} />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-mona-medium mb-2">
                No Document Selected
              </h3>
              <p className="text-sm text-muted-foreground">
                Select a document from the list or create a new one to get
                started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
