'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'

interface TiptapEditorProps {
  content?: string
  placeholder?: string
  editable?: boolean
  onChange?: (content: string) => void
}

export function TiptapEditor({
  content = '',
  placeholder = 'Start writing...',
  editable = true,
  onChange
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline hover:text-blue-600',
        },
      }),
    ],
    content,
    editable,
    // Prevent SSR issues in Next.js
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  return (
    <div className="border rounded-lg p-4 min-h-[200px] focus-within:ring-2 focus-within:ring-ring">
      <EditorContent editor={editor} />
    </div>
  )
}
