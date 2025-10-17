"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DocumentEditor } from "@/components/smart-editor/DocumentEditor";
import { AIChatSidebar } from "@/components/smart-editor/AIChatSidebar";
import { Id } from "@/convex/_generated/dataModel";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DocumentPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const documentId = id as Id<"documents">;

  const document = useQuery(api.documents.getSmartDocument, { documentId });
  const aiSuggestion = useQuery(api.aiSuggestions.getLatestPending, { documentId });
  const updateContent = useMutation(api.documents.updateSmartDocumentContent);
  const updateTitle = useMutation(api.documents.updateSmartDocumentTitle);
  const acceptChanges = useMutation(api.documents.acceptAIChanges);
  const rejectChanges = useMutation(api.documents.rejectAIChanges);
  const acceptPendingChangeGroups = useMutation(api.aiSuggestions.acceptPendingChangeGroups);
  const rejectPendingChangeGroups = useMutation(api.aiSuggestions.rejectPendingChangeGroups);
  const acceptChangeGroup = useMutation(api.aiSuggestions.acceptChangeGroup);
  const rejectChangeGroup = useMutation(api.aiSuggestions.rejectChangeGroup);
  const sendAIRequest = useAction(api.aiActions.sendAIRequest);

  const [isAILoading, setIsAILoading] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isTitleEditing, setIsTitleEditing] = useState(false);

  // Initialize title when document loads
  useState(() => {
    if (document && !editedTitle) {
      setEditedTitle(document.title);
    }
  });

  const handleSaveContent = async (newContent: string) => {
    await updateContent({
      documentId,
      newContent,
    });
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== document?.title) {
      try {
        await updateTitle({
          documentId,
          newTitle: editedTitle.trim(),
        });
        toast.success("Title updated");
      } catch (error) {
        console.error("Error updating title:", error);
        toast.error("Failed to update title");
        // Revert to original title on error
        if (document) {
          setEditedTitle(document.title);
        }
      }
    }
    setIsTitleEditing(false);
  };

  const handleSendPrompt = async (prompt: string) => {
    setIsAILoading(true);
    try {
      await sendAIRequest({
        documentId,
        prompt,
      });
    } catch (error) {
      console.error("Error sending AI request:", error);
      throw error;
    } finally {
      setIsAILoading(false);
    }
  };

  const handleAcceptChanges = async () => {
    await acceptChanges({ documentId });
  };

  const handleRejectChanges = async () => {
    await rejectChanges({ documentId });
  };

  const handleAcceptAllPending = async () => {
    if (!aiSuggestion?._id) return;
    try {
      await acceptPendingChangeGroups({ suggestionId: aiSuggestion._id });
      toast.success("All pending changes accepted");
    } catch (error) {
      console.error("Error accepting pending changes:", error);
      toast.error("Failed to accept pending changes");
    }
  };

  const handleRejectAllPending = async () => {
    if (!aiSuggestion?._id) return;
    try {
      await rejectPendingChangeGroups({ suggestionId: aiSuggestion._id });
      toast.success("All pending changes rejected");
    } catch (error) {
      console.error("Error rejecting pending changes:", error);
      toast.error("Failed to reject pending changes");
    }
  };

  const handleAcceptIndividualChange = async (index: number) => {
    if (!aiSuggestion?._id) return;
    try {
      await acceptChangeGroup({
        suggestionId: aiSuggestion._id,
        changeGroupIndex: index,
      });
      toast.success("Change accepted");
    } catch (error) {
      console.error("Error accepting change:", error);
      toast.error("Failed to accept change");
    }
  };

  const handleRejectIndividualChange = async (index: number) => {
    if (!aiSuggestion?._id) return;
    try {
      await rejectChangeGroup({
        suggestionId: aiSuggestion._id,
        changeGroupIndex: index,
      });
      toast.success("Change rejected");
    } catch (error) {
      console.error("Error rejecting change:", error);
      toast.error("Failed to reject change");
    }
  };

  if (document === undefined) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (document === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Document not found</h2>
          <p className="text-muted-foreground mb-6">
            This document may have been deleted or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/documents")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="flex items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/documents")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {isTitleEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveTitle();
                } else if (e.key === "Escape") {
                  setEditedTitle(document.title);
                  setIsTitleEditing(false);
                }
              }}
              className="text-xl font-semibold max-w-md"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsTitleEditing(true)}
            >
              {document.title}
            </h1>
          )}

          {document.isAIPending && (
            <div className="ml-auto flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              AI suggestions ready
            </div>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Document Editor */}
        <div className="flex-1 overflow-y-auto overflow-x-visible">
          <div className="max-w-4xl mx-auto p-6 overflow-visible">
            <DocumentEditor
              content={document.content || ""}
              proposedAIDiff={document.proposedAIDiff}
              isAIPending={document.isAIPending}
              aiSuggestionId={aiSuggestion?._id || null}
              changeGroups={aiSuggestion?.changeGroups || []}
              onSave={handleSaveContent}
              onAcceptAll={handleAcceptAllPending}
              onRejectAll={handleRejectAllPending}
              onAcceptChange={handleAcceptIndividualChange}
              onRejectChange={handleRejectIndividualChange}
            />
          </div>
        </div>

        {/* Right panel: AI Chat Sidebar */}
        <div className="w-[400px] flex-shrink-0">
          <AIChatSidebar
            isAIPending={document.isAIPending}
            isLoading={isAILoading}
            onSendPrompt={handleSendPrompt}
            onAcceptChanges={handleAcceptChanges}
            onRejectChanges={handleRejectChanges}
          />
        </div>
      </div>
    </div>
  );
}
