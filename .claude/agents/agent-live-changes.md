name: agent-prosemirror-sync-live-changes
description: Implements Live Changes using @convex-dev/prosemirror-sync
model: inherit
color: purple
tech_stack:
  framework: Next.js
  database: convex
  auth: convex
  provider: prosemirror-sync
generated: 2025-10-07T15:49:00Z
documentation_sources: [https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGJyqmIq-SeMN5fcRI-_ZQIq-tBAn-2VMFyjKGX0O6imAu8B8p8GstVXvMCuYhGA3qe8CMRFt8BUyC1PcRDv6nxw1m0s4rFA5ur2BEIxQfKSQGCbuGoUptuZJzyjXEP3EYkHhZpXzs-w-LjI-VzO9X7yWoFsvEk4MYdxB_XWjiPbAkWNA==, https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHKXdWShUKEy2uy8khzYmo0tZjIOb4ikSajbUlK4JwAPLIwwwq12v8ukCcRSpKY4v_F_rKL5wsuM37oJQ7ePZ_ci4KKuBDWBabdxxDFUT8s1C6cchWSBxhOsiLfLnNrFDAniXYBB19owjTKgK4w, https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFxvO47loL7MTy0PwqosiPrgfIZCIOngikNQeKW7vZDK8xOda9VDjXTTxxKyc0JX5zc4lxceS_0uPDFIS52x7ChQm71zdOtIwmeS_-RrXksIIMjE4_mV5KPksBv7d8bzpRBoWQpRk4cHkvuAeU, https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGjlwWAoR7CHT2OM_hO_JEsZ_CnAMfGwi7cbEJHv_XjUXcoGe8UHHyc_6qvWpxy9xx4wYAeVISD6UjOfqiqw5fxzcDGGk_mZRYHbSCq7fTUIpxdoGSSoZ1okNgp9K1shaK0CIgWM6YJrGg=, https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGPGj-XOo4tjLv7sakoarxPuvwJeOQWbytOqSn6_RQZmJG6GVHDZ2DRWzqcsJyKiCU_DhqdZ6O1v4eibip0hUYRSDl71scPvSNlDcSl3sEQLZccar0vPWdHNGB7C5fY9saicn2329ZyVDvp3QxmF5AfQkx4KzvaGDBGXs4=]
---

# Agent: Live Changes Implementation with @convex-dev/prosemirror-sync

## Agent Overview
**Purpose**: This agent provides detailed instructions for implementing real-time "Live Changes" in a rich-text editor using `ProseMirror` (via Tiptap or BlockNote) and the `@convex-dev/prosemirror-sync` Convex Component. It focuses on leveraging Convex's real-time database capabilities and prescribed architectural patterns for backend logic.
**Tech Stack**: Next.js, Convex, Convex Auth, ProseMirror (Tiptap/BlockNote)
**Source**: Convex Blog Posts & Documentation, @convex-dev/prosemirror-sync GitHub Repository.

## Critical Implementation Knowledge
### 1. @convex-dev/prosemirror-sync Latest Updates 🚨
The `@convex-dev/prosemirror-sync` component is specifically designed to abstract much of the complexity of real-time collaborative editing with ProseMirror on a Convex backend. It provides a set of pre-built Convex backend functions (queries and mutations) and client-side React hooks for seamless integration.

### 2. Common Pitfalls & Solutions 🚨
*   **Data Model Incompatibility:** Tiptap and BlockNote, while both built on ProseMirror, have different underlying data models. Switching between them after initial implementation can be complex and may require data migration. **Solution**: Choose your editor (Tiptap for high customization, BlockNote for out-of-the-box UI) carefully at the start and stick with it.
*   **Schema Mismatch between Client and Server:** When performing server-side document transformations (e.g., for AI features), the `ProseMirror` schema defined by your Tiptap/BlockNote extensions must be identical on both client and server to ensure correct application of changes. **Solution**: Centralize your editor extensions and schema definition and reuse them across client and any server-side transformation actions.
*   **Document Size Limits:** The `@convex-dev/prosemirror-sync` component currently has a limitation for documents larger than 1 Megabyte. **Solution**: If your application requires handling very large documents, consider alternative collaborative editing solutions or strategies for segmenting content.
*   **Lack of Native Presence:** The `prosemirror-sync` component does not directly provide features like real-time cursor positions or user names (presence). **Solution**: Implement presence tracking separately using Convex's real-time queries and mutations. For example, a `presence` table in Convex could store user IDs and their current document position, updated via debounced mutations.
*   **Offline Editing Limitations:** While new documents can be created offline and synced later, peer-to-peer or multi-tab offline synchronization is not supported by this component. **Solution**: Be clear about offline capabilities. For advanced offline requirements, consider CRDT-based solutions like Yjs.

