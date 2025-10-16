# Tiptap Rich Text Editor Implementation Plan

## Overview
This plan details the implementation of Tiptap, a headless rich text editor framework, integrated with Convex for real-time collaborative editing capabilities in the Penpal application.

## Prerequisites
- Next.js 15 with App Router (✓ Already configured)
- Convex backend (✓ Already configured)
- Tailwind CSS & shadcn/ui (✓ Already configured)

## Phase 1: Core Installation

### 1.1 Install Core Tiptap Packages
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```

**Packages:**
- `@tiptap/react` - React integration and hooks
- `@tiptap/pm` - ProseMirror core (required peer dependency)
- `@tiptap/starter-kit` - Bundle of essential extensions (Document, Paragraph, Text, Bold, Italic, etc.)

### 1.2 Install Convex Sync Component
```bash
npm install @convex-dev/prosemirror-sync
```

**Purpose:** Enables real-time collaborative editing with automatic conflict resolution through Convex backend.

### 1.3 Install Optional Extensions (As Needed)
```bash
# Commonly used extensions
npm install @tiptap/extension-placeholder
npm install @tiptap/extension-link
npm install @tiptap/extension-image
npm install @tiptap/extension-underline
npm install @tiptap/extension-text-style
npm install @tiptap/extension-highlight
```

## Phase 2: Convex Backend Configuration

### 2.1 Update Convex Configuration
**File:** `convex/convex.config.ts`

```typescript
import { defineApp } from "convex/server";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config";

const app = defineApp();
app.use(prosemirrorSync);

export default app;
```

**Purpose:** Registers the ProseMirror sync component with Convex, making sync APIs available.

### 2.2 Create Tiptap Sync API
**File:** `convex/tiptap.ts` (new file)

```typescript
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi({
  // Optional configuration can be added here
});
```

**Purpose:** Exposes sync functions for document operations (get, submit, version control).

## Phase 3: Frontend Components

### 3.1 Create Base Tiptap Editor Component
**File:** `components/editor/TiptapEditor.tsx` (new file)

```tsx
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
```

**Key Features:**
- Client-side only (`'use client'`)
- `immediatelyRender: false` prevents Next.js SSR hydration issues
- Configurable placeholder, editability, and change handler
- Basic extensions included (heading, bold, italic, link, etc.)

### 3.2 Create Collaborative Tiptap Editor with Convex
**File:** `components/editor/CollaborativeTiptapEditor.tsx` (new file)

```tsx
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
```

**Key Features:**
- Real-time sync with Convex
- Automatic conflict resolution
- Loading states
- Document creation capability

### 3.3 Create Editor Toolbar Component
**File:** `components/editor/EditorToolbar.tsx` (new file)

```tsx
'use client'

import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    children
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
  }) => (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  )

  return (
    <div className="border-b p-2 flex flex-wrap gap-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}
```

**Features:**
- Rich formatting controls (bold, italic, underline)
- Heading levels (H1, H2, H3)
- Lists (bullet, ordered)
- Blockquotes and code blocks
- Undo/redo functionality
- Active state indicators

### 3.4 Create Complete Editor with Toolbar
**File:** `components/editor/TiptapEditorWithToolbar.tsx` (new file)

```tsx
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
```

## Phase 4: Styling

### 4.1 Add Tiptap Styles
**File:** `app/globals.css`

Add the following styles to customize the editor appearance:

```css
/* Tiptap Editor Styles */
.tiptap {
  outline: none;
}

.tiptap p {
  margin: 0.5rem 0;
}

.tiptap h1,
.tiptap h2,
.tiptap h3 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  line-height: 1.2;
}

.tiptap h1 {
  font-size: 2rem;
}

.tiptap h2 {
  font-size: 1.5rem;
}

.tiptap h3 {
  font-size: 1.25rem;
}

.tiptap ul,
.tiptap ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.tiptap ul {
  list-style-type: disc;
}

.tiptap ol {
  list-style-type: decimal;
}

.tiptap li {
  margin: 0.25rem 0;
}

.tiptap blockquote {
  border-left: 3px solid hsl(var(--border));
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: hsl(var(--muted-foreground));
}

.tiptap code {
  background-color: hsl(var(--muted));
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.tiptap pre {
  background-color: hsl(var(--muted));
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.tiptap pre code {
  background-color: transparent;
  padding: 0;
  font-size: inherit;
}

.tiptap a {
  color: hsl(var(--primary));
  text-decoration: underline;
  cursor: pointer;
}

.tiptap a:hover {
  opacity: 0.8;
}

.tiptap .is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
}

.tiptap.ProseMirror-focused {
  outline: none;
}

/* Selection styling */
.tiptap ::selection {
  background-color: hsl(var(--primary) / 0.2);
}
```

## Phase 5: Usage Examples

### 5.1 Basic Editor in a Page
**Example:** `app/notes/page.tsx`

```tsx
import { TiptapEditorWithToolbar } from '@/components/editor/TiptapEditorWithToolbar'

export default function NotesPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">My Notes</h1>
      <TiptapEditorWithToolbar
        placeholder="Start taking notes..."
      />
    </div>
  )
}
```

### 5.2 Collaborative Editor in a Page
**Example:** `app/documents/[id]/page.tsx`

```tsx
import { CollaborativeTiptapEditor } from '@/components/editor/CollaborativeTiptapEditor'

export default function DocumentPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Collaborative Document</h1>
      <CollaborativeTiptapEditor documentId={params.id} />
    </div>
  )
}
```

## Phase 6: Advanced Features (Optional)

### 6.1 Additional Extensions to Consider

```bash
# Syntax highlighting for code blocks
npm install @tiptap/extension-code-block-lowlight lowlight

