# Plans Directory

This directory contains implementation plans and documentation for features in the Penpal application. Each file documents a specific feature or enhancement.

## Table of Contents

- [AI Suggestion Review](#ai-suggestion-review)
- [Smart Editor](#smart-editor)
- [Hover Accept/Reject Individual Changes](#hover-acceptreject-individual-changes)

---

## AI Suggestion Review

**File:** `FEATURE_AI_SUGGESTION_REVIEW_IMPLEMENTATION.md`

**Status:** ✅ Implemented

**Summary:**
A comprehensive AI-powered document suggestion system that allows users to request improvements to their documents. The AI analyzes content and generates structured suggestions for insertions, deletions, and replacements at specific character positions.

**Key Features:**
- Natural language prompts for document improvements
- Structured suggestions with character-level precision
- Individual and bulk accept/reject actions
- Real-time suggestion updates via Convex
- Visual diff highlighting (red for deletions, green for insertions)
- OpenAI GPT-4o-mini integration

**Technology Stack:**
- Backend: Convex Actions with OpenAI AI SDK
- Database: Convex `suggestions` table with indexes
- Frontend: React components with shadcn/ui
- AI: OpenAI GPT-4o-mini (cost-effective, fast)

**Key Files:**
- `/convex/suggestionActions.ts` - AI integration and suggestion generation
- `/convex/suggestionMutations.ts` - Accept/reject mutations
- `/convex/suggestionQueries.ts` - Queries for fetching suggestions
- `/components/AISidebar.tsx` - AI assistant UI component

**Setup Required:**
- OpenAI API key must be configured in Convex dashboard as `OPENAI_API_KEY`
- Run `npx convex deploy` after setting the key

**Use Cases:**
- Grammar and spelling correction
- Style improvements
- Content expansion or condensation
- Tone adjustments
- Formatting fixes

---

## Smart Editor

**File:** `FEATURE_SMART_EDITOR_IMPLEMENTATION.md`

**Status:** ✅ Implemented

**Summary:**
A two-panel document editor with AI-powered editing capabilities. Users can write documents in the left panel while interacting with an AI assistant in the right sidebar to request content modifications. The system uses server-side diffing to compute and display changes.

**Key Features:**
- Two-panel layout (document editor + AI sidebar)
- Real-time diff computation and visualization
- Accept/Reject workflow for AI suggestions
- Document management (create, edit, save, delete)
- Server-side text diffing with diff-match-patch
- Full document context with inline highlights

**Technology Stack:**
- Backend: Convex Actions with server-side diffing
- Database: Convex `documents` table with AI diff fields
- Frontend: Next.js pages with React components
- Diffing: diff-match-patch library

**Key Files:**
- `/app/smart-editor/page.tsx` - Dashboard for listing/creating documents
- `/app/smart-editor/[id]/page.tsx` - Two-panel editor page
- `/components/smart-editor/DocumentEditor.tsx` - Editor with diff rendering
- `/components/smart-editor/AIChatSidebar.tsx` - AI chat interface
- `/convex/aiActions.ts` - AI integration with OpenAI and diff computation
- `/convex/documents.ts` - Document CRUD operations

**Database Schema:**
- `documents.content` - Current accepted content
- `documents.proposedAIContent` - AI's suggested content
- `documents.proposedAIDiff` - Server-computed diff array
- `documents.isAIPending` - Flag for active AI suggestions

**Use Cases:**
- Long-form document editing
- Iterative content refinement
- AI-assisted writing
- Draft review and improvement

---

## Hover Accept/Reject Individual Changes

**File:** `FEATURE_HOVER_CHANGE_CONTROL_IMPLEMENTATION.md`

**Status:** ✅ Implemented (Enhancement to Smart Editor)

**Summary:**
Granular hover-based accept/reject functionality for individual AI-suggested changes in the Smart Editor. Users can hover over specific change groups to see Accept (✓) and Reject (✗) buttons, allowing precise control over which suggestions to apply.

**Key Features:**
- Hover interaction with Radix UI Popover
- Individual accept/reject for each change group
- Debounced hover state (150ms) to prevent flicker
- Full document content display with inline highlights
- Smart bulk actions (only apply to remaining pending changes)
- Visual status indicators (accepted = green, rejected = red/strikethrough)
- Portal rendering to escape overflow constraints

**Technology Stack:**
- UI Library: Radix UI Popover for hover interactions
- State Management: React hooks with debounced closures
- Backend: Existing Convex mutations for change group operations

**Key Components:**
- `/components/HoverableChange.tsx` - Radix UI Popover wrapper
- `/components/InlineSuggestions.tsx` - Full content renderer with change highlights
- Updated `/components/smart-editor/DocumentEditor.tsx` - Integration layer
- Updated `/app/smart-editor/[id]/page.tsx` - Handler functions

**Backend Support (Pre-existing):**
- `acceptChangeGroup` - Updates individual change status to "accepted"
- `rejectChangeGroup` - Updates individual change status to "rejected"
- `acceptPendingChangeGroups` - Accepts all pending changes
- `rejectPendingChangeGroups` - Rejects all pending changes

**User Experience Improvements:**
- Before: Only bulk "Accept All" or "Reject All" options
- After: Precise control over individual changes, full document context, visual feedback

**Technical Decisions:**
- Radix UI for proven positioning and accessibility
- Debounced close for smooth UX (GitHub PR hover pattern)
- Full content display for better context
- `<div>` with `whitespace-pre-wrap` instead of `<pre>` for better layout control

---

## How to Use This Directory

### For Claude Code:
1. **Before implementing a feature**, check if a plan exists in this directory
2. **Follow the step-by-step instructions** in the relevant plan
3. **Reference the key files** mentioned in each plan
4. **Ensure setup requirements** are met before testing

### For Developers:
1. Each file contains complete implementation details
2. Files marked ✅ Implemented are production-ready
3. Setup requirements are listed in each plan
4. Testing instructions are included

### File Naming Convention:
- `FEATURE_[NAME]_IMPLEMENTATION.md` - All implementation plans and documentation follow this format
- Names should be concise and descriptive (e.g., `FEATURE_AI_SUGGESTION_REVIEW_IMPLEMENTATION.md`, `FEATURE_HOVER_CHANGE_CONTROL_IMPLEMENTATION.md`)

### Adding New Plans:
1. Create a new markdown file with `FEATURE_` prefix and `_IMPLEMENTATION` suffix (e.g., `FEATURE_NEW_FEATURE_NAME_IMPLEMENTATION.md`)
2. Follow the format of existing plans
3. Include: Status, Summary, Key Features, Technology Stack, Key Files, Setup Required
4. Update this PLANS_DIRECTORY.md file with a new entry

---

## Related Documentation

- **`/CLAUDE.md`** - Project-wide instructions for Claude Code
- **`/convexGuidelines.md`** - Best practices for Convex backend development
- **`/spec/spec-sheet.md`** - High-level application specification
- **`/agents`** - Custom agent definitions for specialized tasks

---

## Maintenance

This directory should be kept up to date as features are implemented. Remove obsolete plans and merge duplicate documentation to maintain clarity.

**Last Updated:** October 16, 2025
