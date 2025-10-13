```yaml
name: agent-convex-save-bookmarks
description: Implements Save Bookmarks using Convex as the backend and Next.js for the frontend.
model: inherit
color: purple
tech_stack:
  framework: Next.js
  database: Convex
  auth: Convex
  provider: Convex (internal API) / External HTTP (via Action)
generated: 2025-09-27T06:20:00Z
documentation_sources: 
  - https://docs.convex.dev/functions/actions
  - https://docs.convex.dev/functions/mutations
  - https://docs.convex.dev/functions/queries
  - https://docs.convex.dev/auth/authentication
  - https://docs.convex.dev/integrations/nextjs
  - https://docs.convex.dev/best-practices
  - https://docs.convex.dev/changelog
```

# Agent: Save Bookmarks Implementation with Convex

## Agent Overview
**Purpose**: This agent provides comprehensive instructions for implementing a "Save Bookmarks" feature in a Next.js application, leveraging Convex for all backend logic, database operations, and authentication. It covers the creation of Convex mutations, queries, and actions, along with frontend integration patterns, focusing on Convex best practices for data management and external API calls.
**Tech Stack**: Next.js, Convex, TypeScript, React
**Source**: 
- Convex Developer Hub: Functions (Actions, Mutations, Queries)
- Convex Developer Hub: Authentication
- Convex Developer Hub: Next.js Integration
- Convex Developer Hub: Best Practices
- Convex Developer Hub: Changelog

