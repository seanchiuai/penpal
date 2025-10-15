# Smart Editor Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /smart-editor (Dashboard)                           │   │
│  │  - List documents                                     │   │
│  │  - Create new document                                │   │
│  │  - Delete document                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /smart-editor/[id] (Editor Page)                    │   │
│  │                                                        │   │
│  │  ┌────────────────────┬──────────────────────────┐   │   │
│  │  │                    │                          │   │   │
│  │  │  DocumentEditor    │    AIChatSidebar        │   │   │
│  │  │                    │                          │   │   │
│  │  │  - Content editor  │  - Prompt input         │   │   │
│  │  │  - Diff rendering  │  - Quick actions        │   │   │
│  │  │  - Save button     │  - Accept/Reject        │   │   │
│  │  │                    │  - Loading states       │   │   │
│  │  │                    │                          │   │   │
│  │  └────────────────────┴──────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ Convex SDK (Real-time subscriptions)
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                      Backend (Convex)                          │
├─────────────────────────────────────────────────────────────┬─┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Queries (Real-time)                                  │   │
│  │  - getSmartDocument(documentId)                       │   │
│  │  - listSmartDocuments()                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Mutations                                            │   │
│  │  - createSmartDocument(title, content)                │   │
│  │  - updateSmartDocumentContent(id, newContent)         │   │
│  │  - acceptAIChanges(documentId)                        │   │
│  │  - rejectAIChanges(documentId)                        │   │
│  │  - deleteDocument(documentId)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Actions (External APIs)                              │   │
│  │  - sendAIRequest(documentId, prompt)                  │   │
│  │    ┌─────────────────────────────────────┐           │   │
│  │    │ 1. Fetch document                   │           │   │
│  │    │ 2. Call OpenAI API ──────────────┐  │           │   │
│  │    │ 3. Compute diff (diff-match-patch)│  │           │   │
│  │    │ 4. Store in database              │  │           │   │
│  │    └─────────────────────────────────────┘           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database (Convex)                                    │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ documents table                                 │  │   │
│  │  │ - userId, title, content                        │  │   │
│  │  │ - proposedAIContent, proposedAIDiff             │  │   │
│  │  │ - isAIPending                                   │  │   │
│  │  │ - createdAt, updatedAt                          │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────┬─────────────────────────┘
                                      │
                                      │ HTTP/API calls
                                      │
                         ┌────────────┴────────────┐
                         │   OpenAI API            │
                         │   (GPT-4o-mini)         │
                         │                         │
                         │   - Generate text       │
                         │   - Content suggestions │
                         └─────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                    Authentication (Clerk)                     │
│  - User login/signup                                          │
│  - JWT tokens for Convex auth                                │
│  - User isolation (userId filtering)                          │
└─────────────────────────────────────────────────────────────┘


Data Flow:
──────────

1. User Flow:
   User → Dashboard → Create Document → Editor Page

2. AI Suggestion Flow:
   User types prompt → sendAIRequest Action → OpenAI API
   → Diff computation → Store in DB → Real-time update to UI

3. Accept Changes Flow:
   User clicks Accept → acceptAIChanges Mutation
   → Update document.content → Clear pending state → UI updates

4. Reject Changes Flow:
   User clicks Reject → rejectAIChanges Mutation
   → Clear AI suggestions → UI updates