### 3. Best Practices 🚨
*   **Leverage Convex Components**: The `@convex-dev/prosemirror-sync` component streamlines backend setup significantly. Use it.
*   **Strict Authorization**: Define `canRead`, `canWrite`, `canSubmitSnapshot`, `canSubmitSteps`, and `canTransform` authorization functions within the `ProsemirrorSync.syncApi` configuration to control access based on `ctx.auth` context. This ensures only authorized users can modify or view documents.
*   **Utilize Snapshots for Efficiency**: The component uses debounced snapshots to efficiently load documents and avoid fetching the entire history for new clients. Ensure this mechanism is correctly configured and understood.
*   **Server-Side Transformations via Actions**: For complex logic, such as AI integration that modifies the document, use Convex Actions and the `prosemirrorSync.transform` function. This aligns with Convex's architectural guidelines for external API calls and complex business logic.
*   **Client-Side Document Creation**: Allow clients to initiate new documents. The component handles syncing initial versions and local changes upon reconnection.

## Implementation Steps
Implementing Live Changes with Convex and `prosemirror-sync` involves setting up the Convex backend component and integrating the corresponding React hook into your Next.js frontend.

### Backend Implementation
The backend implementation primarily consists of integrating the `@convex-dev/prosemirror-sync` component.

1.  **Install the Package**: Add `@convex-dev/prosemirror-sync` to your project dependencies.
    ```bash
    npm install @convex-dev/prosemirror-sync
    ```
2.  **Define Schema**: Add a schema definition for `prosemirrorSync` in your `convex/schema.ts` file. The component uses tables for `snapshots` and `steps`.
3.  **Create Convex Component File**: In your `convex/` directory, create a new file (e.g., `convex/prosemirrorSync.ts`) to initialize and export the `ProsemirrorSync` component.
4.  **Configure Authorization**: Define authorization rules (`canRead`, `canWrite`, `canSubmitSnapshot`, `canSubmitSteps`, `canTransform`) within the `syncApi` configuration. These functions will receive `ctx` and can use `ctx.auth` for user verification.

#### Convex Functions (Primary)
The `ProsemirrorSync` component exposes the following Convex functions:
*   `getSnapshot` (Query): Fetches the latest document snapshot.
*   `submitSnapshot` (Mutation): Submits a new document snapshot, typically done periodically or on document creation/idle.
*   `latestVersion` (Query): Retrieves the current version of the document.
*   `getSteps` (Query): Fetches incremental changes (ProseMirror steps) since a given version.
*   `submitSteps` (Mutation): Submits new ProseMirror steps from a client.
*   `create` (Mutation): Creates a new document, either from the client or server.
*   `transform` (Action): Allows server-side modification of the document using ProseMirror transformations, suitable for AI or complex server-side logic.

### Frontend Integration
The frontend integration happens within your Next.js React components.

1.  **Install Editor Dependencies**: Install Tiptap or BlockNote and their React integrations.
2.  **Use Sync Hook**: Import and use the appropriate sync hook (`useTiptapSync` or `useBlockNoteSync`) provided by `@convex-dev/prosemirror-sync` in your editor component.
3.  **Initialize Editor**: Pass the `editor` instance from the hook to your Tiptap or BlockNote editor component (e.g., `BlockNoteView`).
4.  **Handle Document Creation**: Provide a mechanism (e.g., a button) to call `sync.create(initialContent)` if the document doesn't exist yet.

## Code Patterns

### Convex Backend Functions
These are generated by the `@convex-dev/prosemirror-sync` component, configured in `convex/prosemirrorSync.ts`:

```typescript
// convex/prosemirrorSync.ts
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { components } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

// Initialize the ProsemirrorSync component
const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

// Export the generated API functions with authorization rules
export const { getSnapshot, submitSnapshot, latestVersion, getSteps, submitSteps, create, transform } = prosemirrorSync.syncApi({
  // Define authorization rules for each operation
  canRead: async (ctx, docId) => {
    // Example: Only authenticated users can read.
    // Replace with your specific document-level access control.
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null; // or check if the user is a collaborator on `docId`
  },
  canWrite: async (ctx, docId) => {
    // Example: Only authenticated users can write.
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null; // or check if the user is a collaborator on `docId`
  },
  canSubmitSnapshot: async (ctx, docId) => {
    // Example: Only authenticated users can submit snapshots.
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
  canSubmitSteps: async (ctx, docId) => {
    // Example: Only authenticated users can submit steps.
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
  canCreate: async (ctx, docId) => {
    // Example: Only authenticated users can create new documents.
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
  canTransform: async (ctx, docId) => {
    // Example: Only authenticated users (or specific roles) can trigger server-side transforms.
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
});

// Example for server-side AI transformation (Convex Action)
// This is exposed as `api.prosemirrorSync.aiTransformDocument` in the client.
import { getSchema } from "@tiptap/core"; // Assuming Tiptap is used for schema
import { EditorState } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit"; // Example Tiptap extension

// Define your editor's extensions/schema (must match client-side)
const editorExtensions = [
  StarterKit.configure({
    // configure as needed
  }),
  // ... other extensions that affect the schema
];
const editorSchema = getSchema(editorExtensions);

export const aiTransformDocument = action({
  args: {
    documentId: v.id("prosemirrorSync"), // Assuming 'prosemirrorSync' is the table name for documents
    prompt: v.string(),
  },
  handler: async (ctx, { documentId, prompt }) => {
    // Perform an external API call here (e.g., to an LLM)
    // IMPORTANT: Use `ctx.runAction` if calling another Convex Action that makes external API calls.
    // For direct external calls:
    // const llmResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
    //   body: JSON.stringify({ /* LLM payload */ }),
    // }).then(res => res.json());

    // For demonstration, let's just append text
    const aiGeneratedText = ` (AI added: ${prompt}) `;

    // Use the component's transform function
    await prosemirrorSync.transform(ctx, documentId, editorSchema, (doc) => {
      const tr = EditorState.create({ doc, schema: editorSchema }).tr;
      // Example: Insert AI generated text at the end of the document
      tr.insertText(aiGeneratedText, doc.content.size);
      return tr;
    });
    return { success: true };
  },
});
```
**Note:** The `prosemirrorSync.syncApi` also generates internal functions (`internalGetSnapshot`, `internalSubmitSteps`, etc.) which are not directly exposed to the client but used by the component itself.

