'use client'

import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap"
import { EditorContent, EditorProvider } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { api } from "../../convex/_generated/api"
import { Button } from "@/components/ui/button"

interface CollaborativeTiptapEditorProps {
  documentId: string
}

export function CollaborativeTiptapEditor({ documentId }: CollaborativeTiptapEditorProps) {
  const sync = useTiptapSync(api.tiptap, documentId)

  if (sync.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    )
  }

  if (sync.initialContent === null) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-muted-foreground">No document found</p>
        <Button
          onClick={() => sync.create({ type: "doc", content: [] })}
        >
          Create Document
        </Button>
      </div>
    )
  }

  return (
    <EditorProvider
      content={sync.initialContent}
      extensions={[StarterKit, sync.extension]}
    >
      <div className="border rounded-lg p-4 min-h-[400px]">
        <EditorContent editor={null} />
      </div>
    </EditorProvider>
  )
}
