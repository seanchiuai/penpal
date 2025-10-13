"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPlus, IconFile, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

export default function LiveChangesPage() {
  const router = useRouter();
  const [newDocTitle, setNewDocTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const docs = useQuery(api.prosemirrorSync.listCollaborativeDocs) || [];
  const createDoc = useMutation(api.prosemirrorSync.createCollaborativeDoc);
  const deleteDoc = useMutation(api.prosemirrorSync.deleteCollaborativeDoc);

  const handleCreateDoc = async () => {
    if (!newDocTitle.trim()) return;

    setIsCreating(true);
    try {
      // Generate a unique document ID
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await createDoc({
        title: newDocTitle,
        docId: docId,
      });

      setNewDocTitle("");
      router.push(`/live/${docId}`);
    } catch (error) {
      console.error("Failed to create document:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDoc = async (id: Id<"collaborativeDocs">) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDoc({ id });
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Live Changes</h1>
        <p className="text-muted-foreground">
          Collaborate in real-time with live change tracking and highlighting
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Document</CardTitle>
          <CardDescription>
            Start a new collaborative document with live change tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter document title..."
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateDoc();
                }
              }}
              disabled={isCreating}
            />
            <Button
              onClick={handleCreateDoc}
              disabled={!newDocTitle.trim() || isCreating}
            >
              <IconPlus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Documents</h2>
        {docs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">
                <IconFile className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No documents yet. Create one to get started!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <Card
                key={doc._id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => router.push(`/live/${doc._id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription>
                        Created {new Date(doc.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDoc(doc._id);
                      }}
                    >
                      <IconTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Last modified: {new Date(doc.lastModified).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
