My research confirms that Convex Actions are indeed the correct primitive for this use case. They allow external API calls (to AI services) and arbitrary server-side logic (like diffing). Environment variables are the secure way to store API keys. Convex supports various authentication methods, with Clerk being a popular choice for Next.js, and a Convex Auth library in beta.

For the diffing, a standard library like `diff-match-patch` will be used within the Convex Action. The output of this can be stored in the database.

Let's refine the roadmap.

**Convex Actions with Server-Side Diffing API Understanding:**

*   **Core purpose and capabilities:** Convex Actions are server-side functions designed for non-deterministic operations and side effects, such as making external API calls (e.g., to an AI service like OpenAI) and performing complex computations that require more execution time or specific Node.js environments. They can read from and write to the Convex database via internal queries and mutations.
*   **Key limitations and constraints:** Actions have execution time limits (30s free, 60s paid) and cannot directly stream responses back to the client. Error handling for actions is the caller's responsibility, as side effects prevent automatic retries by Convex.
*   **How Smart Editor fits:** Convex Actions will facilitate the AI interaction by sending document content and prompts to an AI service, receiving the AI's proposed content, and then performing server-side diffing to highlight changes. These diffs are then stored in Convex for real-time display and user acceptance/rejection.
*   **Authentication requirements and methods:** Authentication for Convex actions uses standard Convex authentication mechanisms, often involving third-party providers like Clerk or the beta Convex Auth library, which issues JWTs. API keys for external AI services are stored securely as Convex environment variables.
*   **Rate limits, pricing considerations, and usage restrictions:** Pricing is based on Convex operations, storage, and action execution time. Frequent or long-running AI calls via actions will increase costs. External AI service rate limits must also be considered and handled.

**Implementation Details:**

*   **Documentation:** Convex's official documentation for Actions and environment variables is crucial. For AI integration, the `@ai-sdk` packages are recommended.
*   **Next.js Integration:** The Convex client SDK (`useQuery`, `useMutation`) integrates seamlessly with Next.js React components for calling backend functions and subscribing to real-time data.
*   **Best Practices:** Store sensitive AI API keys in Convex environment variables. Handle potential AI service errors (timeouts, rate limits). Compute diffs on the server for efficiency and to offload client work.

The "Convex Actions with Server-Side Diffing" is not a specific Convex product, but rather an implementation pattern using Convex Actions to interact with an AI and then compute textual differences on the Convex backend.

Now, structuring the roadmap.

# Roadmap: Smart Editor

## Context
- Stack: Next.js, convex, @ai-sdk/openai
- Feature: Smart Editor with Convex Actions with Server-Side Diffing

## Implementation Steps

### 1. Manual Setup (User Required)
- [ ] Create Convex account
- [ ] Create OpenAI account
- [ ] Configure Convex project (e.g., via `npx convex init`)
- [ ] Generate OpenAI API key
- [ ] Configure billing for Convex (consider action usage)
- [ ] Configure billing for OpenAI (consider token usage)

### 2. Dependencies & Environment
- [ ] Install: `convex`, `@ai-sdk/openai`, `diff-match-patch`, `next`, `react`, `react-dom`
- [ ] Env vars: `OPENAI_API_KEY` (Convex dashboard), `NEXT_PUBLIC_CONVEX_URL` (local `.env.local` for Next.js, configured by `npx convex dev`)

### 3. Database Schema
- [ ] Structure:
  ```typescript
  // convex/schema.ts
  import { defineSchema, defineTable } from "convex/server";
  import { v } from "convex/values";

  export default defineSchema({
    documents: defineTable({
      userId: v.id("users"), // Assuming user authentication via a 'users' table
      title: v.string(),
      content: v.string(), // The currently accepted document content
      proposedAIContent: v.optional(v.string()), // AI's suggested full content
      proposedAIDiff: v.optional(v.array(v.union( // Server-side computed diff (e.g., diff-match-patch format)
        v.array(v.union(v.literal(-1), v.literal(0), v.literal(1)), v.string())
      ))),
      isAIPending: v.boolean(), // Flag to indicate if an AI suggestion is active
    }).index("byUserId", ["userId"]),
    users: defineTable({ // Example users table for authentication
      // ... user fields (e.g., clerkUserId, name)
    })
  });
  ```

