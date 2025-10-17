"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFileText, IconClock } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function DocumentList() {
  const { user } = useUser();
  const documents = useQuery(
    api.documents.listSmartDocuments
  );
  const router = useRouter();

  if (!user) return null;

  const handleDocumentClick = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
      }
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
  };

  const getPreview = (content: string) => {
    const preview = content.trim().slice(0, 100);
    return preview.length < content.trim().length ? `${preview}...` : preview;
  };

  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconFileText className="w-5 h-5" />
          Recent Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc) => (
            <button
              key={doc._id}
              onClick={() => handleDocumentClick(doc._id)}
              className="w-full text-left p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm mb-1 truncate group-hover:text-primary transition-colors">
                    {doc.title || "Untitled Document"}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {doc.content ? getPreview(doc.content) : "Empty document"}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <IconClock className="w-3 h-3" />
                    <span>{formatDate(doc.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IconFileText className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