## Critical Implementation Knowledge
The "custom API" for saving bookmarks will be built directly within Convex. For any interactions with *external* services (e.g., fetching a webpage's title or favicon), Convex Actions are the appropriate primitive.

### 1. Convex Latest Updates 🚨
*   **CLI Command Deprecations**: `npx convex init` and `npx convex reinit` have been deprecated. Use `npx convex dev --configure` for initial setup and project configuration.
*   **Custom JWT Claims**: Convex now supports custom claims in JWTs, allowing for more flexible integration with authentication providers like Clerk or Auth0, enabling the passing of application-specific data (e.g., `org_id`) directly to your Convex functions.
*   **Next.js Server-Side Auth Improvements**: Recent Convex updates improve support for Next.js server-side authentication, making it easier to secure Server Components, Server Actions, and Route Handlers.

### 2. Common Pitfalls & Solutions 🚨
*   **`fetch` calls in Mutations/Queries**:
    *   **Pitfall**: Attempting to make `fetch` or other non-deterministic external calls directly within Convex `query` or `mutation` functions. This will cause runtime errors because queries and mutations must be deterministic for Convex's reactivity and transactional guarantees.
    *   **Solution**: **ALWAYS** use a Convex `action` for any external API calls (e.g., fetching metadata from a URL) or non-deterministic logic. The `action` can then schedule a `mutation` to write the results to the database.
*   **Missing `await`**:
    *   **Pitfall**: Forgetting to `await` promises returned by Convex API calls (e.g., `ctx.db.insert`, `ctx.scheduler.runAfter`). This can lead to unexpected behavior, missed database writes, or unhandled errors.
    *   **Solution**: Enable the `no-floating-promises` ESLint rule and ensure all asynchronous operations are properly `await`ed.
*   **Inefficient Database Queries**:
    *   **Pitfall**: Using `.filter((q) => q.eq(q.field("fieldName"), "value"))` on large or unbounded tables. While functionally correct, it can be inefficient as it processes all documents before filtering in memory.
    *   **Solution**: Define and use database indexes (`.withIndex("indexName", (q) => q.eq("fieldName", "value"))`) for fields you frequently filter or sort by. Indexes are crucial for performance on larger datasets.
*   **Lack of Access Control**:
    *   **Pitfall**: Exposing public Convex functions (queries, mutations, actions) without checking the user's authentication status (`ctx.auth.getUserIdentity()`) or specific authorization rules. This can lead to security vulnerabilities.
    *   **Solution**: Implement robust access control at the beginning of *every* public Convex function that requires authentication, by checking `ctx.auth.getUserIdentity()` or custom permission logic.

### 3. Best Practices 🚨
*   **Transactional Integrity**: Leverage Convex mutations for all database writes. They are atomic, ensuring that either all operations within a mutation succeed or none do.
*   **Deterministic Functions**: Keep queries and mutations deterministic. Delegate any side effects or external interactions to actions.
*   **Strong Typing with TypeScript**: Define your database schema in `convex/schema.ts` to get full end-to-end type safety and autocompletion throughout your backend and frontend.
*   **Internal vs. External Function Calls**: When calling one Convex function from another within your backend, always use `internal` imports (`import { internal } from "./_generated/api";`) and `ctx.runMutation(internal.myModule.myFunction, args)` rather than `api`. This ensures better type safety and prevents accidental exposure of internal logic to the client.
*   **Authentication & Authorization**: Integrate with a recognized OAuth provider (Clerk, Auth0) and use `ctx.auth.getUserIdentity()` in your Convex functions to identify the authenticated user and enforce authorization rules.
*   **Error Handling**: Implement clear error handling in your Convex functions, returning meaningful error messages or throwing `ConvexError` instances.
*   **Optimistic Updates**: For a highly responsive UI, use Convex's optimistic updates on the frontend for mutations, allowing the UI to reflect changes immediately while the actual mutation processes.

## Implementation Steps

### Backend Implementation
The backend for saving bookmarks will primarily use Convex mutations for data manipulation and queries for data retrieval. An action will be used for fetching metadata from external URLs.

1.  **Initialize Convex & Next.js**: If not already done, set up a Convex project with Next.js using `npm create convex@latest -- -t nextjs-clerk` (or similar template). This will scaffold your project and `convex/` directory.
2.  **Define Schema (`convex/schema.ts`)**: Create a `bookmarks` table with fields for `url`, `title`, `description`, `tags` (array of strings), `userId` (for authentication), `createdAt`, and `updatedAt`. Ensure `userId` is indexed for efficient filtering.
3.  **Implement Convex Mutations for CRUD**:
    *   `addBookmark`: Inserts a new bookmark. Requires `ctx.auth.getUserIdentity()`.
    *   `updateBookmark`: Updates an existing bookmark by `_id`. Requires authorization check (user owns bookmark).
    *   `deleteBookmark`: Deletes a bookmark by `_id`. Requires authorization check.
4.  **Implement Convex Queries for Read**:
    *   `getBookmarkById`: Retrieves a single bookmark by `_id`.
    *   `listBookmarks`: Retrieves all bookmarks for the authenticated user, potentially with pagination or filtering by tags.
5.  **Implement Convex Action for External Metadata Fetching**:
    *   `fetchBookmarkMetadata`: Takes a URL, uses `fetch` to get the page content, parses the title and description (e.g., from `<title>` and meta tags), and then *schedules a mutation* to save this metadata along with the bookmark. This is crucial as `fetch` cannot be used in mutations.
6.  **Convex Authentication Integration**: Configure your chosen authentication provider (Clerk/Auth0) with Convex, setting up the `ConvexProviderWithClerk`/`ConvexProviderWithAuth0` on the frontend and configuring the JWT issuer domain in Convex environment variables. Check `ctx.auth.getUserIdentity()` in all protected Convex functions.

#### Convex Functions (Primary)
*   **`schema.ts`**: Defines the `bookmarks` table with `url`, `title`, `description`, `tags`, `userId`, `createdAt`, `updatedAt`, and an index on `userId`.
*   **`bookmarks.ts` (Mutations)**:
    *   `createBookmark`: Takes `url`, `title`, `description`, `tags`. Inserts into `bookmarks` with `userId` from `ctx.auth`.
    *   `updateBookmark`: Takes `_id`, `url?`, `title?`, `description?`, `tags?`. Updates the specified bookmark after verifying `userId`.
    *   `deleteBookmark`: Takes `_id`. Deletes the specified bookmark after verifying `userId`.
*   **`bookmarks.ts` (Queries)**:
    *   `getBookmark`: Takes `_id`. Retrieves a single bookmark if owned by `userId`.
    *   `listBookmarks`: Takes optional `tagFilter`. Returns all bookmarks for the `userId`, filtered by `tagFilter` if provided.
*   **`utils.ts` (Action for external calls)**:
    *   `fetchAndStoreMetadata`: Takes `bookmarkId`, `url`. Uses `fetch` to retrieve HTML, parses `title` and `description`, then calls an `internal` mutation to update the `bookmarkId` with this metadata.

### Frontend Integration
1.  **Convex Client Provider**: Create `app/ConvexClientProvider.tsx` to wrap your Next.js application with `ConvexReactClient` and your authentication provider (e.g., `ConvexProviderWithClerk`).
2.  **Hooks for Data Interaction**: Use `useQuery` for fetching bookmarks and `useMutation` for adding, updating, or deleting them.
3.  **Authentication UI**: Integrate your auth provider's components (e.g., Clerk's `SignInButton`, `UserButton`) for user login/logout.
4.  **Bookmark Form**: A React component to capture URL, title, description, and tags for creating/editing bookmarks, calling the `addBookmark` or `updateBookmark` mutation.
5.  **Bookmark List**: A React component displaying the user's bookmarks fetched via `listBookmarks` query, with options to view, edit, or delete.

