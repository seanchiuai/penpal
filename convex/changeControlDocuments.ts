import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new document
 */
export const createDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      userId: args.userId,
      title: args.title,
      content: args.content,
      isAIPending: false,
      ownerId: args.userId,
      // Optional legacy fields
      originalContent: args.content,
      currentContent: args.content,
      status: "draft" as const,
      lastEditedBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });
    return documentId;
  },
});

/**
 * Get a single document with its pending changes
 */
export const getDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return null;
    }

    // Get all pending changes for this document
    const pendingChanges = await ctx.db
      .query("changes")
      .withIndex("by_documentId_and_status", (q) =>
        q.eq("documentId", args.documentId).eq("status", "pending")
      )
      .order("asc")
      .collect();

    return {
      ...document,
      pendingChanges,
    };
  },
});

/**
 * List all documents for a user
 */
export const listDocuments = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.userId))
      .order("desc")
      .collect();
    return documents;
  },
});

/**
 * Update document content (applies approved changes)
 */
export const updateDocumentContent = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      content: args.content,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Delete a document
 */
export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // First delete all changes associated with this document
    const changes = await ctx.db
      .query("changes")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const change of changes) {
      await ctx.db.delete(change._id);
    }

    // Then delete the document
    await ctx.db.delete(args.documentId);
    return null;
  },
});
