```yaml
name: agent-openai-real-time-scanner
description: Implements a Real-time Scanner using OpenAI APIs integrated via Convex Actions and Convex's AI SDK.
model: inherit
color: purple
tech_stack:
  framework: Next.js
  database: convex
  auth: convex
  provider: OpenAI
generated: 2025-10-11T06:41:00Z
documentation_sources:
  - https://www.convex.dev/docs/functions/actions
  - https://www.convex.dev/docs/functions/error-handling
  - https://www.convex.dev/docs/best-practices
  - https://www.convex.dev/docs/nextjs
  - https://www.convex.dev/docs/auth/overview
  - https://www.convex.dev/docs/storage/overview
  - https://www.convex.dev/components/action-retrier
  - https://www.convex.dev/components/agent
  - https://github.com/get-convex/convex-ai-chat-openai
  - https://www.youtube.com/watch?v=s0K5dJ0362o
```

# Agent: Real-time Scanner Implementation with OpenAI (via Convex Actions/AI SDK)

## Agent Overview
**Purpose**: This agent provides instructions for implementing a Real-time Scanner feature within a Next.js application using Convex as the backend. It leverages Convex Actions to integrate with external AI services (like OpenAI) for scam, ghost posting, and outdated ad detection. It also incorporates Convex's recently introduced AI SDK (for Agents) patterns where applicable, simplifying complex AI workflows like chat history and retrieval-augmented generation (RAG).
**Tech Stack**: Next.js, Convex (Database, Auth, Actions, Queries, Mutations, File Storage), OpenAI API
**Source**: Convex Developer Hub, GitHub examples, YouTube tutorials related to Convex and OpenAI integration.

## Critical Implementation Knowledge
### 1. OpenAI (via Convex Actions/AI SDK) Latest Updates 🚨
Convex itself does not provide an "AI SDK" in the sense of offering AI models directly. Instead, it provides a robust platform (especially Convex Actions) to *integrate* with external AI SDKs and APIs (e.g., OpenAI, Google AI).

