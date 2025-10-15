```yaml
name: agent-convex-smart-editor
description: Implements a Smart Editor with AI-powered suggestions using Convex Actions and inline diff highlighting.
model: inherit
color: purple
tech_stack:
  framework: Next.js
  database: convex
  auth: convex
  provider: convex
generated: 2025-10-15T16:45:00Z
documentation_sources:
  - https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQELixf20SXaG4KxTf8pjBWeijISxuUhCg6JZckgYWLWGBaVoaJ2ViP0tAtR2Ufl5DPOTYhQ9b6EcBWJkWzWmDDf0TN-9QNAPu9Gf92MrCNqh3BGWIOAYQ5-jKb2dqRD
  - https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFL7GiUHzWD8b3jOWZzCSGYOPXLyu-88pUHguzcrQh0BWkIzhCxC67ySTYIVEvYSFnnfyBneuce4qfuruOExQD8hkTiynujkhNcQI-EZaZRbMvcDiVRprsruLf2uKXwD9o
  - https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGZoCZQGsTmhcSCVHlaLn4-Uiu4HwuqOKx6RHcIkZGmMhJq7ui2vO3zAQ1I8b2FB1UNmnnh_136WgBEW378PHIgLAm2yWQ8GhqI0ovgsTMTkllkD4BOiV4UtQcSrufY9DuquSVBrtCs-m0
  - https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFWPJ0UPtsERs6R3t3s2BBr1G7Aqeucnr6BMXk6tO4Zrty7eAixp66XguygQjOM1ug0IOzA4fFw8FLNtW24DDxb5xTDFh5-pz26uPRtVVBwdlpXBrm-7VKGYR2FCEmLUUtlaOlhVg
  - https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQH2uvM8t8W2i86kJek97MPWk6rW1lODRu4cbh68f0NkqvGlZWTg6FnMbs7Go-xhCHvXD5Muoscn499iW6BwV1O8eOUgapUlT5qHg2xYgJBlU9tN4KcWkuXidufn5JMGep-2vFAHM2wbE0QtN7ou3zrt7o2TSkadCLRl3DTCAKccmA
  - https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFTbA8_QEB8ZsQTN6Ua4Xvz-fjwxttl2kCN9_3n4UqPXsH0Ga14vNunoxwXdIcRYOFU1cZstpKKzW8xOXzTcpb2jvCUSnORXFtxA3PaR50ysd5bBbGsvtPS3fNtt8sYYQYPb5rdHHjvPBG09lZiP-wLHsawczVgONZa2fP15cZn3sBM78ckz_IL1jzubtfSYgk73_ji4pQbnZGHSTtAf3TT_w
  - https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEbWrk74RmzGlwUqLSYPrmd2yTgAmHUO9zVmx7_c9hgfrhk8fMj0VcXlpWqRnBiizNme4vGDIJTymXkDrYcDcY84QsTxkNx318GEVEFS0RfieUTgL5aBKM-T6B8kis_Xl1xonH-p-AZip-NzJnA
```

# Agent: Smart Editor Implementation with Convex

## Agent Overview
**Purpose**: This agent provides instructions for implementing a "Smart Editor" with AI-powered content suggestions using Convex. The editor is designed for personal use, integrating AI capabilities via Convex Actions to provide inline content improvements with visual diff highlighting (deletions in red, insertions in green).
**Tech Stack**: Next.js (Frontend), Convex (Backend, Database, Auth), Simple Text Editor (Textarea or similar).
**Source**: Convex official documentation and AI integration patterns.

## Critical Implementation Knowledge
### 1. Convex Latest Updates 🚨
*   **Automatic API Generation**: Convex automatically generates type-safe APIs for your backend functions (queries, mutations, actions), simplifying client-side calls and ensuring type correctness across the stack.
*   **Environment Variables**: API keys for external services (like OpenAI) should be stored securely in the Convex dashboard as environment variables.

### 2. Common Pitfalls & Solutions 🚨
*   **Document Authorization**: Documents require strict access control to ensure users can only access their own content. **Solution**: Implement authorization logic using `ctx.auth` within your Convex functions to verify user identity before allowing document access or modifications.
*   **Performance with Large Documents**: Processing very large documents with AI can be slow and expensive. **Solution**: Implement reasonable document size limits (e.g., 16,000 characters) and provide clear feedback to users when limits are reached.

