'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { EditorToolbar } from './EditorToolbar'

interface TiptapEditorWithToolbarProps {
  content?: string
  placeholder?: string
  editable?: boolean
  onChange?: (content: string) => void
}

export function TiptapEditorWithToolbar({
  content = '',
  placeholder = 'Start writing...',
  editable = true,
  onChange
}: TiptapEditorWithToolbarProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  return (
    <div className="border rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <div className="p-4 min-h-[200px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
