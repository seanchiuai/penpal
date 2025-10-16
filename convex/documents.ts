import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
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
      content: document.content, // Add content field for InlineSuggestions
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
      userId: args.userId,
      title: "Untitled Document",
      content: args.currentContent,
      isAIPending: false,
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

// ========================================
// Smart Editor Functions
// ========================================

/**
 * Create a new document with Smart Editor support
 */
export const createSmartDocument = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const documentId = await ctx.db.insert("documents", {
      userId: identity.subject,
      title: args.title,
      content: args.content || "",
      isAIPending: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return documentId;
  },
});

/**
 * Get a specific document by ID for Smart Editor
 */
export const getSmartDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return null;
    }

    // Ensure user can only access their own documents
    if (document.userId !== identity.subject) {
      throw new Error("Unauthorized access to document");
    }

    return document;
  },
});

/**
 * List all Smart Editor documents for the current user
 */
export const listSmartDocuments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    // Filter to only show documents with Smart Editor fields
    return documents.filter(doc =>
      doc.userId !== undefined &&
      doc.title !== undefined &&
      doc.content !== undefined
    );
  },
});

/**
 * Update document content (manual edit by user)
 */
export const updateSmartDocumentContent = mutation({
  args: {
    documentId: v.id("documents"),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Ensure user can only update their own documents
    if (document.userId !== identity.subject) {
      throw new Error("Unauthorized access to document");
    }

    // Update content and clear any pending AI suggestions
    await ctx.db.patch(args.documentId, {
      content: args.newContent,
      isAIPending: false,
      proposedAIContent: undefined,
      proposedAIDiff: undefined,
      updatedAt: Date.now(),
    });

    return args.documentId;
  },
});

/**
 * Accept AI-suggested changes
 */
export const acceptAIChanges = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Ensure user can only update their own documents
    if (document.userId !== identity.subject) {
      throw new Error("Unauthorized access to document");
    }

    if (!document.proposedAIContent) {
      throw new Error("No AI suggestions to accept");
    }

    // Apply the AI's proposed content
    await ctx.db.patch(args.documentId, {
      content: document.proposedAIContent,
      isAIPending: false,
      proposedAIContent: undefined,
      proposedAIDiff: undefined,
      updatedAt: Date.now(),
    });

    return args.documentId;
  },
});

/**
 * Reject AI-suggested changes
 */
export const rejectAIChanges = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Ensure user can only update their own documents
    if (document.userId !== identity.subject) {
      throw new Error("Unauthorized access to document");
    }

    // Clear AI suggestions
    await ctx.db.patch(args.documentId, {
      isAIPending: false,
      proposedAIContent: undefined,
      proposedAIDiff: undefined,
      updatedAt: Date.now(),
    });

    return args.documentId;
  },
});

/**
 * Internal query to get document for AI actions
 * Bypasses authentication check since actions handle auth
 */
export const getDocumentInternal = internalQuery({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    return document;
  },
});

/**
 * Internal mutation to update document with AI suggestions
 * Called by the sendAIRequest action
 */
export const updateWithAISuggestion = internalMutation({
  args: {
    documentId: v.id("documents"),
    proposedContent: v.string(),
    diffResult: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      proposedAIContent: args.proposedContent,
      proposedAIDiff: args.diffResult,
      isAIPending: true,
      updatedAt: Date.now(),
    });
  },
});
