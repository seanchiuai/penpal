# Roadmap: Inline Diff

## Context
- Stack: Next.js, Convex
- Feature: Inline Diff using `react-diff-viewer-continued`
- App Goal: Highlight individual text changes for user review (reject/approve).

## Implementation Steps

### 1. Manual Setup (User Required)
*   No manual setup is required for `react-diff-viewer-continued` as it is a client-side React component, not a SaaS offering. It does not require accounts, API keys, webhooks, billing, or domain setup.

### 2. Dependencies & Environment
- [ ] Install: `react-diff-viewer-continued`
- [ ] Env vars: N/A

### 3. Database Schema
- [ ] Structure:
    *   `documents` table:
        *   `_id`: Id<"documents">
        *   `originalContent`: string (the baseline text)
        *   `currentContent`: string (the user-edited text)
        *   `status`: 'draft' | 'pendingReview' | 'approved' | 'rejected'
        *   `lastEditedBy`: Id<"users">
        *   `createdAt`: number (timestamp)
        *   `updatedAt`: number (timestamp)

### 4. Backend Functions (Convex)
- [ ] `documents.getDiffContent`: Query function to fetch `originalContent` and `currentContent` for a given document ID.
- [ ] `documents.approveChange`: Mutation function to update `originalContent` to `currentContent` and set `status` to 'approved' for a document.
- [ ] `documents.rejectChange`: Mutation function to revert `currentContent` to `originalContent` and set `status` to 'rejected' for a document.
- [ ] `documents.updateContent`: Mutation function to update `currentContent` as the user types, storing new edits.

### 5. Frontend
- [ ] Components:
    - `DiffDisplay`: A React component wrapping `ReactDiffViewer` from `react-diff-viewer-continued`.
    - `DocumentEditor`: The main component where users edit text and trigger diff viewing.
    - `ChangeActionButtons`: UI for "Approve" and "Reject" actions.
- [ ] State:
    - Document ID and content (`originalContent`, `currentContent`) fetched from Convex via `useQuery`.
    - UI state for displaying the diff viewer.

### 6. Error Prevention
- [ ] API errors: Handle cases where document content fetching from Convex fails or is null.
- [ ] Validation: Ensure `oldValue` and `newValue` passed to `ReactDiffViewer` are valid strings.
- [ ] Rate limiting: N/A (client-side component, Convex handles backend rate limits implicitly).
- [ ] Auth: Ensure document content is only accessible/editable by authorized users (handled by Convex query/mutation rules).
- [ ] Type safety: Utilize TypeScript for `ReactDiffViewer` props and Convex data.
- [ ] Boundaries:
    - Implement loading states while fetching diff content.
    - Display a user-friendly message if diff content is identical (no changes).
    - Consider virtualized lists or pagination if documents can be extremely long to mitigate performance issues with `react-diff-viewer-continued`.

### 7. Testing
- [ ] Test scenarios:
    - Document with no changes (should display gracefully).
    - Document with minor word-level changes (inline diff highlights).
    - Document with major line-level changes (inline diff highlights).
    - Document with additions.
    - Document with deletions.
    - Empty original content vs. new content.
    - User clicks "Approve Change" (Convex mutation successful, UI updates).
    - User clicks "Reject Change" (Convex mutation successful, UI updates).
    - Error handling for failed Convex queries/mutations.