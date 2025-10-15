"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import DocumentEditor from "@/components/DocumentEditor";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as Id<"documents">;

  const document = useQuery(api.documents.getDiffContent, { documentId });

  if (document === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (document === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Document not found</p>
          <Button onClick={() => router.push("/")}>
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Main Content: Full Width */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <DocumentEditor documentId={documentId} />
        </div>
      </div>
    </div>
  );
}