### 4. Backend Functions
- [ ] Functions:
    - `documents.createDocument` (Mutation): Create a new empty document for a user.
    - `documents.getDocument` (Query): Fetch a document and its `proposedAIContent`/`proposedAIDiff` by ID.
    - `documents.sendAIRequest` (Action, `use node` directive):
        - Input: `documentId`, `originalContent`, `prompt`.
        - Logic: Call `@ai-sdk/openai` with `originalContent` and `prompt`.
        - Logic: Compute diff between `originalContent` and AI's `newContent` using `diff-match-patch`.
        - Logic: Update `documents` table via internal mutation (`ctx.runMutation`) to set `proposedAIContent`, `proposedAIDiff`, and `isAIPending` for the `documentId`.
    - `documents.acceptAIChanges` (Mutation):
        - Input: `documentId`.
        - Logic: Update `documents` table: set `content` to `proposedAIContent`, clear `proposedAIContent`, `proposedAIDiff`, and set `isAIPending` to `false`.
    - `documents.rejectAIChanges` (Mutation):
        - Input: `documentId`.
        - Logic: Update `documents` table: clear `proposedAIContent`, `proposedAIDiff`, and set `isAIPending` to `false`.
    - `documents.updateDocumentContent` (Mutation):
        - Input: `documentId`, `newContent`.
        - Logic: Allow user to manually edit and save the `content` (clears pending AI suggestions if any).

### 5. Frontend
- [ ] Components:
    - `Dashboard`: Displays a list of user's documents.
    - `EditorPage`: Main editor view, includes `DocumentEditor` and `AIChatSidebar`.
    - `DocumentEditor`:
        - Displays `documents.content`.
        - Renders `documents.proposedAIDiff` on top of `documents.content` to highlight changes if `documents.isAIPending` is `true`.
        - Input field for manual edits, triggers `documents.updateDocumentContent`.
    - `AIChatSidebar`:
        - Input field for AI prompts.
        - Triggers `documents.sendAIRequest` action.
        - Displays AI response status (e.g., "AI is thinking...").
        - Buttons to `Accept All` or `Reject All` proposed changes, triggering `documents.acceptAIChanges` or `documents.rejectAIChanges`.
        - Future enhancement: Individual accept/reject for diff chunks.
- [ ] State:
    - Document content and pending AI diffs fetched via `useQuery` from Convex.
    - Local UI state for AI chat input, loading indicators.
    - Use `immer` or similar for efficient local state updates if complex diff interactions are needed client-side, otherwise, Convex's reactivity handles most updates.

### 6. Error Prevention
- [ ] API errors: Implement `try...catch` blocks in Convex Actions for AI API calls. Handle network issues, rate limits, and malformed responses from the AI service.
- [ ] Validation: Validate `prompt` input length on frontend and backend. Validate `documentId` and `content` inputs in mutations/actions.
- [ ] Rate limiting: Implement client-side debounce for AI prompts. Consider server-side rate limiting within Convex Actions for AI requests if needed (e.g., using a separate table to track user requests).
- [ ] Auth: Use Convex's `ctx.auth` to ensure users can only access/modify their own documents.
- [ ] Type safety: Leverage Convex's end-to-end type safety for all queries, mutations, and actions using `npx convex codegen`.
- [ ] Boundaries: Set reasonable timeouts for AI API calls within Convex Actions.

### 7. Testing
- [ ] Test scenarios:
    - User creates a new document.
    - User sends an AI prompt, AI proposes changes, changes are highlighted.
    - User accepts all AI changes.
    - User rejects all AI changes.
    - User makes manual edits, then sends an AI prompt.
    - Edge cases: Empty document, very long document, AI returns no changes.
    - Authentication: Unauthorized user tries to edit another user's document.
    - Error handling: AI service returns an error or times out.
    - Concurrent AI requests (if applicable for future scaling).
    - Frontend rendering of diffs (insertions, deletions, modifications).

## Documentation Sources

This implementation plan was created using the following documentation sources:

1. [youtube.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFrU5Hw7CWYtpd6CIOzQ7IPJImlsUuV8duDuHKUhZW-1cUt_rKUvs0X2HcRR553cqQw4UgJR4FYX-r-gvRXXcnSNdxeofjtBgj6NOkDv33CCvPZRrVEVHS2wpvQI51vlBIQR0JVlg==)
2. [Current time information in San Francisco, CA, US.](https://www.google.com/search?q=time+in+San+Francisco,+CA,+US)
3. [convex.dev](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGj6j-l9Kh-UY-Zr5jcpIGw31xhFUdnzJQpnmgSUVSHudlISFiim6a-jtn4K_C1XsMhHHQy1nJhOyxT1mecrOBOeKgcTPHbCncsZ-mn33dtD5ct2X9QvT30XjbCs-YhGogHQxU=)
4. [githubusercontent.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGvj46jpSHpZK9bM0Hcnb7PjsDQ_DYwf4p6X5cSN2rzu1aPoXhyiZJfqotWojmshmalRK4XMPZuoLfwZagxLUnq6Uq5E_Z35Bh7Zg-2whvpAbUT-VOgUqzti69TdUIfW148c0BlGMnSkAFdappiOv9H6QQMXKbBDvrZ-EsjhTQO4V6C0OeqOaM8iJCT1Mk9YnB-6-Fji4GJBRt4dA2xk-AZgUZ2j-a8aeBeQNtZnRWtkTTRfg==)