### Frontend Integration (Next.js Component)
```tsx
// app/documents/[id]/page.tsx or components/CollaborativeEditor.tsx
"use client";

import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/react";
import { BlockNoteView } from "@blocknote/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Block, BlockNoteEditor, PartialBlock } from "@blocknote/core";

// Define a default empty document for new creations
const EMPTY_DOC: PartialBlock[] = [{ type: "paragraph", content: "" }];

export default function CollaborativeDocumentPage() {
  const params = useParams();
  const documentId = params.id as string;

  // Use the Convex sync hook
  const { editor, isLoading, create } = useBlockNoteSync(api.prosemirrorSync, documentId);

  // Optional: Mutation to trigger the AI transform action
  const triggerAITransform = useMutation(api.prosemirrorSync.aiTransformDocument);

  if (isLoading) {
    return <div>Loading document...</div>;
  }

  if (!editor) {
    // Document not found or not yet created. Offer to create it.
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p>Document not found or never created.</p>
        <button
          onClick={() => create(EMPTY_DOC)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Create New Document
        </button>
      </div>
    );
  }

  // Example of triggering an AI action (e.g., via a button)
  const handleAITransform = () => {
    if (editor && documentId) {
      triggerAITransform({ documentId, prompt: "summarize this content" });
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Collaborative Document: {documentId}</h1>
      <button
        onClick={handleAITransform}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded"
      >
        Trigger AI Transform
      </button>
      <BlockNoteView editor={editor} />
    </div>
  );
}
```

## Testing & Debugging
*   **Convex Dashboard**: Monitor Convex queries and mutations in your Convex dashboard. Verify that `getSteps`, `submitSteps`, `getSnapshot`, and `submitSnapshot` are being called as expected. Look for errors in mutation/action logs.
*   **Browser Developer Tools**:
    *   **Network Tab**: Observe WebSocket traffic (Convex uses WebSockets for real-time updates) and API calls. Ensure steps and snapshots are being sent and received.
    *   **Console**: Check for any JavaScript errors related to `ProseMirror`, Tiptap/BlockNote, or the `@convex-dev/prosemirror-sync` hooks.
    *   **React Dev Tools**: Inspect the state of your editor components and the data provided by the `useBlockNoteSync` or `useTiptapSync` hook.
*   **Multi-Client Testing**: Open the application in multiple browser tabs or different browsers/devices to simulate collaborative editing. Observe if changes are propagated in real-time.
*   **Authorization Failures**: Test scenarios where users lack appropriate permissions (e.g., trying to edit without being logged in or authorized). Verify that `canRead`/`canWrite` rules in your Convex functions prevent unauthorized access.

## Environment Variables
*   **`CONVEX_DEPLOYMENT`**: (Automatically managed by Convex CLI) Specifies your Convex deployment URL.
*   **`NEXT_PUBLIC_CONVEX_URL`**: (Client-side) The Convex deployment URL.
*   **`OPENAI_API_KEY`**: (Backend-only, for `aiTransformDocument` or similar actions) API key for external AI services.

```
# .env.local
NEXT_PUBLIC_CONVEX_URL="YOUR_CONVEX_URL"

# .env.local (for Convex actions)
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

## Success Metrics
*   **Real-time Synchronization**: Changes made by one user are immediately visible to all other collaborators in under ~100ms.
*   **Conflict Resolution**: Concurrent edits from multiple users are correctly merged without data loss or unintended overwrites.
*   **Document Persistence**: The document state is reliably stored in Convex and can be retrieved correctly after page reloads.
*   **Authentication & Authorization**: Only authorized users can read, write, or create documents. Unauthorized attempts are blocked by Convex backend rules.
*   **Scalability (Basic)**: The editor remains responsive and synchronized with a moderate number of concurrent users (e.g., 2-5). (Note: Large-scale performance might require further optimizations beyond this component).
*   **Server-Side Transformation**: If implemented, AI-driven or other server-side transformations correctly modify the document and synchronize changes to all clients.
*   **No Console Errors**: No persistent errors related to `ProseMirror`, Tiptap/BlockNote, or Convex in the browser console or Convex dashboard logs.