## Code Patterns

### Convex Backend Functions
*   **`convex/schema.ts`**: Defines the database tables and indexes.
    ```typescript
    import { defineSchema, defineTable } from "convex/server";
    import { v } from "convex/values";

    export default defineSchema({
      bookmarks: defineTable({
        url: v.string(),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        tags: v.array(v.string()),
        userId: v.id("users"), // Reference to the 'users' table
        createdAt: v.number(),
        updatedAt: v.number(),
      })
        .index("by_userId", ["userId"])
        .searchIndex("by_text", {
          searchField: "title",
          filterFields: ["userId", "tags"],
        }),
      users: defineTable({
        // Minimal user fields managed by auth provider, e.g.
        tokenIdentifier: v.string(), // e.g. "clerk|user_123"
        name: v.string(),
        pictureUrl: v.optional(v.string()),
      }).index("by_tokenIdentifier", ["tokenIdentifier"]),
    });
    ```

*   **`convex/bookmarks.ts` (Mutations and Queries)**:
    ```typescript
    import { mutation, query } from "./_generated/server";
    import { v } from "convex/values";
    import { internal } from "./_generated/api";

    // Helper to get authenticated user ID
    async function getAuthUserId(ctx: any): Promise<any> {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
      // Assuming you store user info in a 'users' table linked by tokenIdentifier
      const user = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();

      if (!user) {
        throw new Error("User not found in database");
      }
      return user._id;
    }

    export const createBookmark = mutation({
      args: {
        url: v.string(),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        tags: v.array(v.string()),
      },
      handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx); // CRITICAL: Auth check
        const now = Date.now();
        const bookmarkId = await ctx.db.insert("bookmarks", {
          url: args.url,
          title: args.title,
          description: args.description,
          tags: args.tags,
          userId,
          createdAt: now,
          updatedAt: now,
        });

        // Optionally trigger action to fetch metadata in background
        await ctx.scheduler.runAfter(0, internal.utils.fetchAndStoreMetadata, {
          bookmarkId,
          url: args.url,
        });

        return bookmarkId;
      },
    });

    export const listBookmarks = query({
      args: {
        tagFilter: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx); // CRITICAL: Auth check
        let query = ctx.db
          .query("bookmarks")
          .withIndex("by_userId", (q) => q.eq("userId", userId));

        if (args.tagFilter) {
          // Note: for efficient tag filtering, consider a more advanced index or full-text search
          // This example filters in memory which can be inefficient for many bookmarks.
          // A better approach for tag filtering with multiple tags would involve
          // a separate 'bookmarkTags' table or Convex's search index.
          const allUserBookmarks = await query.collect();
          return allUserBookmarks.filter((bookmark) =>
            bookmark.tags.includes(args.tagFilter!)
          );
        }

        return await query.order("desc").collect();
      },
    });

    // ... updateBookmark, deleteBookmark mutations follow similar patterns with auth checks
    ```