### 3. Best Practices 🚨
*   **Leverage Convex for Real-time Sync**: Convex's core strength is real-time data synchronization. Use `useQuery` hooks for automatically receiving updates to documents, providing instant feedback to users.
*   **Server-Side AI Integration via Actions**: For "Smart Editor" features like AI-powered content proposals, use Convex Actions. Actions are designed for complex business logic, external API calls (e.g., to an LLM service), and non-deterministic operations. They can transform the document server-side.
*   **Schema Definition**: Clearly define your Convex schema for documents and any related data (e.g., document metadata, AI suggestions history). Use Convex's `v` (validator) for strong type safety.
*   **Optimistic Updates**: Implement optimistic UI updates on the frontend to provide an instant feedback loop to users, even before server confirmation. Convex's `useMutation` can be combined with optimistic updates patterns.
*   **Inline Suggestion Rendering**: Render AI suggestions inline with proper diff highlighting (red for deletions, green for insertions). Ensure suggestions are grouped logically for a clean user experience.

## Implementation Steps
1.  **Initialize Convex Project**: If not already done, create a Convex project and integrate it with your Next.js application.
2.  **Define Schema**: Create a `schema.ts` file in your `convex/` directory to define the `documents` table and any other necessary tables for storing AI suggestions and document metadata.
3.  **Create Document Management Functions**: Implement Convex queries and mutations for creating, reading, updating, and deleting documents with proper authorization checks.
4.  **Develop Frontend Editor**: Use a simple text editor (textarea or basic editor component) for document editing in your Next.js frontend.
5.  **Integrate Frontend with Convex Hooks**: Use `useQuery` and `useMutation` hooks to connect your editor to the Convex backend for real-time document synchronization.
6.  **Implement Inline Suggestion Rendering**:
    *   Create a diff algorithm to compare original text with AI suggestions
    *   Implement visual highlighting to show deletions (red) and insertions (green)
    *   Group continuous changes together and separate non-continuous changes
    *   Render all suggestions inline within the document editor
7.  **Implement Smart Features (AI)**: Create Convex Actions for AI integrations (e.g., generating content, proposing edits). These actions should return structured diff data that can be rendered inline with proper highlighting.

### Backend Implementation
The backend implementation centers around the `convex/` directory, utilizing Convex's `queries`, `mutations`, and `actions` to manage document state, handle real-time diffing, and integrate AI capabilities.

#### Convex Functions (Primary)
*   **`convex/schema.ts`**: Defines the `documents` table with fields to store the editor's content (e.g., `content: v.string()`, `title: v.string()`, `userId: v.string()`). Include an `aiSuggestions` table to store pending inline suggestions with their diff data (deletions and insertions) for rendering.
*   **`convex/documents.ts`**:
    *   Define Convex `queries` to fetch documents by ID or list all documents for a user.
    *   Define Convex `mutations` to create, update, and delete documents.
    *   **CRITICAL**: Implement authorization checks within these functions using `ctx.auth` to ensure only the document owner can access or modify their documents.
*   **`convex/ai.ts` (Example for Smart Features)**:
    *   Define Convex `actions` (e.g., `proposeContent`, `refineDocument`). These actions will interact with external AI APIs (e.g., OpenAI) to generate or refine document content.
    *   These actions will read the current document state via queries and then use external APIs to process it.
    *   **CRITICAL**: Actions should return structured diff data containing:
        *   Array of change groups (each group represents a continuous modification)
        *   Each change group contains position info, deletions (text to remove), and insertions (text to add)
        *   This diff data is stored in the `aiSuggestions` table and rendered inline with proper highlighting
    *   The results can then be applied to the document via a mutation when the user accepts the suggestion, or dismissed when rejected.

### Frontend Integration
The frontend in Next.js will primarily consist of React components that utilize the client-side Convex hooks and editor-specific hooks.

*   **`app/layout.tsx` (or root component)**: Wrap your application with `ConvexProviderWithClerk` (or similar for your auth provider) to enable Convex client and authentication.
*   **`components/SmartEditor.tsx`**:
    *   This component will house a simple text editor (textarea or basic editor component).
    *   It will use `useQuery` to fetch document details and `useMutation` to trigger document updates.
    *   It will implement **inline AI suggestion display** with the following behavior:
        *   **Deletions**: Highlighted in red within the document text
        *   **Insertions**: Highlighted in green within the document text
        *   **Continuous modifications**: Deletions and insertions are placed adjacent to each other if the modification is continuous
        *   **Grouped suggestions**: Continuous changes are grouped together; separate groups are created when there are unchanged words between modifications
        *   **No sidebar**: All AI suggestions are shown directly in the document editor, not in a separate sidebar
    *   It will call Convex Actions (e.g., `useAction(api.ai.proposeContent)`) when users request AI assistance.
