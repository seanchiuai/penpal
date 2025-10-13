"use client";

import { useParams, useRouter } from "next/navigation";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { api } from "@/convex/_generated/api";
import { CollaborativeEditor } from "@/components/CollaborativeEditor";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { Card } from "@/components/ui/card";

export default function LiveEditorPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  // Use the Convex sync hook for Tiptap
  const sync = useTiptapSync(api.prosemirrorSync, docId);

  const handleCreateDocument = () => {
    // Create document with empty initial content
    sync.create({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [],
        },
      ],
    });
  };

  if (sync.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (sync.initialContent === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">Document Not Found</h2>
          <p className="text-muted-foreground">
            This document hasn't been created yet. Would you like to create it?
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.push("/live")}>
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Button>
            <Button onClick={handleCreateDocument}>
              <IconDeviceFloppy className="w-4 h-4 mr-2" />
              Create Document
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/live")}
            >
              <IconArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Live Editor</h1>
              <p className="text-sm text-muted-foreground">
                Collaborative editing with real-time sync
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <CollaborativeEditor
          initialContent={sync.initialContent}
          extension={sync.extension}
        />
      </div>
    </div>
  );
}
