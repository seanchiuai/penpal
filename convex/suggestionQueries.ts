import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get pending suggestions for a document
 */
export const getPendingSuggestionsForDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_documentId_and_status", (q) =>
        q.eq("documentId", args.documentId).eq("status", "pending")
      )
      .order("asc")
      .collect();

    return suggestions;
  },
});

/**
 * Get accepted or rejected suggestions for a document
 */
export const getAcceptedOrRejectedSuggestionsForDocument = query({
  args: {
    documentId: v.id("documents"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_documentId_and_status", (q) =>
        q.eq("documentId", args.documentId).eq("status", args.status)
      )
      .order("desc")
      .collect();

    return suggestions;
  },
});