*   **Inline Suggestion Rendering**: Implement custom rendering logic to display deletions (red highlight) and insertions (green highlight), grouping continuous changes within the editor content.

## Code Patterns

### Convex Backend Functions
1.  **`convex/schema.ts`**:
    ```typescript
    import { defineSchema, defineTable } from "convex/server";
    import { v } from "convex/values";

    export default defineSchema({
      documents: defineTable({
        title: v.string(),
        content: v.string(),
        userId: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }).index("by_userId", ["userId"]),
      aiSuggestions: defineTable({
        documentId: v.id("documents"),
        userId: v.string(),
        status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
        changeGroups: v.array(v.object({
          startPos: v.number(),
          endPos: v.number(),
          deletions: v.array(v.object({
            text: v.string(),
            position: v.number(),
          })),
          insertions: v.array(v.object({
            text: v.string(),
            position: v.number(),
          })),
        })),
        createdAt: v.number(),
      })
        .index("by_document", ["documentId"])
        .index("by_document_status", ["documentId", "status"]),
    });
    ```
2.  **`convex/documents.ts`**:
    ```typescript
    import { mutation, query } from "./_generated/server";
    import { ConvexError, v } from "convex/values";

    // Query to get a single document
    export const getDocument = query({
      args: { id: v.id("documents") },
      handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
          throw new ConvexError("Not authenticated");
        }

        const document = await ctx.db.get(args.id);
        if (!document) {
          throw new ConvexError("Document not found");
        }

        // Check if user owns the document
        if (document.userId !== identity.tokenIdentifier) {
          throw new ConvexError("Unauthorized access to document");
        }

        return document;
      },
    });

    // Query to list all documents for the current user
    export const listDocuments = query({
      handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
          throw new ConvexError("Not authenticated");
        }

        return await ctx.db
          .query("documents")
          .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
          .order("desc")
          .collect();
      },
    });

    // Mutation to create a new document
    export const createDocument = mutation({
      args: { title: v.string(), content: v.optional(v.string()) },
      handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
          throw new ConvexError("Not authenticated");
        }

        const documentId = await ctx.db.insert("documents", {
          title: args.title,
          content: args.content || "",
          userId: identity.tokenIdentifier,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        return documentId;
      },
    });

    // Mutation to update document content
    export const updateDocument = mutation({
      args: { id: v.id("documents"), content: v.string() },
      handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
          throw new ConvexError("Not authenticated");
        }

        const document = await ctx.db.get(args.id);
        if (!document) {
          throw new ConvexError("Document not found");
        }

        if (document.userId !== identity.tokenIdentifier) {
          throw new ConvexError("Unauthorized access to document");
        }

        await ctx.db.patch(args.id, {
          content: args.content,
          updatedAt: Date.now(),
        });
      },
    });
    ```
3.  **`convex/ai.ts` (Example AI Action)**:
    ```typescript
    import { action, mutation } from "./_generated/server";
    import { api } from "./_generated/api";
    import { ConvexError, v } from "convex/values";

    export const proposeContent = action({
      args: { documentId: v.id("documents"), currentContent: v.string(), prompt: v.string() },
      handler: async (ctx, args) => {
        const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;
        if (!userId) {
          throw new ConvexError("Not authenticated for AI action");
        }

        // Fetch document for additional context/auth if needed
        const document = await ctx.runQuery(api.prosemirrorSync.getSnapshot, { id: args.documentId });
        if (!document) {
            throw new ConvexError("Document not found for AI processing");
        }

        // Call external AI API to get suggested content
        console.log(`Calling AI for document ${args.documentId} with prompt: ${args.prompt}`);
        // const response = await fetch("https://api.openai.com/v1/chat/completions", { /* ... */ });
        // const aiSuggestion = await response.json();

        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 2000));
        const suggestedText = `AI-improved: ${args.currentContent.substring(0, 50)}...`;

        // Compute diff between original and suggested text
        const changeGroups = computeDiff(args.currentContent, suggestedText);

        // Store the suggestion in the database
        const suggestionId = await ctx.runMutation(api.aiSuggestions.create, {
          documentId: args.documentId,
          userId,
          changeGroups,
        });

        return { suggestionId, changeGroups };
      },
    });

    // Helper function to compute diff (simplified example)
    function computeDiff(original: string, suggested: string) {
      // In production, use a proper diff library like diff-match-patch
      // This is a simplified example
      const changeGroups = [];

      if (original !== suggested) {
        changeGroups.push({
          startPos: 0,
          endPos: original.length,
          deletions: [{ text: original, position: 0 }],
          insertions: [{ text: suggested, position: 0 }],
        });
      }

      return changeGroups;
    }
    ```