**Key Updates/Concepts:**
*   **Convex Actions for External Calls**: Convex Actions are the primary and *only* way to make HTTP requests to external services (like OpenAI's API) from your Convex backend. Queries and Mutations cannot perform `fetch` calls directly.
*   **Convex AI SDK/Agent Abstractions**: Convex has introduced higher-level abstractions for building AI agents (often leveraging OpenAI), simplifying tasks like managing chat history and integrating tools. This "AI SDK" is more about agent orchestration within Convex, rather than providing the core AI models. Developers can use `convex/agents` for structured AI workflows.
*   **Node.js Runtime for Actions**: Actions can run in Convex's custom V8 runtime (default, faster for basic `fetch`) or in a Node.js runtime (`"use node"` directive). The Node.js runtime is necessary for npm packages that require Node.js-specific APIs or environments. Complex AI SDKs often benefit from or require the Node.js runtime.

### 2. Common Pitfalls & Solutions 🚨
*   **Direct Database Access from Actions**:
    *   **Pitfall**: Actions cannot directly access the Convex database. Attempting `ctx.db.get()` or `ctx.db.insert()` directly within an `action` will fail.
    *   **Solution**: Actions must interact with the database *indirectly* by calling `ctx.runQuery` or `ctx.runMutation`. This ensures data consistency and transactional guarantees.
*   **Unhandled Action Errors & Retries**:
    *   **Pitfall**: Unlike Queries and Mutations, Convex does *not* automatically retry Actions if they fail, especially because Actions can have side-effects (e.g., calling an external API).
    *   **Solution**: Implement explicit error handling (`try...catch`) and retry logic within your Actions. Convex provides the `@convex-dev/action-retrier` component for easy exponential backoff retries, which is highly recommended for external API calls.
*   **Exposure of Sensitive Actions**:
    *   **Pitfall**: Publicly exposed `action` functions can be called by anyone. Using them for sensitive operations without proper access control is a security risk.
    *   **Solution**: Use `internalAction` for functions meant to be called only by other Convex backend functions (e.g., a mutation scheduling an AI processing action). All public functions must implement robust authentication and authorization checks using `ctx.auth.getUserIdentity()`.
*   **Not Awaiting Promises**:
    *   **Pitfall**: Forgetting `await` on asynchronous operations (like `fetch`, `ctx.runMutation`, `ctx.scheduler.runAfter`) can lead to unexpected behavior, missed error handling, or functions not completing.
    *   **Solution**: Always `await` all promises within `async` functions to ensure sequential execution and proper error propagation.
*   **External API Rate Limits**:
    *   **Pitfall**: Hitting rate limits on external AI services (like OpenAI) due to frequent requests.
    *   **Solution**: Design your system to minimize calls, batch requests where possible, and implement retry-with-exponential-backoff (via `ActionRetrier`) for transient rate limit errors. Consider server-side queues for processing requests.

### 3. Best Practices 🚨
*   **Minimize Logic in Actions**: Actions should be as small and focused as possible, primarily handling external API calls. Move complex business logic and all database interactions into Queries and Mutations, called from the Action. This keeps your application reactive and performant.
*   **Strong Type Validation**: Always use argument validators (e.g., `v.string()`, `v.object()`) for all Convex functions (Queries, Mutations, Actions). This ensures data integrity and provides clear API contracts.
*   **Environment Variable Security**: Store sensitive API keys (e.g., OpenAI API key) as environment variables in the Convex dashboard, *not* directly in code. Access them via `process.env.YOUR_API_KEY` within your actions.
*   **Access Control**: Implement granular access control using `ctx.auth.getUserIdentity()` in all public Convex functions. Ensure users are authenticated and authorized before processing requests.
*   **File Storage for Large Inputs**: For scanning content from external URLs that might be very large, consider using Convex's built-in file storage. First, use an action to fetch the content and upload it to Convex file storage (`ctx.storage.upload`). Then, pass the file ID to the AI processing action.
*   **Asynchronous Workflows with Scheduler**: For tasks that can be long-running (like AI processing), use `ctx.scheduler.runAfter` from a mutation to schedule an `internalAction`. This decouples the client request from the heavy lifting, provides durability, and keeps your frontend responsive.

## Implementation Steps

The Real-time Scanner will involve:
1.  **Frontend (Next.js)**: User input (URL or text), calling a Convex Action.
2.  **Convex Action (Scanner Orchestration)**: Receives input, potentially fetches content, then calls an `internalAction` for AI processing.
3.  **Convex Internal Action (AI Processing)**: Interacts with the OpenAI API, handles errors, and returns raw AI insights.
4.  **Convex Internal Mutation (Result Storage)**: Stores the processed AI insights into the Convex database.
5.  **Convex Query (Real-time Display)**: Subscribes to database changes to update the UI instantly.

### Backend Implementation

#### Convex Functions (Primary)

*   **`scan.ts` (or similar file):**
    *   `action.scanListing(url: v.string().optional(), text: v.string().optional())`: Public action callable by the frontend. It will:
        1.  Validate user authentication (`ctx.auth.getUserIdentity()`).
        2.  If a `url` is provided, use `fetch` to retrieve the content of the job listing. This might require the `"use node"` runtime if complex scraping libraries are needed, otherwise, the default V8 runtime is sufficient for simple `fetch`.
        3.  If `text` is provided, use it directly.
        4.  Call `ctx.runAction(internal.ai.processScan, { content: processedContent })` to offload the AI processing.
        5.  Return an ID or status to the frontend for tracking.
    *   `internalAction.ai.processScan(content: v.string())`: An internal action that handles the actual AI API call. It will:
        1.  Instantiate the OpenAI client (using `OPENAI_API_KEY` from environment variables).
        2.  Call OpenAI's API (e.g., `chat.completions.create` or a specific Assistants API agent if using Convex's AI SDK for agents) with the provided `content` and a carefully crafted prompt for scam detection, ghost posting, and outdated ad analysis.
        3.  Parse the AI response.
        4.  Call `ctx.runMutation(internal.results.storeScanResult, { ...aiAnalysisResult, scannedById: userId })` to store the structured AI findings.
        5.  Return a success/failure indicator.
    *   `internalMutation.results.storeScanResult(...)`: An internal mutation to safely write the AI analysis results to the Convex database. This ensures atomicity and real-time updates. It will:
        1.  Insert or update a document in a `scanResults` table with the AI's findings, timestamp, and the `scannedById` (user ID).
