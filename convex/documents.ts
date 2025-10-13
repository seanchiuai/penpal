import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get diff content for a document by ID
 */
export const getDiffContent = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return null;
    }
    return {
      _id: document._id,
      originalContent: document.originalContent,
      currentContent: document.currentContent,
      status: document.status,
      lastEditedBy: document.lastEditedBy,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  },
});

/**
 * Get all documents for a user
 */
export const listDocuments = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_lastEditedBy", (q) => q.eq("lastEditedBy", args.userId))
      .order("desc")
      .collect();
    return documents;
  },
});

/**
 * Get all documents (for demo purposes)
 */
export const listAllDocuments = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").order("desc").collect();
    return documents;
  },
});

/**
 * Create a new document
 */
export const createDocument = mutation({
  args: {
    originalContent: v.string(),
    currentContent: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      originalContent: args.originalContent,
      currentContent: args.currentContent,
      status: "draft",
      lastEditedBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });
    return documentId;
  },
});

/**
 * Update the current content of a document
 */
export const updateContent = mutation({
  args: {
    documentId: v.id("documents"),
    currentContent: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    await ctx.db.patch(args.documentId, {
      currentContent: args.currentContent,
      status: "pendingReview",
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Approve changes: set originalContent to currentContent and mark as approved
 */
export const approveChange = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    await ctx.db.patch(args.documentId, {
      originalContent: document.currentContent,
      status: "approved",
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Reject changes: revert currentContent to originalContent and mark as rejected
 */
export const rejectChange = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    await ctx.db.patch(args.documentId, {
      currentContent: document.originalContent,
      status: "rejected",
      lastEditedBy: args.userId,
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
    await ctx.db.delete(args.documentId);
    return null;
  },
});
