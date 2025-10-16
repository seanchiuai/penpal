"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignUpButton, SignInButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconSparkles, IconFileText } from "@tabler/icons-react";
import { DocumentList } from "@/components/DocumentList";

export default function Home() {
  return (
    <>
      <Authenticated>
        <TextEditorHome />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  );
}

function TextEditorHome() {
  const { user } = useUser();
  const router = useRouter();
  const [text, setText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const createDocument = useMutation(api.documents.createDocument);

  const handleCreateDocument = async () => {
    if (!text.trim() || !user) return;

    setIsCreating(true);
    try {
      const documentId = await createDocument({
        originalContent: text,
        currentContent: text,
        userId: user.id,
      });

      // Redirect to the document editor
      router.push(`/documents/${documentId}`);
    } catch (error) {
      console.error("Failed to create document:", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-mona-heading mb-2 flex items-center justify-center gap-2">
            <IconSparkles className="w-8 h-8 text-primary" />
            VIBED
          </h1>
          <p className="text-muted-foreground">
            Paste your text below to start editing and tracking changes
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFileText className="w-5 h-5" />
              Create New Document
            </CardTitle>
            <CardDescription>
              Paste or type your text to create a new document with change tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setText("")}
                disabled={!text.trim() || isCreating}
              >
                Clear
              </Button>
              <Button
                onClick={handleCreateDocument}
                disabled={!text.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create Document"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <DocumentList />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Track Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                View inline diffs highlighting exactly what changed in your documents
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review & Approve</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Approve or reject changes with a single click before finalizing
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Keep track of original and current versions of your content
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <h1 className="text-4xl font-mona-heading mb-2 flex items-center justify-center gap-2">
          <IconSparkles className="w-8 h-8 text-primary" />
          VIBED
        </h1>
        <p className="text-muted-foreground mb-8">
          Sign in to start tracking and managing your document changes
        </p>
        <div className="flex flex-col gap-3">
          <SignInButton mode="modal">
            <button className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="w-full px-4 py-2.5 border border-border rounded-lg hover:bg-secondary transition-colors">
              Create account
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}
