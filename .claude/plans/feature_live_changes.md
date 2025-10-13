# Roadmap: Live Changes

## Context
- Stack: Next.js, Convex, Tiptap/ProseMirror (via `@convex-dev/prosemirror-sync`)
- Feature: Live Changes with individual edits highlighted, with a simplified "reject/approve" mechanism for MVP.
- App Goal: "cursor but for writing. individual changes are highlighted and can be rejected or approved by the user."
- UX Goal: Users see real-time updates from collaborators. Incoming changes are visually distinct for a short period. Users can accept changes (default) or perform a generalized "undo last collaborator change."

## Implementation Steps

### 1. Manual Setup (User Required)
- [ ] Create Convex account.
- [ ] Configure Convex dashboard for the project.
- [ ] Generate Convex deploy key.
- [ ] Set up Convex project with `npm create convex` or existing project integration.
- [ ] Configure Convex billing if exceeding Free tier limits.

### 2. Dependencies & Environment
- [ ] Install: `convex`, `@convex-dev/prosemirror-sync`, `prosemirror-model`, `prosemirror-state`, `prosemirror-view`, `prosemirror-transform`, `@tiptap/react`, `@tiptap/starter-kit`, `react` (or `@blocknote/react` and `@blocknote/core` if using BlockNote).
- [ ] Install dev dependencies: `@convex/type-generator`.
- [ ] Env vars: `NEXT_PUBLIC_CONVEX_URL` (obtained from Convex dashboard).

### 3. Database Schema
- [ ] Structure: `documents` table.
    - `_id: Id<'documents'>`
    - `content: any` (ProseMirror JSON document, or `string` if storing simplified content and using `prosemirror-sync` to manage steps).
- [ ] Structure: `prosemirror_sync_steps` table (managed automatically by `@convex-dev/prosemirror-sync` component).
- [ ] Structure: `prosemirror_sync_snapshots` table (managed automatically by `@convex-dev/prosemirror-sync` component).

### 4. Backend Functions
- [ ] Expose `prosemirrorSync` API in `convex/prosemirror.ts` (or similar).
    - `getSnapshot`: Convex query for fetching document snapshot.
    - `submitSnapshot`: Convex mutation for submitting document snapshots.
    - `latestVersion`: Convex query for getting the latest document version.
    - `getSteps`: Convex query for fetching document steps.
    - `submitSteps`: Convex mutation for submitting document steps.
- [ ] Define `createDocument` Convex mutation to initialize a new document in the `documents` table and call `prosemirrorSync.create` for it.
- [ ] Implement `updateDocumentAccess` Convex mutation (for authorization) to control read/write permissions.
- [ ] Integrate `@convex-dev/rate-limiter` if specific rate limits are needed for document operations beyond Convex's platform limits.

### 5. Frontend
- [ ] **Root Provider:** Wrap the Next.js app with `ConvexProvider` and `ConvexProviderWithAuth` (if authentication is used).
- [ ] **Document Page/Component (`DocumentEditor.tsx`):**
    - [ ] Fetch document ID from URL or prop.
    - [ ] Use `useTiptapSync` or `useBlockNoteSync` hook from `@convex-dev/prosemirror-sync` component, passing in the relevant Convex API (`api.prosemirror`) and the document ID.
    - [ ] Render the Tiptap/BlockNote editor.
    - [ ] **Highlighting Incoming Changes:**
        - [ ] Create a custom Tiptap/ProseMirror extension to listen for incoming `Transaction` objects (e.g., via `editor.on('transaction', ...)`).
        - [ ] Differentiate local transactions from remote transactions.
        - [ ] Apply ProseMirror `Decoration`s to ranges affected by remote transactions for a short duration (e.g., using a temporary CSS class for highlighting).
    - [ ] **Simplified "Reject/Approve" (MVP):**
        - [ ] Add a button or UI element for "Undo Last Collaborator Change."
        - [ ] This would trigger a ProseMirror `undo` command or a custom transaction that reverses the last incoming set of steps. This needs careful implementation using ProseMirror's history and transaction mapping. For MVP, a simple `undo` command may suffice if the history state is managed appropriately.
- [ ] **Document List/Creation (`DocumentList.tsx`):**
    - [ ] Query `documents` table to list existing documents.
    - [ ] Provide UI to call `createDocument` mutation.

### 6. Error Prevention
- [ ] **API errors:** Implement robust error handling for Convex mutations and queries (e.g., `try-catch` blocks).
- [ ] **Validation:** Ensure server-side validation within Convex mutations (e.g., document ID, content structure).
- [ ] **Rate limiting:** Implement application-level rate limits using `@convex-dev/rate-limiter` for operations like creating new documents or specific complex transformations, if necessary.
- [ ] **Auth:** Implement Convex authentication for `prosemirror-sync` API endpoints to ensure only authorized users can read/write documents.
- [ ] **Type safety:** Leverage Convex's generated types (`_generated/api.ts`) for all backend and frontend interactions.
- [ ] **Boundaries:** Handle large documents by either limiting them to ~1MB or providing clear user feedback if exceeded (current `prosemirror-sync` limitation).

### 7. Testing
- [ ] **Unit Tests:**
    - [ ] Convex backend functions: `createDocument`, authorization rules.
    - [ ] Frontend hooks and components: `useTiptapSync` integration, editor rendering.
- [ ] **Integration Tests:**
    - [ ] Collaborative editing: multiple users editing simultaneously, ensuring changes merge correctly.
    - [ ] Highlighting: incoming changes are visually highlighted.
    - [ ] Basic "undo": Verify `undo` reverts collaborator changes.
- [ ] **End-to-End Tests:**
    - [ ] Full document creation, editing, and real-time syncing flow.
    - [ ] User authentication and authorization for document access.
    - [ ] Offline editing and subsequent synchronization.

## Documentation Sources

This implementation plan was created using the following documentation sources:

1. [github.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFj0ierorFm1oVeR9hi4eBaIMQQOkM1FCH4wCpVo3HgKeq53vBNE4sxVj-P4KQHvSe3wFKswZYdaw6A_Am6iPACbhEGjPzLkIfFJaPiRmXLeP9NmkYu1E0SpldwNl3HjT5n6sJTVz9qcw==)
2. [convex.dev](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHeFsiDNQD5dBhKs4fOKQ7apbaoAueZsk6ohgT2eGDE0wioB_wT3urt4KzrqcHFqx1Nyd8xBLR9gh8UTivMhhpFQ7Tw7oXjSqgBtGVmPffuh4Mq4oBeKByqg2wINzoaQgLK6x9I6KDh46Bj2zE=)
3. [stepwisehq.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGjJtF6AE_kwKsfIUs89p7tZnvKUQbg6DEremSmENjEYU25szzdS_n4M5dqZWb0_qLIFZc5iFpkfIhhYXZ_1DeutyMb65NpkeHM7ojUKYS33mQWUBA9ZicpurMk_Rda1l6_J5tCrlXFtjgSv-vJf7PbO2Dftr4F9teMqz2LEc6Zmw==)
4. [prosemirror.net](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHc3bhtdQqeYdGZQUKMFXUStpTT_PtMEbX-BypZyYPZwuvCBXGYiYi_8FfTJH5UZ600bQ0XBD4AmrhRY8NrHJXA4o8hDGOlefbQFcLm27ZqFncEbScEhdBr1S2rW_-XGu8RheEuDn7WVIakFF5lBcgUkkgeAqZtLnz9Rm1-h-mRlTv-N48mox6-Sesyq20=)
