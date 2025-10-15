import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new AI suggestion for a document
 * This stores the diff data (deletions and insertions) for inline rendering
 */
export const create = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    changeGroups: v.array(v.object({
      startPos: v.number(),
      endPos: v.number(),
      deletions: v.array(v.object({ text: v.string(), position: v.number() })),
      insertions: v.array(v.object({ text: v.string(), position: v.number() })),
    })),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.userId !== identity.subject) {
      throw new Error("Unauthorized access to document");
    }

    // Create the suggestion
    return await ctx.db.insert("aiSuggestions", {
      documentId: args.documentId,
      userId: args.userId,
      status: "pending",
      changeGroups: args.changeGroups,
      createdAt: Date.now(),
    });
  },
});

/**
 * Internal mutation to create AI suggestions (can be called from actions)
 */
export const createInternal = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    changeGroups: v.array(v.object({
      startPos: v.number(),
      endPos: v.number(),
      deletions: v.array(v.object({ text: v.string(), position: v.number() })),
      insertions: v.array(v.object({ text: v.string(), position: v.number() })),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiSuggestions", {
      documentId: args.documentId,
      userId: args.userId,
      status: "pending",
      changeGroups: args.changeGroups,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all pending AI suggestions for a document
 */
export const getPending = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("aiSuggestions")
      .withIndex("by_document_status", (q) =>
        q.eq("documentId", args.documentId).eq("status", "pending")
      )
      .collect();
  },
});

/**
 * Get the most recent pending suggestion for a document
 */
export const getLatestPending = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const suggestions = await ctx.db
      .query("aiSuggestions")
      .withIndex("by_document_status", (q) =>
        q.eq("documentId", args.documentId).eq("status", "pending")
      )
      .order("desc")
      .take(1);

    return suggestions[0] || null;
  },
});

/**
 * Accept an AI suggestion
 * This will apply the changes to the document
 */
export const accept = mutation({
  args: { suggestionId: v.id("aiSuggestions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    // Verify user owns the document
    const document = await ctx.db.get(suggestion.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.userId !== identity.subject) {
      throw new Error("Unauthorized access to document");
    }

    // Update suggestion status
    await ctx.db.patch(args.suggestionId, { status: "accepted" });

    // Apply the changes to the document
    // This will reconstruct the content by applying all insertions and deletions
    let content = document.content || "";

    // Sort change groups by position (descending) to apply from end to start
    // This prevents position shifts from affecting subsequent changes
    const sortedGroups = [...suggestion.changeGroups].sort((a, b) => b.startPos - a.startPos);

    for (const group of sortedGroups) {
      // Remove deletions
      for (const deletion of group.deletions.sort((a, b) => b.position - a.position)) {
        const before = content.substring(0, deletion.position);
        const after = content.substring(deletion.position + deletion.text.length);
        content = before + after;
      }

      // Add insertions
      for (const insertion of group.insertions.sort((a, b) => b.position - a.position)) {
        const before = content.substring(0, insertion.position);
        const after = content.substring(insertion.position);
        content = before + insertion.text + after;
      }
    }

    // Update document content
    await ctx.db.patch(suggestion.documentId, {
      content,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reject an AI suggestion
 */
export const reject = mutation({
  args: { suggestionId: v.id("aiSuggestions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    // Verify user owns the document
    const document = await ctx.db.get(suggestion.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.userId !== identity.subject) {
      throw new Error("Unauthorized access to document");
    }

    await ctx.db.patch(args.suggestionId, { status: "rejected" });
    return { success: true };
  },
});

/**
 * Clear all pending suggestions for a document
 */
export const clearPending = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const suggestions = await ctx.db
      .query("aiSuggestions")
      .withIndex("by_document_status", (q) =>
        q.eq("documentId", args.documentId).eq("status", "pending")
      )
      .collect();

    for (const suggestion of suggestions) {
      await ctx.db.patch(suggestion._id, { status: "rejected" });
    }

    return { success: true };
  },
});
