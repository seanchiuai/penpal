"use client";

import { EditorContent, EditorProvider, useCurrentEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Button } from "@/components/ui/button";
import { IconArrowBackUp, IconBold, IconItalic, IconStrikethrough, IconH1, IconH2, IconList, IconListNumbers } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

interface CollaborativeEditorProps {
  initialContent: any;
  extension: Extension;
}

// Custom extension to highlight remote changes
const HighlightRemoteChanges = Extension.create({
  name: "highlightRemoteChanges",

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey("highlightRemoteChanges");
    let highlightTimeouts: NodeJS.Timeout[] = [];

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, decorationSet) {
            // Clear existing decorations
            decorationSet = decorationSet.map(tr.mapping, tr.doc);

            // Check if this is a remote transaction (not from the local user)
            const isRemote = tr.getMeta("isRemote");

            if (isRemote) {
              // Add decorations for changed ranges
              const decorations: any[] = [];
              tr.steps.forEach((step: any, index: number) => {
                if (step.from !== undefined && step.to !== undefined) {
                  const from = tr.mapping.slice(index).map(step.from, -1);
                  const to = tr.mapping.slice(index).map(step.to, 1);

                  if (from < to) {
                    decorations.push(
                      Decoration.inline(from, to, {
                        class: "remote-change-highlight",
                      })
                    );
                  }
                }
              });

              if (decorations.length > 0) {
                decorationSet = decorationSet.add(tr.doc, decorations);

                // Clear the highlight after 3 seconds
                const timeout = setTimeout(() => {
                  // Clear highlights by dispatching a transaction
                  const view = (this as any).editor?.view;
                  if (view) {
                    const tr = view.state.tr;
                    tr.setMeta("clearHighlights", true);
                    view.dispatch(tr);
                  }
                }, 3000);

                highlightTimeouts.push(timeout);
              }
            }

            // Clear highlights if requested
            if (tr.getMeta("clearHighlights")) {
              decorationSet = DecorationSet.empty;
            }

            return decorationSet;
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state);
          },
        },
        view() {
          return {
            destroy() {
              highlightTimeouts.forEach((timeout) => clearTimeout(timeout));
              highlightTimeouts = [];
            },
          };
        },
      }),
    ];
  },
});

// Menu bar component that uses the editor from context
function MenuBar() {
  const { editor } = useCurrentEditor();
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateUndoState = () => {
      setCanUndo(editor.can().undo());
    };

    editor.on("transaction", updateUndoState);
    updateUndoState();

    return () => {
      editor.off("transaction", updateUndoState);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b bg-background p-2 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1">
        <Button
          variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <IconH1 className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <IconH2 className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <Button
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <IconBold className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <IconItalic className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <IconStrikethrough className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <Button
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <IconList className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <IconListNumbers className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!canUndo}
        title="Undo Last Change"
      >
        <IconArrowBackUp className="w-4 h-4 mr-2" />
        Undo
      </Button>
    </div>
  );
}

export function CollaborativeEditor({ initialContent, extension }: CollaborativeEditorProps) {
  const extensions = [
    StarterKit,
    extension,
    HighlightRemoteChanges,
  ];

  return (
    <div className="flex flex-col h-full">
      <EditorProvider
        slotBefore={<MenuBar />}
        extensions={extensions}
        content={initialContent}
      >
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <EditorContent />
          </div>
        </div>
      </EditorProvider>

      <style jsx global>{`
        .ProseMirror {
          min-height: 100%;
          outline: none;
        }

        .ProseMirror p {
          margin: 0.5rem 0;
          min-height: 1.5rem;
        }

        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
        }

        .ProseMirror blockquote {
          border-left: 3px solid rgba(255, 255, 255, 0.3);
          padding-left: 1rem;
          margin: 1rem 0;
          color: #d1d5db;
        }

        .ProseMirror code {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
        }

        .ProseMirror pre {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
        }

        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
        }

        .remote-change-highlight {
          background-color: rgba(59, 130, 246, 0.2);
          border-bottom: 2px solid rgba(59, 130, 246, 0.5);
          animation: fadeOut 3s ease-out;
          transition: background-color 0.3s ease;
        }

        @keyframes fadeOut {
          0% {
            background-color: rgba(59, 130, 246, 0.3);
          }
          100% {
            background-color: rgba(59, 130, 246, 0.1);
          }
        }

        /* Placeholder */
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #6b7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