*   **`convex/utils.ts` (Action for external fetch)**:
    ```typescript
    import { action, internalMutation } from "./_generated/server";
    import { v } from "convex/values";
    import { internal } from "./_generated/api";
    import * as cheerio from "cheerio"; // For parsing HTML

    // Internal mutation to update bookmark with fetched metadata
    export const updateBookmarkMetadata = internalMutation({
      args: {
        bookmarkId: v.id("bookmarks"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        await ctx.db.patch(args.bookmarkId, {
          title: args.title,
          description: args.description,
          updatedAt: Date.now(),
        });
      },
    });

    // Action to fetch external URL metadata
    export const fetchAndStoreMetadata = action({
      args: {
        bookmarkId: v.id("bookmarks"),
        url: v.string(),
      },
      handler: async (ctx, args) => {
        try {
          const response = await fetch(args.url);
          const html = await response.text();
          const $ = cheerio.load(html);

          const title = $("head title").text() || null;
          const description =
            $('meta[name="description"]').attr("content") ||
            $('meta[property="og:description"]').attr("content") ||
            null;

          await ctx.runMutation(internal.utils.updateBookmarkMetadata, {
            bookmarkId: args.bookmarkId,
            title,
            description,
          });
        } catch (error) {
          console.error("Failed to fetch metadata for URL:", args.url, error);
          // Optionally, schedule another mutation to mark bookmark as having failed metadata fetch
        }
      },
    });
    ```

*   **`app/ConvexClientProvider.tsx` (Next.js Client Component)**:
    ```typescript
    "use client";

    import { ClerkProvider, useAuth } from "@clerk/nextjs";
    import { ConvexProviderWithClerk } from "convex/react-clerk";
    import { ConvexReactClient } from "convex/react";
    import { ReactNode } from "react";

    const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    export function ConvexClientProvider({ children }: { children: ReactNode }) {
      return (
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            {children}
          </ConvexProviderWithClerk>
        </ClerkProvider>
      );
    }
    ```

*   **`app/page.tsx` (Next.js Component using Hooks)**:
    ```typescript
    "use client";

    import { useMutation, useQuery } from "convex/react";
    import { api } from "../convex/_generated/api";
    import { SignInButton, SignOutButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
    import { useState } from "react";

    export default function BookmarksPage() {
      const [newUrl, setNewUrl] = useState("");
      const [newTitle, setNewTitle] = useState("");
      const [newTags, setNewTags] = useState("");

      const bookmarks = useQuery(api.bookmarks.listBookmarks); // Fetches all bookmarks for the authenticated user
      const createBookmark = useMutation(api.bookmarks.createBookmark);

      const handleCreateBookmark = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUrl.trim()) {
          await createBookmark({
            url: newUrl,
            title: newTitle || undefined,
            tags: newTags.split(",").map(tag => tag.trim()).filter(Boolean),
          });
          setNewUrl("");
          setNewTitle("");
          setNewTags("");
        }
      };

      return (
        <main className="container mx-auto p-4">
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
            <h1 className="text-2xl font-bold mb-4">Your Bookmarks</h1>
            <form onSubmit={handleCreateBookmark} className="mb-8">
              <input
                type="text"
                placeholder="Bookmark URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="border p-2 mr-2"
                required
              />
              <input
                type="text"
                placeholder="Title (optional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="border p-2 mr-2"
              />
               <input
                type="text"
                placeholder="Tags (comma-separated, optional)"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="border p-2 mr-2"
              />
              <button type="submit" className="bg-blue-500 text-white p-2 rounded">
                Add Bookmark
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks?.map((bookmark) => (
                <div key={bookmark._id} className="border p-4 rounded shadow">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-600 hover:underline">
                    {bookmark.title || bookmark.url}
                  </a>
                  {bookmark.description && <p className="text-gray-600 mt-1">{bookmark.description}</p>}
                  {bookmark.tags.length > 0 && (
                      <div className="flex flex-wrap mt-2">
                          {bookmark.tags.map((tag, idx) => (
                              <span key={idx} className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full mr-2 mb-1">
                                  {tag}
                              </span>
                          ))}
                      </div>
                  )}
                  {/* Add Edit/Delete buttons calling useMutation(api.bookmarks.updateBookmark/deleteBookmark) */}
                </div>
              ))}
            </div>
            {bookmarks === undefined && <p>Loading bookmarks...</p>}
            {bookmarks?.length === 0 && <p>No bookmarks saved yet.</p>}
          </SignedIn>
        </main>
      );
    }
    ```