4.  **`convex/aiSuggestions.ts` (Suggestion Management)**:
    ```typescript
    import { mutation, query } from "./_generated/server";
    import { ConvexError, v } from "convex/values";

    export const create = mutation({
      args: {
        documentId: v.id("documents"),
        userId: v.string(),
        changeGroups: v.array(v.object({
          startPos: v.number(),
          endPos: v.number(),
          deletions: v.array(v.object({ text: v.string(), position: v.number() })),
          insertions: v.array(v.object({ text: v.string(), position: v.number() })),
        })),
      },
      handler: async (ctx, args) => {
        return await ctx.db.insert("aiSuggestions", {
          documentId: args.documentId,
          userId: args.userId,
          status: "pending",
          changeGroups: args.changeGroups,
          createdAt: Date.now(),
        });
      },
    });

    export const getPending = query({
      args: { documentId: v.id("documents") },
      handler: async (ctx, args) => {
        return await ctx.db
          .query("aiSuggestions")
          .withIndex("by_document_status", (q) =>
            q.eq("documentId", args.documentId).eq("status", "pending")
          )
          .collect();
      },
    });

    export const accept = mutation({
      args: { suggestionId: v.id("aiSuggestions") },
      handler: async (ctx, args) => {
        await ctx.db.patch(args.suggestionId, { status: "accepted" });
      },
    });

    export const reject = mutation({
      args: { suggestionId: v.id("aiSuggestions") },
      handler: async (ctx, args) => {
        await ctx.db.patch(args.suggestionId, { status: "rejected" });
      },
    });
    ```

## Testing & Debugging
*   **Convex Dashboard**: Use `npx convex dashboard` to inspect your database tables (`documents`, `aiSuggestions`), view logs for your queries, mutations, and actions, and manually run functions for testing. This is invaluable for debugging backend logic and data state.
*   **Real-time Updates**: Verify that document changes are saved and reflected in the UI, confirming proper synchronization.
*   **Authorization**: Thoroughly test access control by ensuring users can only access and modify their own documents.
*   **Error Handling**: Test how the editor and AI features handle network errors, API failures (for AI actions), and invalid inputs.
*   **`convex dev`**: Keep `npx convex dev` running during development for hot reloads of your Convex functions and automatic type generation. This ensures your client-side `api` object is always up-to-date with your backend.

## Environment Variables
*   **`NEXT_PUBLIC_CONVEX_URL`**: Your Convex deployment URL. Generated when you run `npx convex dev` or deploy to production.
*   **`CONVEX_DEPLOYMENT`**: (Optional, for advanced scenarios) Specifies a particular Convex deployment.
*   **`OPENAI_API_KEY`** (or similar for other AI providers): Required for any Convex Actions making calls to external AI services. Store securely in Convex Dashboard environment variables for production.

## Success Metrics
*   **Document Persistence**: Document content is reliably saved and loaded from the Convex database.
*   **Type Safety**: End-to-end type safety is maintained between Next.js frontend and Convex backend functions.
*   **Authentication & Authorization**: Only authenticated users can access and modify their own documents.
*   **Inline AI Suggestions**: AI suggestions are displayed inline within the document editor with proper highlighting:
    *   Deletions are highlighted in red
    *   Insertions are highlighted in green
    *   Continuous modifications are grouped together
    *   Non-continuous changes are separated with unchanged text between them
*   **No Sidebar**: All AI functionality is integrated directly into the document editor, not in a separate sidebar.
*   **Personal Use**: The editor is optimized for individual users managing their own documents.
*   **Error Resilience**: The application provides clear feedback and handles errors gracefully during editing and AI interactions.
```