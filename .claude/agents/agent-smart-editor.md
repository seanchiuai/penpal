```yaml
name: agent-convex-smart-editor
description: Implements a Smart Editor with real-time collaboration using Convex's Collaborative Text Editor Sync component.
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
**Purpose**: This agent provides instructions for implementing a "Smart Editor" with real-time collaborative editing capabilities using Convex. It leverages the `@convex-dev/prosemirror-sync` component, which handles server-side merging of document changes via Operational Transformations (OT), and integrates with Next.js for the frontend. The "Smart" aspect implies potential AI integration for content proposals, which will be handled by Convex Actions.
**Tech Stack**: Next.js (Frontend), Convex (Backend, Database, Auth, Real-time Sync), Tiptap/BlockNote (Editor Frameworks).
**Source**: Convex official documentation, Convex Stack posts, and community examples related to collaborative editing and Convex components.

## Critical Implementation Knowledge
### 1. Convex Latest Updates 🚨
*   **Convex Components are in Beta**: The `@convex-dev/prosemirror-sync` component relies on Convex's Components system, which is currently in beta. This means its API might be unstable and subject to changes in future releases. Developers should be mindful of potential breaking changes and refer to the latest Convex documentation.
*   **React 19 StrictMode**: BlockNote, a popular choice for editor UI, may currently have issues when used with React 19's `<StrictMode>`. Consider testing thoroughly or using Tiptap if encountering issues with BlockNote in StrictMode.
*   **Automatic API Generation**: Convex automatically generates type-safe APIs for your backend functions (queries, mutations, actions), simplifying client-side calls and ensuring type correctness across the stack.

### 2. Common Pitfalls & Solutions 🚨
*   **Data Model Incompatibility**: Tiptap and BlockNote, while both based on ProseMirror, have differing internal data models. Switching between these editors after initial implementation is not trivial and would require data migration. **Solution**: Choose your editor (Tiptap for high customization, BlockNote for out-of-the-box experience) early in the project and stick with it.
*   **Document Authorization**: For a Smart Editor, documents often require strict access control. Simply exposing `getSnapshot` or `submitSteps` without checks can lead to unauthorized access. **Solution**: Utilize the server-side entrypoints provided by the `ProsemirrorSync` component to implement robust authorization logic using `ctx.auth` within your Convex functions. This allows control over who can read, write, or snapshot documents.
*   **Performance with Large Documents/History**: Storing a long history of operational transformation steps can impact performance, especially for new clients loading the document. **Solution**: The component supports debounced snapshots, which can be configured to periodically save the full document state, allowing new clients to load a recent snapshot instead of replaying the entire history of steps.

### 3. Best Practices 🚨
*   **Leverage Convex for Real-time Sync**: Convex's core strength is real-time data synchronization. Use `useQuery` hooks for automatically receiving updates to documents and user presence, minimizing the need for custom WebSocket or polling logic.
*   **Server-Side AI Integration via Actions**: For "Smart Editor" features like AI-powered content proposals, use Convex Actions. Actions are designed for complex business logic, external API calls (e.g., to an LLM service), and non-deterministic operations. They can transform the document server-side.
*   **Schema Definition**: Clearly define your Convex schema for documents, users, and any related data (e.g., document metadata, AI suggestions history). Use Convex's `v` (validator) for strong type safety.
*   **Optimistic Updates**: Implement optimistic UI updates on the frontend to provide an instant feedback loop to users, even before server confirmation. Convex's `useMutation` can be combined with optimistic updates patterns.
*   **Modular Backend with Components**: The `ProsemirrorSync` component exemplifies using modular Convex backend components. For larger applications, breaking down backend logic into reusable components can improve maintainability.

## Implementation Steps
1.  **Initialize Convex Project**: If not already done, create a Convex project and integrate it with your Next.js application.
2.  **Install `prosemirror-sync` Component**: Add the `@convex-dev/prosemirror-sync` package to your project.
3.  **Define Schema**: Create a `schema.ts` file in your `convex/` directory to define the `documents` table and any other necessary tables (e.g., `users`).
4.  **Expose Component API**: Create a file (e.g., `convex/prosemirrorSync.ts`) to expose the `ProsemirrorSync` component's queries, mutations, and actions. This is where you can add authorization logic.
5.  **Develop Frontend Editor**: Choose between Tiptap or BlockNote. Implement the editor component in your Next.js frontend.
6.  **Integrate Frontend with Convex Hooks**: Use `useBlockNoteSync` or `useTiptapSync` from the `@convex-dev/prosemirror-sync` client library to connect your editor to the Convex backend.
7.  **Implement Smart Features (AI)**: Create Convex Actions for AI integrations (e.g., generating content, proposing edits). Call these actions from your frontend or schedule them as cron jobs.

### Backend Implementation
The backend implementation centers around the `convex/` directory, utilizing Convex's `queries`, `mutations`, and `actions` to manage document state, handle real-time diffing, and integrate AI capabilities.

#### Convex Functions (Primary)
*   **`convex/schema.ts`**: Defines the `documents` table with a field to store the editor's content (e.g., `body: v.string()`) and potentially `steps` and `snapshots` if custom handling is needed, though `prosemirror-sync` manages these internally. Also define `users` for authentication/presence.
*   **`convex/prosemirrorSync.ts`**:
    *   Imports `ProsemirrorSync` from `@convex-dev/prosemirror-sync`.
    *   Initializes `prosemirrorSync` with `components.prosemirrorSync`.
    *   Exports `getSnapshot` (query), `submitSnapshot` (mutation), `latestVersion` (query), `getSteps` (query), `submitSteps` (mutation). These functions will be generated by the component.
    *   **CRITICAL**: Implement authorization checks within these exported functions using `ctx.auth` to ensure only authorized users can interact with specific documents.
    *   Define a Convex `mutation` to create new documents, potentially calling `prosemirrorSync.create(ctx, id, content)` server-side.
*   **`convex/ai.ts` (Example for Smart Features)**:
    *   Define Convex `actions` (e.g., `proposeContent`, `refineDocument`). These actions will interact with external AI APIs (e.g., OpenAI, Google Gemini) to generate or refine document content.
    *   These actions will read the current document state (via queries or direct access if invoked by `prosemirrorSync` internally) and then use external APIs to process it. The results can then be applied back to the document via a mutation or proposed to the user.

### Frontend Integration
The frontend in Next.js will primarily consist of React components that utilize the client-side Convex hooks and editor-specific hooks.

*   **`app/layout.tsx` (or root component)**: Wrap your application with `ConvexProviderWithClerk` (or similar for your auth provider) to enable Convex client and authentication.
*   **`components/SmartEditor.tsx`**:
    *   This component will house the Tiptap or BlockNote editor instance.
    *   It will use `useBlockNoteSync(api.prosemirrorSync, documentId)` or `useTiptapSync(...)` to bind the editor state to the Convex backend.
    *   It will use `useQuery` to fetch document details and `useMutation` to trigger any custom document updates not handled by `prosemirror-sync` directly.
    *   It will implement UI for AI features, calling Convex Actions (e.g., `useAction(api.ai.proposeContent)`) when users request AI assistance.
*   **Two-panel Editor Layout**: Implement the two-panel UI where one panel is the editable document (using the `SmartEditor` component) and the other is for AI chat/proposals, interacting with the Convex AI actions.

## Code Patterns

### Convex Backend Functions
1.  **`convex/schema.ts`**:
    ```typescript
    import { defineSchema, defineTable } from "convex/server";
    import { v } from "convex/values";

    export default defineSchema({
      documents: defineTable({
        title: v.string(),
        // The component manages content, steps, and snapshots internally,
        // but you might add other metadata here.
        // For custom ProseMirror content, you might store it as v.any() or v.string()
      }).index("by_title", ["title"]),
      users: defineTable({
        tokenIdentifier: v.string(),
        name: v.string(),
      }).index("by_token", ["tokenIdentifier"]),
    });
    ```
2.  **`convex/prosemirrorSync.ts`**:
    ```typescript
    import { mutation, query, action } from "./_generated/server";
    import { ConvexError, v } from "convex/values";
    import { components } from "./_generated/api";
    import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

    const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

    // Expose the core sync API. Add authorization.
    export const getSnapshot = query({
      args: { id: v.id("documents") },
      handler: async (ctx, args) => {
        const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;
        if (!userId) {
          throw new ConvexError("Not authenticated");
        }
        // Implement authorization check for the document (e.g., if userId has access)
        const document = await ctx.db.get(args.id);
        if (!document) {
            throw new ConvexError("Document not found");
        }
        // Example: Check if user is owner or has collaboration rights
        // if (document.ownerId !== userId && !document.collaborators.includes(userId)) {
        //     throw new ConvexError("Unauthorized access to document");
        // }
        return prosemirrorSync.getSnapshot(ctx, args.id);
      },
    });

    export const submitSnapshot = mutation({
      args: { id: v.id("documents"), version: v.number(), snapshot: v.any() },
      handler: async (ctx, args) => {
        const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;
        if (!userId) {
          throw new ConvexError("Not authenticated");
        }
        // Implement authorization check for write access
        return prosemirrorSync.submitSnapshot(ctx, args.id, args.version, args.snapshot);
      },
    });

    export const latestVersion = query({
        args: { id: v.id("documents") },
        handler: async (ctx, args) => {
            // Authorization for read as in getSnapshot
            return prosemirrorSync.latestVersion(ctx, args.id);
        },
    });

    export const getSteps = query({
        args: { id: v.id("documents"), version: v.number() },
        handler: async (ctx, args) => {
            // Authorization for read as in getSnapshot
            return prosemirrorSync.getSteps(ctx, args.id, args.version);
        },
    });

    export const submitSteps = mutation({
        args: { id: v.id("documents"), version: v.number(), steps: v.array(v.any()) },
        handler: async (ctx, args) => {
            // Authorization for write as in submitSnapshot
            return prosemirrorSync.submitSteps(ctx, args.id, args.version, args.steps);
        },
    });

    // Custom mutation to create a new document
    export const createDocument = mutation({
      args: { title: v.string(), initialContent: v.any() },
      handler: async (ctx, args) => {
        const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;
        if (!userId) {
          throw new ConvexError("Not authenticated");
        }
        // Insert a new document entry in your `documents` table
        const documentId = await ctx.db.insert("documents", {
          title: args.title,
          // ownerId: userId, // Add owner for auth
          // collaborators: [],
        });
        // Initialize the ProseMirrorSync component for this new document
        await prosemirrorSync.create(ctx, documentId, args.initialContent);
        return documentId;
      },
    });
    ```
3.  **`convex/ai.ts` (Example AI Action)**:
    ```typescript
    import { action } from "./_generated/server";
    import { api } from "./_generated/api";
    import { ConvexError, v } from "convex/values";

    export const proposeContent = action({
      args: { documentId: v.id("documents"), currentContent: v.string(), prompt: v.string() },
      handler: async (ctx, args) => {
        const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;
        if (!userId) {
          throw new ConvexError("Not authenticated for AI action");
        }

        // Fetch document for additional context/auth if needed (using query from another file)
        const document = await ctx.runQuery(api.prosemirrorSync.getSnapshot, { id: args.documentId });
        if (!document) {
            throw new ConvexError("Document not found for AI processing");
        }
        // Add more specific authorization here if necessary

        // Simulate external AI API call
        console.log(`Calling AI for document ${args.documentId} with prompt: ${args.prompt}`);
        // In a real app, you'd use fetch() to an external AI service
        // const response = await fetch("https://api.openai.com/v1/chat/completions", { /* ... */ });
        // const aiSuggestion = await response.json();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI latency
        const aiSuggestion = {
            proposedText: `AI-generated content based on "${args.prompt}": ${args.currentContent.substring(0, 50)}...`,
            confidence: 0.9
        };

        // Return the AI suggestion to the frontend
        return aiSuggestion;
      },
    });
    ```

## Testing & Debugging
*   **Convex Dashboard**: Use `npx convex dashboard` to inspect your database tables (`documents`, `users`), view logs for your queries, mutations, and actions, and manually run functions for testing. This is invaluable for debugging backend logic and data state.
*   **Real-time Updates**: Verify that changes made in one editor instance (e.g., in a browser tab) are immediately reflected in another, confirming the real-time sync.
*   **Authorization**: Thoroughly test access control by logging in as different users (authorized vs. unauthorized) to ensure documents are protected as expected.
*   **Error Handling**: Test how the editor and AI features handle network errors, API failures (for AI actions), and invalid inputs.
*   **`convex dev`**: Keep `npx convex dev` running during development for hot reloads of your Convex functions and automatic type generation. This ensures your client-side `api` object is always up-to-date with your backend.

## Environment Variables
*   **`NEXT_PUBLIC_CONVEX_URL`**: Your Convex deployment URL. Generated when you run `npx convex dev` or deploy to production.
*   **`CONVEX_DEPLOYMENT`**: (Optional, for advanced scenarios) Specifies a particular Convex deployment.
*   **`OPENAI_API_KEY`** (or similar for other AI providers): Required for any Convex Actions making calls to external AI services. Store securely in Convex Dashboard environment variables for production.

## Success Metrics
*   **Real-time Collaboration**: Multiple users can edit the same document concurrently with changes syncing instantly across all clients.
*   **Document Persistence**: Document content is reliably saved and loaded from the Convex database.
*   **Type Safety**: End-to-end type safety is maintained between Next.js frontend and Convex backend functions.
*   **Authentication & Authorization**: Only authenticated and authorized users can access and modify documents.
*   **AI Integration**: AI-powered features (e.g., content proposals) are successfully integrated via Convex Actions and function as expected.
*   **Scalability**: The system gracefully handles multiple concurrent users editing, with acceptable latency.
*   **Error Resilience**: The application provides clear feedback and handles errors gracefully during editing and AI interactions.
```