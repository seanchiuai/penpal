# Chat-Like AI Sidebar Implementation Plan

## Status
✅ Implemented

## Summary
Transform the current AI sidebar into a chat-like experience that records and displays conversation history between the user and AI. Instead of just a single input field with cards, the sidebar will show a scrollable chat history with message bubbles for user requests and AI responses, similar to modern messaging applications.

## Current State Analysis

### Existing Implementation
- **File**: `/components/smart-editor/AIChatSidebar.tsx`
- **Current Behavior**:
  - Single text area for user prompts
  - Quick action buttons for common tasks
  - Accept/Reject buttons that appear when AI suggestions are ready
  - Static tips card
  - No conversation history
  - Messages are not persisted

### Data Flow
1. User enters prompt in textarea
2. `onSendPrompt` is called → triggers `sendAIRequest` action
3. AI generates suggestions → stored in `aiSuggestions` table
4. UI shows accept/reject buttons
5. User accepts/rejects → changes applied to document

### Problem
- No record of what the user asked
- No visibility into AI's explanation or reasoning
- Can't review previous requests and responses
- Feels like a form rather than a conversation

## Proposed Solution

### Visual Design
Transform the sidebar into a modern chat interface with:
- **Header**: AI Assistant title with avatar
- **Chat History Area**: Scrollable message list showing full conversation
- **Message Bubbles**:
  - User messages: Right-aligned, blue background
  - AI messages: Left-aligned, gray background
  - Each message shows avatar, timestamp, and content
- **Input Area**: Fixed at bottom with textarea and send button
- **Quick Actions**: Chips/buttons for common prompts (optional, can be inline)

### Database Schema Changes

Add a new `chatMessages` table to store conversation history:

```typescript
chatMessages: defineTable({
  documentId: v.id("documents"),
  userId: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(), // The message text
  suggestionId: v.optional(v.id("aiSuggestions")), // Link to AI suggestion if applicable
  createdAt: v.number(),
})
  .index("by_document", ["documentId"])
  .index("by_document_created", ["documentId", "createdAt"])
```

### Component Architecture

#### 1. New Component: `/components/smart-editor/ChatMessage.tsx`
Renders individual message bubbles with:
- Avatar (user icon or AI sparkle icon)
- Message content
- Timestamp
- Visual styling based on role (user/assistant)

**Props:**
```typescript
interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isLoading?: boolean; // For streaming/loading states
}
```

**UI Components to Use:**
- `Avatar`, `AvatarImage`, `AvatarFallback` from shadcn/ui
- `Card` or `div` with Tailwind CSS for message bubble
- Lucide icons: `User` for user, `Sparkles` for AI

#### 2. Updated Component: `/components/smart-editor/AIChatSidebar.tsx`

**New Structure:**
```tsx
<div className="h-full flex flex-col">
  {/* Header */}
  <div className="p-4 border-b">
    <div className="flex items-center gap-2">
      <Avatar>
        <Sparkles />
      </Avatar>
      <h2>AI Assistant</h2>
    </div>
  </div>

  {/* Chat History - Scrollable */}
  <ScrollArea className="flex-1 p-4">
    {messages.map(message => (
      <ChatMessage key={message._id} {...message} />
    ))}
    {isLoading && <ChatMessage role="assistant" isLoading />}
  </ScrollArea>

  {/* Accept/Reject Actions (if pending) */}
  {isAIPending && (
    <div className="border-t p-4">
      <p className="text-sm mb-2">Review suggestions in editor</p>
      <div className="flex gap-2">
        <Button onClick={onAcceptChanges}>Accept All</Button>
        <Button onClick={onRejectChanges} variant="outline">Reject All</Button>
      </div>
    </div>
  )}

  {/* Input Area - Fixed at bottom */}
  <div className="border-t p-4">
    <div className="flex gap-2">
      <Textarea
        value={input}
        onChange={...}
        placeholder="Ask AI to improve your document..."
        rows={3}
      />
      <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
        <Send />
      </Button>
    </div>
    {/* Quick actions as chips */}
    <div className="flex flex-wrap gap-2 mt-2">
      <Button variant="ghost" size="sm" onClick={() => setInput("Fix grammar")}>
        Fix grammar
      </Button>
      ...
    </div>
  </div>
</div>
```