*   **`results.ts` (or similar file):**
    *   `query.getScanResults(scannedById: v.id('users'))`: A public query that allows a user to retrieve their past scan results in real-time. It will:
        1.  Validate user authentication.
        2.  Query the `scanResults` table filtered by `scannedById`.

### Frontend Integration
*   **Input Component**: A React component (e.g., `ScannerInput.tsx`) with an input field for pasting a URL or text, and a "Scan" button.
*   **`useAction` Hook**: Use `useAction(api.scan.scanListing)` to trigger the backend scan action when the user submits input.
*   **Loading/Feedback State**: Manage UI state to show loading indicators while the scan is in progress and display any immediate feedback from the action.
*   **Results Display Component**: A React component (e.g., `ScanResultsList.tsx`) that uses `useQuery(api.results.getScanResults)` to subscribe to and display the real-time scan results from the Convex database.
*   **Authentication Components**: Wrap relevant parts of the UI with Convex's `<Authenticated>`, `<Unauthenticated>`, and `<AuthLoading>` components to manage user sign-in/sign-out states and ensure only authenticated users can trigger scans or view their results.

## Code Patterns

### Convex Backend Functions

**1. `convex/scan.ts` (Public Action for Orchestration)**

```typescript
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const scanListing = action({
  args: {
    url: v.optional(v.string()),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Validate user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Must be logged in to scan.");
    }
    const userId = identity.subject;

    let contentToScan: string;

    if (args.url) {
      // 2. Fetch content from URL (simple fetch, might need "use node" for advanced scraping)
      try {
        const response = await fetch(args.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        contentToScan = await response.text();
      } catch (error) {
        console.error("URL fetch error:", error);
        throw new Error(`Could not retrieve content from URL: ${error.message}`);
      }
    } else if (args.text) {
      // 3. Use provided text directly
      contentToScan = args.text;
    } else {
      throw new Error("Either 'url' or 'text' must be provided.");
    }

    // 4. Call internal action for AI processing and get the scan result ID
    const scanResultId = await ctx.runAction(internal.ai.processScan, {
      content: contentToScan,
      scannedById: userId,
    });

    // Return the ID for the frontend to track the scan
    return scanResultId;
  },
});
```

**2. `convex/ai.ts` (Internal Action for AI Processing - potentially with `"use node"` for OpenAI SDK)**

```typescript
// Add "use node" directive at the top if using Node.js-specific packages
// "use node";

import { internalAction, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import OpenAI from "openai"; // Example: using OpenAI's SDK

export const processScan = internalAction({
  args: {
    content: v.string(),
    scannedById: v.id("users"), // Assuming a 'users' table
  },
  handler: async (ctx, args) => {
    // Instantiate OpenAI client with API key from environment variables
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      // Call OpenAI API for analysis
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Or other suitable model
        messages: [
          {
            role: "system",
            content: `You are a real-time job listing scanner. Analyze the following job listing content for potential scams, ghost postings, or outdated information. Provide a "score" from 0-100 (100 being perfectly legitimate) and list specific "redFlags" if any, along with a concise "summary" of your findings.`,
          },
          {
            role: "user",
            content: args.content,
          },
        ],
        response_format: { type: "json_object" }, // Request JSON output for easier parsing
      });

      const rawAiResponse = chatCompletion.choices[0].message.content;
      if (!rawAiResponse) {
        throw new Error("OpenAI did not return content.");
      }

      const aiAnalysis = JSON.parse(rawAiResponse); // Parse the AI's JSON response

      // Store results in the database via an internal mutation
      const scanResultId = await ctx.runMutation(internal.results.storeScanResult, {
        scannedById: args.scannedById,
        contentPreview: args.content.substring(0, 200) + "...", // Store a snippet
        score: aiAnalysis.score || 0,
        redFlags: aiAnalysis.redFlags || [],
        summary: aiAnalysis.summary || "No summary provided.",
        status: "completed",
        timestamp: Date.now(),
      });

      return scanResultId;
    } catch (error) {
      console.error("AI processing error:", error);
      // Store a failed state or throw to be caught by a retrier
      await ctx.runMutation(internal.results.storeScanResult, {
        scannedById: args.scannedById,
        contentPreview: args.content.substring(0, 200) + "...",
        score: 0,
        redFlags: ["AI_PROCESSING_ERROR"],
        summary: `Failed to process scan: ${error.message}`,
        status: "failed",
        timestamp: Date.now(),
      });
      throw new Error(`AI processing failed: ${error.message}`);
    }
  },
});
```

