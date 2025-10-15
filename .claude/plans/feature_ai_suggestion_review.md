# Roadmap: AI Suggestion Review

## Context
- Stack: Next.js, convex, @ai-sdk/react, @ai-sdk/openai (or similar)
- Feature: AI Suggestion Review with Convex Actions with AI SDK

## Implementation Steps

### 1. Manual Setup (User Required)
- [ ] Create Convex account.
- [ ] Create OpenAI (or other chosen LLM provider) account.
- [ ] Configure Convex project and deployment.
- [ ] Generate OpenAI API key.
- [ ] Configure billing for Convex (usage-based).
- [ ] Configure billing for OpenAI (token-based).

### 2. Dependencies & Environment
- [ ] Install: `convex`, `@ai-sdk/react`, `@ai-sdk/openai`, `next`, `react`, `react-dom`, `typescript`
- [ ] Env vars (Convex Dashboard):
    - `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`, etc.)

### 3. Database Schema
- [ ] `documents` table:
    - `_id: Id<'documents'>`
    - `content: string` (main document text)
    - `title: string`
    - `userId: Id<'users'>` (if authenticated users)
    - `createdAt: number`
    - `updatedAt: number`
- [ ] `suggestions` table:
    - `_id: Id<'suggestions'>`
    - `documentId: Id<'documents'>`
    - `type: 'insert' | 'delete' | 'replace'`
    - `startIndex: number` (character index in the `content` string)
    - `endIndex: number` (character end index for 'delete'/'replace', or same as `startIndex` for 'insert')
    - `suggestedText: string` (new text for 'insert'/'replace')
    - `originalText: string` (original text for 'delete'/'replace', for diffing)
    - `status: 'pending' | 'accepted' | 'rejected'`
    - `createdAt: number`
    - `prompt: string` (the user prompt that generated this suggestion)
    - `modelResponse: string` (raw AI model output for debugging/context)

### 4. Backend Functions
- [ ] `actions/generateSuggestions.ts`:
    - Purpose: Receive document content and user prompt, call LLM via AI SDK, parse structured suggestions, store them in `suggestions` table.
    - Input: `documentId: Id<'documents'>`, `currentContent: string`, `prompt: string`
    - Output: `Id<'suggestions'>[]`
    - Logic:
        - Fetch `OPENAI_API_KEY` from `process.env`.
        - Use `@ai-sdk/openai` to call an LLM (e.g., `generateText` or `streamText`).
        - Prompt the LLM to return suggestions in a structured JSON format (e.g., `[{type, startIndex, endIndex, suggestedText, originalText}]`).
        - Parse the LLM's response.
        - Validate and transform suggestions.
        - Store each parsed suggestion as a new document in the `suggestions` table, linking to `documentId` and setting `status: 'pending'`.
- [ ] `mutations/acceptSuggestion.ts`:
    - Purpose: Update a single document's content based on an accepted suggestion.
    - Input: `suggestionId: Id<'suggestions'>`
    - Logic:
        - Fetch `suggestion` and associated `document`.
        - Apply the `suggestedText` to the `document.content` based on `startIndex`, `endIndex`, and `type`.
        - Update `document.content` in `documents` table.
        - Set `suggestion.status: 'accepted'`.
- [ ] `mutations/rejectSuggestion.ts`:
    - Purpose: Mark a single suggestion as rejected.
    - Input: `suggestionId: Id<'suggestions'>`
    - Logic:
        - Set `suggestion.status: 'rejected'`.
- [ ] `mutations/bulkAcceptSuggestions.ts`:
    - Purpose: Accept multiple suggestions and update document content.
    - Input: `documentId: Id<'documents'>`, `suggestionIds: Id<'suggestions'>[]`
    - Logic:
        - Fetch all specified suggestions for the document.
        - Apply all 'pending' suggestions sequentially to the `document.content`. (Order of application is crucial).
        - Update `document.content` in `documents` table.
        - Set `status: 'accepted'` for all accepted suggestions.
- [ ] `mutations/bulkRejectSuggestions.ts`:
    - Purpose: Mark multiple suggestions as rejected.
    - Input: `documentId: Id<'documents'>`, `suggestionIds: Id<'suggestions'>[]`
    - Logic:
        - Set `status: 'rejected'` for all specified suggestions.
- [ ] `queries/getDocument.ts`:
    - Purpose: Fetch a single document by ID.
    - Input: `documentId: Id<'documents'>`
    - Output: `Document`
