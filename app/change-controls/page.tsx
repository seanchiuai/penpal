"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ChangeControlEditor } from "@/components/ChangeControlEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  IconPlus,
  IconFileText,
  IconClock,
} from "@tabler/icons-react";

export default function ChangeControlsPage() {
  const { user } = useUser();
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"documents"> | null>(null);
  const [showNewDocument, setShowNewDocument] = useState(false);

  const documents = useQuery(
    api.changeControlDocuments.listDocuments,
    user ? { userId: user.id } : "skip"
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Please sign in to use Change Controls
          </p>
        </Card>
      </div>
    );
  }

  const handleDocumentCreated = (documentId: Id<"documents">) => {
    setSelectedDocumentId(documentId);
    setShowNewDocument(false);
  };

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Change Controls</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage document changes with inline approval controls
          </p>
        </div>
        <Button
          onClick={() => {
            setShowNewDocument(true);
            setSelectedDocumentId(null);
          }}
          className="flex items-center gap-2"
        >
          <IconPlus className="h-4 w-4" />
          New Document
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document List Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Your Documents</h2>
            {documents === undefined ? (
              <div className="space-y-2">
                <div className="h-16 bg-muted animate-pulse rounded" />
                <div className="h-16 bg-muted animate-pulse rounded" />
                <div className="h-16 bg-muted animate-pulse rounded" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <IconFileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No documents yet. Create your first document to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <button
                    key={doc._id}
                    onClick={() => {
                      setSelectedDocumentId(doc._id);
                      setShowNewDocument(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDocumentId === doc._id
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-border hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <IconFileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {doc.title}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <IconClock className="h-3 w-3" />
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-3">
          {showNewDocument || (!selectedDocumentId && documents?.length === 0) ? (
            <ChangeControlEditor
              documentId={null}
              userId={user.id}
              onDocumentCreated={handleDocumentCreated}
            />
          ) : selectedDocumentId ? (
            <ChangeControlEditor
              documentId={selectedDocumentId}
              userId={user.id}
              onDocumentCreated={handleDocumentCreated}
            />
          ) : (
            <Card className="p-12 text-center">
              <IconFileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Select a document to edit
              </h3>
              <p className="text-muted-foreground mb-4">
                Choose a document from the list or create a new one
              </p>
              <Button
                onClick={() => {
                  setShowNewDocument(true);
                  setSelectedDocumentId(null);
                }}
                className="flex items-center gap-2 mx-auto"
              >
                <IconPlus className="h-4 w-4" />
                Create New Document
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Info Section */}
      <Card className="p-6 bg-muted/50">
        <h3 className="text-lg font-semibold mb-2">How Change Controls Work</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">1.</span>
            <span>Create a document or select an existing one</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">2.</span>
            <span>Make edits to the document content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">3.</span>
            <span>Submit your changes for review</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <span>
              Review pending changes with inline controls: Accept, Reject, or
              Tweak
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">5.</span>
            <span>
              Changes are tracked atomically and applied to the document when
              approved
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