**3. `convex/results.ts` (Internal Mutation & Public Query)**

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Define the schema for scan results (in convex/schema.ts)
// export default defineSchema({
//   scanResults: defineTable({
//     scannedById: v.id("users"),
//     contentPreview: v.string(),
//     score: v.number(),
//     redFlags: v.array(v.string()),
//     summary: v.string(),
//     status: v.string(), // e.g., "pending", "completed", "failed"
//     timestamp: v.number(),
//   }).index("by_user_id", ["scannedById"]),
//   users: defineTable({
//     // ... existing user schema
//     tokenIdentifier: v.string(),
//   }).index("by_token", ["tokenIdentifier"]),
// });

export const storeScanResult = mutation({
  args: {
    scannedById: v.id("users"),
    contentPreview: v.string(),
    score: v.number(),
    redFlags: v.array(v.string()),
    summary: v.string(),
    status: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Store the scan result in the database
    const newScanResultId = await ctx.db.insert("scanResults", {
      ...args,
      // Add any other default fields or derived data here
    });
    return newScanResultId;
  },
});

export const getScanResults = query({
  args: {},
  handler: async (ctx) => {
    // Validate user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Or throw an error for unauthenticated access
    }
    const userId = identity.subject;

    // Retrieve scan results for the current user, ordered by timestamp
    return await ctx.db
      .query("scanResults")
      .withIndex("by_user_id", (q) => q.eq("scannedById", userId))
      .order("desc") // Most recent first
      .collect();
  },
});
```

## Testing & Debugging

*   **Convex Dashboard Function Runner**: Use the Convex dashboard to manually run `scanListing` (with dummy data or real URLs/text) and `processScan` actions. Inspect logs for errors, and verify the `scanResults` table for entries.
*   **Convex Logs**: Monitor Convex logs (`npx convex dev` in terminal or in the dashboard) for any errors or unexpected behavior in Actions and Mutations.
*   **OpenAI Dashboard**: Check the OpenAI usage dashboard for API calls and any rate-limiting errors.
*   **Frontend State**: Verify that loading states, error messages, and real-time results are displayed correctly in the Next.js frontend.
*   **Argument Validation**: Test functions with invalid arguments to ensure validators catch errors as expected.
*   **Authentication**: Test scanning with both authenticated and unauthenticated users to verify access control.
*   **Retry Logic**: Simulate external API failures or timeouts (e.g., by temporarily blocking network access in the action or returning a mock error) to ensure the `ActionRetrier` (if used) or custom retry logic works.

## Environment Variables

The following environment variables are required:

*   `OPENAI_API_KEY`: Your secret API key for OpenAI.
*   `NEXT_PUBLIC_CONVEX_URL`: (Client-side) The URL of your Convex deployment (e.g., `https://<deployment-name>.convex.cloud`).
*   `CONVEX_DEPLOYMENT_URL`: (Server-side/Convex functions) Automatically provided by Convex for backend functions.

**Template (`.env.local` or Convex Dashboard):**
```
# OpenAI API Key
OPENAI_API_KEY="sk-..."

# Your Convex deployment URL (for Next.js client)
NEXT_PUBLIC_CONVEX_URL="https://<deployment-name>.convex.cloud"
```

## Success Metrics

*   **Successful AI Analysis**: When a job listing URL or text is submitted, the Convex `scanListing` action successfully calls the `internalAction.ai.processScan`, which then interacts with OpenAI, and stores the structured analysis in the `scanResults` table.
*   **Real-time Updates**: The Next.js frontend, using `useQuery`, displays the AI scan results for the current user in real-time as they are written to the database.
*   **Error Handling**: If an external API call to OpenAI fails or times out, the system gracefully handles the error, potentially retries, and stores a "failed" status in the database, which is reflected in the UI.
*   **Secure API Keys**: OpenAI API keys are securely stored as environment variables and never exposed on the client-side.
*   **Authentication**: Only authenticated users can trigger scans and view their personalized results. Attempts by unauthenticated users are rejected with appropriate error messages.
*   **Performance**: The scanning process, including external API calls, completes within acceptable timeframes, and the UI remains responsive.