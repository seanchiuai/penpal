import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all chat messages for a document
 */
export const getDocumentMessages = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify user has access to the document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.userId !== identity.subject) {
      throw new Error("Unauthorized access to document");
    }

    // Get all messages for this document, ordered by creation time
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_document_created", (q) =>
        q.eq("documentId", args.documentId)
      )
      .collect();

    return messages;
  },
});

/**
 * Create a new chat message (user message)
 */
export const createMessage = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify user has access to the document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.userId !== identity.subject) {
      throw new Error("Unauthorized access to document");
    }

    const messageId = await ctx.db.insert("chatMessages", {
      documentId: args.documentId,
      userId: identity.subject,
      role: "user",
      content: args.content,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Internal mutation to create a user message
 * Called by AI actions to record user prompts
 */
export const createUserMessageInternal = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("chatMessages", {
      documentId: args.documentId,
      userId: args.userId,
      role: "user",
      content: args.content,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Internal mutation to create an AI response message
 * Called by AI actions after generating suggestions
 */
export const createAIMessageInternal = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    content: v.string(),
    suggestionId: v.optional(v.id("aiSuggestions")),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("chatMessages", {
      documentId: args.documentId,
      userId: args.userId,
      role: "assistant",
      content: args.content,
      suggestionId: args.suggestionId,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Delete a chat message (optional - for future use)
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only allow users to delete their own messages
    if (message.userId !== identity.subject) {
      throw new Error("Unauthorized to delete this message");
    }

    await ctx.db.delete(args.messageId);
    return null;
  },
});

/**
 * Clear all chat messages for a document (optional - for future use)
 */
export const clearDocumentMessages = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify user has access to the document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.userId !== identity.subject) {
      throw new Error("Unauthorized access to document");
    }

    // Get all messages for this document
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    // Delete all messages
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { deletedCount: messages.length };
  },
});
