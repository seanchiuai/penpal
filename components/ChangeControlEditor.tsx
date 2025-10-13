"use client";

import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ChangeControls } from "@/components/ChangeControls";
import { IconDeviceFloppy, IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";

interface ChangeControlEditorProps {
  documentId: Id<"documents"> | null;
  userId: string;
  onDocumentCreated?: (documentId: Id<"documents">) => void;
}

export function ChangeControlEditor({
  documentId,
  userId,
  onDocumentCreated,
}: ChangeControlEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [previousContent, setPreviousContent] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(!documentId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const documentData = useQuery(
    api.changeControlDocuments.getDocument,
    documentId ? { documentId } : "skip"
  );

  const createDocument = useMutation(api.changeControlDocuments.createDocument);
  const submitChange = useMutation(api.changeControlChanges.submitChange);

  // Load document data when it changes
  useEffect(() => {
    if (documentData && !isCreatingNew) {
      setTitle(documentData.title);
      setContent(documentData.content);
      setPreviousContent(documentData.content);
    }
  }, [documentData, isCreatingNew]);

  const handleCreateDocument = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      const newDocumentId = await createDocument({
        title: title.trim(),
        content: content,
        userId,
      });
      toast.success("Document created successfully");
      setIsCreatingNew(false);
      onDocumentCreated?.(newDocumentId);
    } catch (error) {
      console.error("Failed to create document:", error);
      toast.error("Failed to create document");
    }
  };

  const detectChanges = (oldText: string, newText: string) => {
    // Simple diff algorithm - finds first difference
    let i = 0;
    while (i < oldText.length && i < newText.length && oldText[i] === newText[i]) {
      i++;
    }

    let oldEnd = oldText.length;
    let newEnd = newText.length;
    while (
      oldEnd > i &&
      newEnd > i &&
      oldText[oldEnd - 1] === newText[newEnd - 1]
    ) {
      oldEnd--;
      newEnd--;
    }

    return {
      startIndex: i,
      oldEndIndex: oldEnd,
      newEndIndex: newEnd,
      oldText: oldText.slice(i, oldEnd),
      newText: newText.slice(i, newEnd),
    };
  };

  const handleSubmitChange = async () => {
    if (!documentId) {
      toast.error("Please create a document first");
      return;
    }

    const diff = detectChanges(previousContent, content);

    if (diff.oldText === diff.newText) {
      toast.info("No changes detected");
      return;
    }

    let changeType: "insertion" | "deletion" | "replacement";
    if (diff.oldText === "") {
      changeType = "insertion";
    } else if (diff.newText === "") {
      changeType = "deletion";
    } else {
      changeType = "replacement";
    }

    try {
      await submitChange({
        documentId,
        userId,
        changeType,
        startIndex: diff.startIndex,
        endIndex: diff.oldEndIndex,
        newText: diff.newText,
        oldText: diff.oldText,
      });
      toast.success("Change submitted for review");
      setPreviousContent(content);
    } catch (error) {
      console.error("Failed to submit change:", error);
      toast.error("Failed to submit change");
    }
  };

  const handleChangeApproved = () => {
    toast.success("Change approved");
    // Refetch will happen automatically via Convex real-time updates
  };

  const handleChangeRejected = () => {
    toast.success("Change rejected");
    // Refetch will happen automatically via Convex real-time updates
  };

  if (isCreatingNew) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="content">Initial Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter initial document content..."
              className="mt-1 min-h-[300px]"
            />
          </div>
          <Button onClick={handleCreateDocument} className="flex items-center gap-2">
            <IconPlus className="h-4 w-4" />
            Create Document
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">
              Last updated: {documentData ? new Date(documentData.updatedAt).toLocaleString() : "N/A"}
            </p>
          </div>
          <div>
            <Label htmlFor="editor">Content</Label>
            <Textarea
              ref={textareaRef}
              id="editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Edit document content..."
              className="mt-1 min-h-[400px] font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitChange}
              className="flex items-center gap-2"
              disabled={content === previousContent}
            >
              <IconDeviceFloppy className="h-4 w-4" />
              Submit Change for Review
            </Button>
          </div>
        </div>
      </Card>

      {documentData && documentData.pendingChanges && documentData.pendingChanges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            Pending Changes ({documentData.pendingChanges.length})
          </h3>
          <div className="space-y-3">
            {documentData.pendingChanges.map((change) => (
              <ChangeControls
                key={change._id}
                change={change}
                onApproved={handleChangeApproved}
                onRejected={handleChangeRejected}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
