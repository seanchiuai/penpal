# Roadmap: Change Controls

## Context
- **Interpretation of "custom":** This roadmap assumes "custom" refers to a **custom implementation leveraging the Convex backend** for real-time data synchronization and persistence, as no specific third-party API named "custom" for Change Controls was found. Convex's real-time capabilities are ideal for this feature.
- Stack: Next.js, Convex
- Feature: Change Controls with inline accept, reject, or tweak functionality for individual changes.

## Implementation Steps

### 1. Manual Setup (User Required)
- [ ] Create Convex account.
- [ ] Install Convex CLI and initialize project (`npx convex init` or `npx convex dev`).
- [ ] Configure Convex dashboard for project.
- [ ] Set up Convex authentication (e.g., enable Clerk in Convex dashboard or set up custom Convex Auth).
- [ ] Configure billing in Convex dashboard (Convex has a generous free tier, but usage-based pricing applies for larger scale).

### 2. Dependencies & Environment
- [ ] Install: `convex`, `@clerk/nextjs` (if using Clerk for auth), `@clerk/themes` (optional).
- [ ] Env vars:
    - `NEXT_PUBLIC_CONVEX_URL` (from Convex project setup)
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (if using Clerk)
    - `CLERK_SECRET_KEY` (if using Clerk)
    - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (if using Clerk)
    - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (if using Clerk)
    - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (if using Clerk)
    - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (if using Clerk)
    - `CLERK_JWT_ISSUER` (if integrating Clerk JWT with Convex for backend auth)

### 3. Database Schema (`convex/schema.ts`)
- [ ] `documents` table:
    - `_id: Id<'documents'>`
    - `content: string` (current accepted content of the document)
    - `title: string`
- [ ] `changes` table:
    - `_id: Id<'changes'>`
    - `documentId: Id<'documents'>`
    - `userId: string` (ID of the user who made the change)
    - `changeType: 'insertion' | 'deletion' | 'replacement'`
    - `startIndex: number` (position in the `content` string where change begins)
    - `endIndex: number` (position in the `content` string where change ends, for deletions/replacements)
    - `newText: string` (for insertions/replacements)
    - `oldText: string` (for deletions/replacements, for display purposes)
    - `status: 'pending' | 'approved' | 'rejected'`
    - `timestamp: number`
    - `originalContentSnapshot: string` (optional, snapshot of document content *before* this change for easier diffing)

### 4. Backend Functions (`convex/documents.ts`, `convex/changes.ts`)
- [ ] `documents.createDocument` (mutation): Create a new document.
- [ ] `documents.getDocument` (query): Fetch a single document's content and its associated pending changes.
- [ ] `changes.submitChange` (mutation): Record a new pending change (insertion, deletion, or replacement) made by a user. This mutation would typically operate on the `changes` table.
- [ ] `changes.approveChange` (mutation):
    - Atomically update the `documents.content` based on the approved change.
    - Set `status` of the specific change to `approved`.
- [ ] `changes.rejectChange` (mutation): Set `status` of the specific change to `rejected`.
- [ ] `changes.tweakChange` (mutation): Update `newText`, `startIndex`, `endIndex`, etc., for a `pending` change.

### 5. Frontend
- [ ] **Providers (`src/app/layout.tsx` or equivalent):**
    - [ ] `ConvexProviderWithClerk` (if using Clerk) or `ConvexProvider` with appropriate auth config.
- [ ] **Document Editor Component:**
    - [ ] Fetch document content and pending changes using `useQuery("documents.getDocument", { documentId })`.
    - [ ] Render document content, applying visual diffing to highlight pending changes.
    - [ ] Implement event listeners for text input to capture user edits.
    - [ ] Debounce input events to group changes and call `useMutation("changes.submitChange", ...)` with the delta.
- [ ] **Change Controls Component:**
    - [ ] Display inline controls (Accept, Reject, Tweak) for each highlighted pending change.
    - [ ] Call `useMutation("changes.approveChange", { changeId })` on "Accept".
    - [ ] Call `useMutation("changes.rejectChange", { changeId })` on "Reject".
    - [ ] Implement a modal or inline form for "Tweak" that calls `useMutation("changes.tweakChange", { changeId, ...updatedFields })`.
- [ ] **Authentication Components:**
    - [ ] Clerk sign-in/sign-up components (if using Clerk).
    - [ ] User context to link changes to `userId`.

### 6. Error Prevention
- [ ] **API errors:** Implement robust error handling for Convex mutations and queries (e.g., `try-catch` blocks, displaying user-friendly messages).
- [ ] **Validation:** Backend Convex mutations should validate incoming data (e.g., `startIndex` and `endIndex` are within bounds of `content`, `changeType` is valid).
- [ ] **Rate limiting:** Be mindful of Convex's usage-based pricing and rate limits; optimize queries/mutations to minimize calls.
- [ ] **Auth:** Ensure all sensitive mutations are protected by Convex authentication rules, verifying `userId` and permissions.
- [ ] **Type safety:** Leverage TypeScript throughout, especially with Convex's generated client code for backend functions, to ensure type consistency between frontend and backend.
- [ ] **Boundaries:** Define clear boundaries for change application (e.g., preventing overlapping or conflicting pending changes from being applied simultaneously without conflict resolution).

### 7. Testing
- [ ] **Unit tests:** Test individual Convex mutations and queries.
- [ ] **Integration tests:** Verify end-to-end flows (user submits change, change appears to others, change is approved/rejected, document content updates).
- [ ] **Real-time tests:** Simulate multiple users concurrently editing and applying changes to ensure real-time updates and conflict resolution work correctly.
- [ ] **Authentication tests:** Verify that only authenticated and authorized users can perform actions.
- [ ] **Edge cases:** Test empty documents, large documents, rapid consecutive changes, and concurrent edits at the same location.

## Documentation Sources

This implementation plan was created using the following documentation sources:

1. [servicenow.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEDZI3JxKDE-6cWBxHWALarp8Ihl0SkPxlYEmmX9l5Jbjq5ZN7Gbwu-ibuaS-ZR_WD_Mtf-rjEEycVMe2o3dz6ZP16I-LET1Sv4KImyX6sliGE72whBmxMENmb2e3uMvYlhC9SeaDISu4YSsFOW3hJXmouglu1U9xx3j155EOG3xL1AQbYg1r21k0_bdMkSyUywgGkuBMAXqlq1HkvBDZyh1UBJ-Rh0vEbjJbasYEbZsA==)
2. [nordicapis.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEF8cSTfCqSxMM_FdfcUorWs31A8Gg_m7eq9qcqn44_dFT6c7xxANHbkJHdOPHpmikqUNwBRkigT7OlPKjdHuYl8cuAGTAa4LhWBW2kbN6b97WURt3RQQzjPekFhAD4mkBi-Zt30gY=)
3. [symphony.com](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFQ6bIqALxJsYMlTJglCL22ix4tZ5ZzPmWVKgpvGiGtvPZzM_pvLMQvxLMEmHTGDqdG8zQSd451ceecYDIPwiD7EyEMg1Veu5zgi1nKsDJ1ml0c4QOvRys2z58Tue4c7O15cQ3OCcTdG3AJ_INMPx-x6IjAIYzCARIm5pBU9DGrcoA=)
4. [theneo.io](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGcuLui7I_d8w1fP2askoK9dSQtmHehnOhlAdX1kD-CK4C640CrVHbxRQ7w-r_1o5jXiliX32uDY2aa6x_j5FCnNuNKMgHSCbhWKoi5vx-UYZI73_MAVFtx15fRMF0hscc2j7BFp_PxtvQEYc1cqE39NBFYD1Q=)