# Tables
npm install @tiptap/extension-table

# Task lists
npm install @tiptap/extension-task-list @tiptap/extension-task-item

# Typography improvements
npm install @tiptap/extension-typography

# Drag and drop
npm install @tiptap/extension-file-handler
```

### 6.2 Bubble Menu for Link Editing
**File:** `components/editor/LinkBubbleMenu.tsx` (new file)

```tsx
'use client'

import { BubbleMenu, Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Link, Unlink } from 'lucide-react'

interface LinkBubbleMenuProps {
  editor: Editor
}

export function LinkBubbleMenu({ editor }: LinkBubbleMenuProps) {
  const [url, setUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const setLink = () => {
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
      setIsEditing(false)
      setUrl('')
    }
  }

  const unsetLink = () => {
    editor.chain().focus().unsetLink().run()
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isActive('link')}
    >
      <div className="flex items-center gap-2 p-2 bg-background border rounded-lg shadow-lg">
        {isEditing ? (
          <>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL"
              className="w-64"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setLink()
                }
              }}
            />
            <Button size="sm" onClick={setLink}>
              Save
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setUrl(editor.getAttributes('link').href)
                setIsEditing(true)
              }}
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={unsetLink}
            >
              <Unlink className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </BubbleMenu>
  )
}
```

### 6.3 Character/Word Count
**File:** `components/editor/EditorStats.tsx` (new file)

```tsx
'use client'

import { Editor } from '@tiptap/react'

interface EditorStatsProps {
  editor: Editor | null
}

export function EditorStats({ editor }: EditorStatsProps) {
  if (!editor) {
    return null
  }

  const { characters, words } = editor.storage.characterCount || {
    characters: () => 0,
    words: () => 0
  }

  return (
    <div className="flex gap-4 text-sm text-muted-foreground p-2">
      <span>{characters()} characters</span>
      <span>{words()} words</span>
    </div>
  )
}
```

## Phase 7: Testing & Validation

### 7.1 Test Checklist
- [ ] Editor renders correctly in Next.js client components
- [ ] No SSR hydration errors
- [ ] Toolbar buttons work and show active states
- [ ] Basic formatting (bold, italic, underline) works
- [ ] Headings (H1, H2, H3) render correctly
- [ ] Lists (bullet and ordered) work
- [ ] Blockquotes and code blocks function
- [ ] Undo/redo works
- [ ] Placeholder text appears when empty
- [ ] onChange callback fires correctly
- [ ] Collaborative sync works (if using Convex integration)
- [ ] Document creation works (if using Convex integration)
- [ ] Loading states display correctly
- [ ] Styles match the project's theme
- [ ] Mobile responsiveness

### 7.2 Performance Considerations
- Use `immediatelyRender: false` to prevent SSR issues
- Debounce onChange callbacks if saving to database
- For collaborative editing, consider snapshot debounce (default 1s)
- Lazy load additional extensions to reduce bundle size

## Phase 8: Documentation

### 8.1 Add Component Documentation
Create JSDoc comments for all exported components explaining:
- Props and their types
- Usage examples
- Important notes (e.g., must be used in client component)

### 8.2 Update Project README
Add section explaining:
- Tiptap integration
- Available editor components
- How to use basic vs collaborative editors
- Extension customization

## Implementation Order

1. **Phase 1**: Install core packages
2. **Phase 2**: Configure Convex backend (if using collaboration)
3. **Phase 3**: Create basic editor component
4. **Phase 4**: Add styling
5. **Phase 5**: Test basic editor
6. **Phase 3 (continued)**: Add toolbar and collaborative components
7. **Phase 6**: Add advanced features as needed
8. **Phase 7**: Comprehensive testing
9. **Phase 8**: Documentation

## Key Considerations

### Next.js Specific
- **MUST** use `'use client'` directive on all editor components
- **MUST** set `immediatelyRender: false` to prevent SSR issues
- Editor will only render on client side

### Convex Integration
- Provides automatic conflict resolution
- Real-time sync with debounced snapshots (default 1s)
- Can create documents client-side or server-side
- Supports offline editing with sync on reconnect

### Extension System
- Tiptap is highly modular - only install extensions you need
- StarterKit includes most common extensions
- Custom extensions can be created for project-specific needs
- Extensions can add nodes (structural elements), marks (formatting), or functionality

### Styling
- Tiptap is headless - no default styles
- All styling must be added via CSS
- Uses existing Tailwind theme variables for consistency
- ProseMirror class names can be targeted for customization

## Resources

- [Official Tiptap Docs](https://tiptap.dev)
- [Tiptap React Guide](https://tiptap.dev/installation/react)
- [Tiptap Next.js Guide](https://tiptap.dev/installation/nextjs)
- [Convex ProseMirror Sync](https://github.com/get-convex/prosemirror-sync)
- [ProseMirror Documentation](https://prosemirror.net/)

## Troubleshooting

### SSR Hydration Errors
**Solution**: Ensure `immediatelyRender: false` is set and component uses `'use client'`

### Editor Not Updating
**Solution**: Check that onChange callback is properly connected and editor instance is not null

### Collaborative Sync Not Working
**Solution**:
1. Verify Convex config includes prosemirrorSync component
2. Check that ConvexProvider wraps the component tree
3. Ensure document ID is valid and consistent

### Styling Not Applied
**Solution**:
1. Verify CSS is imported in globals.css
2. Check that Tailwind is processing the editor component files
3. Ensure no CSS specificity conflicts