- [ ] `queries/getPendingSuggestionsForDocument.ts`:
    - Purpose: Fetch all 'pending' suggestions for a specific document.
    - Input: `documentId: Id<'documents'>`
    - Output: `Suggestion[]`
- [ ] `queries/getAcceptedOrRejectedSuggestionsForDocument.ts`:
    - Purpose: Fetch all 'accepted' or 'rejected' suggestions for a specific document.
    - Input: `documentId: Id<'documents'>`, `status: 'accepted' | 'rejected'`
    - Output: `Suggestion[]`

### 5. Frontend
- [ ] `pages/dashboard.tsx`:
    - Lists documents, allows starting new document.
- [ ] `pages/documents/[id].tsx`:
    - Main editor page.
    - Displays `DocumentContent` component and `AISidebar` component.
- [ ] `components/DocumentContent.tsx`:
    - Purpose: Display document content with highlighted pending suggestions.
    - Uses `useQuery(api.queries.getDocument, { documentId })` to fetch document.
    - Uses `useQuery(api.queries.getPendingSuggestionsForDocument, { documentId })` to fetch suggestions.
    - Logic: Render `document.content`. Implement diffing/rendering logic to visually highlight `pending` suggestions (e.g., using a text editor component with custom decorators or by programmatically injecting spans/markers based on `startIndex`/`endIndex` for new/deleted/changed text).
- [ ] `components/AISidebar.tsx`:
    - Purpose: AI chat interface, suggestion review, and bulk actions.
    - Input field for user prompts.
    - Displays list of pending suggestions.
    - Individual accept/reject buttons for each suggestion.
    - "Accept All" / "Reject All" buttons.
    - Logic:
        - `useAction(api.actions.generateSuggestions)` to send prompt and current document content.
        - `useMutation(api.mutations.acceptSuggestion)`, `useMutation(api.mutations.rejectSuggestion)`, etc.
        - Display loading states while AI is generating.
        - Display pending suggestions from `getPendingSuggestionsForDocument` (which will reactively update).
- [ ] `convex/ConvexClientProvider.tsx`:
    - Wraps the Next.js app to provide Convex client context.
    - Integrates with Next.js for SSR/hydration.

### 6. Error Prevention
- [ ] API errors:
    - Implement `try-catch` blocks in Convex actions for LLM API calls and database operations.
    - Return meaningful error messages to the frontend.
    - Display user-friendly error messages in the frontend.
- [ ] Validation:
    - Validate user input (prompts, document content) on the frontend.
    - Validate incoming data in Convex functions (e.g., `documentId` exists, `startIndex`/`endIndex` are valid).
- [ ] Rate limiting:
    - Implement application-level rate limiting in `actions/generateSuggestions.ts` using `@convex-dev/rate-limiter` to prevent abuse and manage costs for AI calls.
    - Add frontend feedback when rate limit is hit.
- [ ] Auth:
    - For all public Convex functions (`generateSuggestions`, `acceptSuggestion`, `getDocument`, etc.), check `ctx.auth.getUserIdentity()` to ensure the user is authenticated and authorized to access/modify the specific `documentId`.
    - Securely handle `OPENAI_API_KEY` via Convex environment variables.
- [ ] Type safety:
    - Leverage Convex's top-down type safety and TypeScript throughout the backend and frontend.
    - Ensure LLM response parsing into `suggestions` table is type-safe.
- [ ] Boundaries:
    - Limit the size of documents sent to the AI to stay within token limits and manage costs.
    - Implement pagination for large lists of documents/suggestions if needed.

### 7. Testing
- [ ] **Backend Unit Tests:**
    - Test `generateSuggestions` action: ensure it calls AI SDK, parses expected JSON, and inserts correctly into `suggestions` table. Mock AI SDK response.
    - Test `acceptSuggestion`: verify document content is updated correctly and suggestion status changes.
    - Test `rejectSuggestion`: verify suggestion status changes.
    - Test `bulkAcceptSuggestions`: verify multiple suggestions are applied in correct order and statuses update.
    - Test `bulkRejectSuggestions`: verify multiple suggestion statuses update.
    - Test queries for fetching documents and suggestions.
- [ ] **Frontend Integration Tests:**
    - Test `DocumentContent` renders document and highlights pending suggestions correctly.
    - Test `AISidebar` sends prompts and displays AI responses.
    - Test accepting/rejecting individual suggestions updates UI and triggers mutations.
    - Test bulk accept/reject actions.
    - Test error handling UI for API failures and rate limits.
- [ ] **End-to-End Tests:**
    - Simulate user workflow: create document, send prompt, get suggestions, accept/reject, verify final document state.