## Testing & Debugging
*   **Convex Dashboard**: Use the Convex dashboard (`npx convex dashboard`) to inspect your database tables (`bookmarks`, `users`), view logs, and manually run your Convex functions (queries, mutations, actions) to verify their behavior.
*   **`convex dev`**: Keep `npx convex dev` running in your terminal. It provides real-time logs for all function invocations and database changes, which is invaluable for debugging.
*   **`console.log`**: Standard `console.log` statements within your Convex functions will appear in the `convex dev` terminal and the Convex dashboard logs.
*   **Browser Developer Tools**: For frontend issues, use your browser's developer console to check network requests, component state, and JavaScript errors.
*   **Type Safety**: Leverage TypeScript's static analysis to catch errors early. The `_generated` directory ensures type safety between your frontend and Convex backend functions.

## Environment Variables
Ensure the following environment variables are set in your `.env.local` file (for local development) and configured in your Convex deployment settings.

```dotenv
# Convex Deployment URL (usually set by 'npx convex dev --configure')
NEXT_PUBLIC_CONVEX_URL="https://<your-deployment-name>.convex.cloud"
CONVEX_DEPLOYMENT="<your-deployment-name>"

# Clerk (or Auth0) API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_<your_publishable_key>"
CLERK_SECRET_KEY="sk_live_<your_secret_key>"
# CRITICAL: If using custom JWT claims, you'll need this in Convex settings
CLERK_JWT_ISSUER_DOMAIN="https://clerk.<your-auth-domain>.com" # Get from Clerk JWT Templates > Convex > Issuer
```

## Success Metrics
*   **Convex Project Setup**: `npx convex dev` runs successfully and connects to your Convex deployment.
*   **Schema Definition**: `convex/schema.ts` is correctly defined and synced to your Convex database. The `bookmarks` table appears in the Convex dashboard.
*   **Authentication Flow**: Users can successfully sign in/sign up using Clerk/Auth0 and their identity is correctly retrieved by `ctx.auth.getUserIdentity()` in Convex functions.
*   **Bookmark Creation**: A new bookmark can be added via the frontend form, triggering `createBookmark` mutation, and appears instantly in the Convex dashboard and the frontend list (due to real-time queries).
*   **Metadata Fetching**: After creating a bookmark, the `fetchAndStoreMetadata` action runs in the background, updates the bookmark with the correct title and description from the URL, which then reflects in the UI.
*   **Bookmark Listing**: `listBookmarks` query successfully fetches and displays only the authenticated user's bookmarks.
*   **Bookmark Updates/Deletions**: `updateBookmark` and `deleteBookmark` mutations correctly modify/remove bookmarks, with proper authorization checks, and reflect changes in the UI.
*   **Error Handling**: Invalid operations (e.g., unauthorized access, invalid URL) are gracefully handled and appropriate error messages are displayed.
*   **Performance**: Querying bookmarks and performing mutations is fast and responsive, especially when using indexes for `listBookmarks`.