**Props Changes:**
```typescript
interface AIChatSidebarProps {
  documentId: Id<"documents">;
  isAIPending: boolean;
  isLoading: boolean;
  onSendPrompt: (prompt: string) => Promise<void>;
  onAcceptChanges: () => Promise<void>;
  onRejectChanges: () => Promise<void>;
}
```

### Backend Implementation

#### 1. New File: `/convex/chatMessages.ts`

**Mutations:**
```typescript
// Create a new chat message
export const createMessage = mutation({
  args: {
    documentId: v.id("documents"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    suggestionId: v.optional(v.id("aiSuggestions")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("chatMessages", {
      documentId: args.documentId,
      userId: identity.subject,
      role: args.role,
      content: args.content,
      suggestionId: args.suggestionId,
      createdAt: Date.now(),
    });
  },
});
```

**Queries:**
```typescript
// Get all chat messages for a document
export const getDocumentMessages = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_document_created", (q) =>
        q.eq("documentId", args.documentId)
      )
      .collect();
  },
});
```

**Internal Mutations (for AI action):**
```typescript
// Internal mutation to create AI response message
export const createAIMessageInternal = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    content: v.string(),
    suggestionId: v.id("aiSuggestions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      documentId: args.documentId,
      userId: args.userId,
      role: "assistant",
      content: args.content,
      suggestionId: args.suggestionId,
      createdAt: Date.now(),
    });
  },
});
```

#### 2. Update: `/convex/aiActions.ts`

Modify `sendAIRequest` to create chat messages:

```typescript
export const sendAIRequest = action({
  args: {
    documentId: v.id("documents"),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // 1. Create user message
    await ctx.runMutation(internal.chatMessages.createUserMessageInternal, {
      documentId: args.documentId,
      userId: identity.subject,
      content: args.prompt,
    });

    // 2. Get document and generate AI response
    const document = await ctx.runQuery(internal.documents.getDocumentInternal, {
      documentId: args.documentId,
    });

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `...`, // existing prompt
    });

    const proposedContent = result.text.trim();
    const changeGroups = computeStructuredDiff(originalContent, proposedContent);

    // 3. Store suggestion
    const suggestionId = await ctx.runMutation(internal.aiSuggestions.createInternal, {
      documentId: args.documentId,
      userId: identity.subject,
      changeGroups,
    });

    // 4. Create AI response message with summary
    const summaryMessage = `I've analyzed your document and generated ${changeGroups.length} suggested changes. Review them in the editor and accept or reject as needed.`;

    await ctx.runMutation(internal.chatMessages.createAIMessageInternal, {
      documentId: args.documentId,
      userId: identity.subject,
      content: summaryMessage,
      suggestionId,
    });

    // 5. Update document with AI suggestion (existing code)
    await ctx.runMutation(internal.documents.updateWithAISuggestion, {
      documentId: args.documentId,
      proposedContent,
      diffResult: JSON.stringify(diffs),
    });

    return {
      success: true,
      message: summaryMessage,
      suggestionId,
      changeGroupCount: changeGroups.length,
    };
  },
});
```

#### 3. Update: `/convex/schema.ts`

Add the new `chatMessages` table (as specified above in Database Schema Changes).

### Frontend Implementation

#### 1. Create `/components/smart-editor/ChatMessage.tsx`

```tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, timestamp, isLoading }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={cn(
          isUser ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Bubble */}
      <div className={cn(
        "flex flex-col",
        isUser ? "items-end" : "items-start",
        "max-w-[75%]"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-2 whitespace-pre-wrap",
          isUser
            ? "bg-blue-500 text-white rounded-tr-none"
            : "bg-muted text-foreground rounded-tl-none"
        )}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <p className="text-sm">{content}</p>
          )}
        </div>

        {timestamp && !isLoading && (
          <span className="text-xs text-muted-foreground mt-1">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>
    </div>
  );
}
```

#### 2. Update `/components/smart-editor/AIChatSidebar.tsx`

Major refactor to use chat UI pattern:
- Remove Card-based UI
- Add ScrollArea for message history
- Move input to bottom
- Add real-time message loading with useQuery
- Auto-scroll to bottom on new messages
- Show typing indicator when AI is processing

#### 3. Update `/app/documents/[id]/page.tsx`

Minor changes:
- Pass `documentId` to AIChatSidebar
- Handle new message flow

## Implementation Steps

### Phase 1: Database & Backend (Foundation)
1. **Update schema** (`/convex/schema.ts`)
   - Add `chatMessages` table definition
   - Run `npx convex dev` to apply schema changes

2. **Create chat message functions** (`/convex/chatMessages.ts`)
   - Implement `createMessage` mutation
   - Implement `getDocumentMessages` query
   - Implement internal mutations for AI to create messages

3. **Update AI action** (`/convex/aiActions.ts`)
   - Modify `sendAIRequest` to create user message
   - Modify `sendAIRequest` to create AI response message
   - Generate friendly summary message about changes

### Phase 2: UI Components (Visual Layer)
4. **Create ChatMessage component** (`/components/smart-editor/ChatMessage.tsx`)
   - Install shadcn/ui components: `npx shadcn@latest add avatar scroll-area`
   - Implement message bubble UI with avatars
   - Add timestamp formatting
   - Add loading state

5. **Refactor AIChatSidebar** (`/components/smart-editor/AIChatSidebar.tsx`)
   - Replace Card-based layout with chat layout
   - Add ScrollArea for message history
   - Move input to bottom
   - Add auto-scroll behavior
   - Integrate useQuery to load messages
   - Show typing indicator during AI processing

### Phase 3: Integration (Connection)
6. **Update document page** (`/app/documents/[id]/page.tsx`)
   - Pass documentId to AIChatSidebar
   - Test full flow: send message → AI processes → response appears

7. **Polish & UX improvements**
   - Add smooth scrolling animations
   - Add message fade-in animations
   - Ensure proper keyboard shortcuts (Enter to send)
   - Add error handling for failed messages
   - Consider adding message retry functionality

## Key Files Summary

### New Files
- `/components/smart-editor/ChatMessage.tsx` - Individual message bubble component
- `/convex/chatMessages.ts` - Chat message CRUD operations

### Modified Files
- `/convex/schema.ts` - Add chatMessages table
- `/convex/aiActions.ts` - Create messages during AI request
- `/components/smart-editor/AIChatSidebar.tsx` - Complete refactor to chat UI
- `/app/documents/[id]/page.tsx` - Pass documentId prop

## Technology Stack
- **UI Components**: shadcn/ui (Avatar, ScrollArea, Button, Textarea)
- **Icons**: Lucide React (User, Sparkles, Send, Loader2)
- **Database**: Convex with real-time subscriptions
- **Styling**: Tailwind CSS for message bubbles and layout

## User Experience Improvements

### Before
- Single input field, no history
- No context of previous requests
- Unclear what AI did
- Feels disconnected from document changes

### After
- Full conversation history
- Can review all past requests and responses
- AI explains what changes it made
- Feels like collaborating with an assistant
- Can reference previous suggestions

## Optional Enhancements (Future)
- **Message editing**: Allow users to edit/delete their messages
- **Regenerate**: Retry AI response with different approach
- **Message reactions**: Thumbs up/down for AI responses
- **Export conversation**: Download chat history
- **Smart suggestions**: AI proactively suggests improvements based on document content
- **Markdown support**: Format AI responses with markdown (bold, lists, etc.)
- **Code blocks**: Syntax highlighting for code suggestions

## Testing Checklist
- [ ] User can send a message and see it appear immediately
- [ ] AI response appears after processing
- [ ] Messages persist on page reload
- [ ] Messages are user-specific (don't see other users' chats)
- [ ] Auto-scroll works correctly
- [ ] Loading states show properly
- [ ] Accept/Reject buttons still work
- [ ] Keyboard shortcuts work (Enter to send, Shift+Enter for newline)
- [ ] Quick action buttons populate the input correctly
- [ ] Timestamps display correctly
- [ ] Mobile responsive (sidebar adapts on smaller screens)

## Migration Strategy
Since this is a new feature, no data migration is needed. Existing documents will simply start with an empty chat history when users first interact with the new sidebar.

## Success Metrics
- Users can clearly see conversation history
- Improved understanding of what AI did (via response messages)
- Reduced confusion about AI suggestions
- More engaging and intuitive interface

---

**Last Updated:** October 16, 2025
**Status:** Ready for implementation
