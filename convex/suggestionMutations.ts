import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Internal mutation to create a suggestion
 */
export const createSuggestion = internalMutation({
  args: {
    documentId: v.id("documents"),
    type: v.union(v.literal("insert"), v.literal("delete"), v.literal("replace")),
    startIndex: v.number(),
    endIndex: v.number(),
    suggestedText: v.string(),
    originalText: v.string(),
    prompt: v.string(),
    modelResponse: v.string(),
  },
  handler: async (ctx, args) => {
    const suggestionId = await ctx.db.insert("suggestions", {
      documentId: args.documentId,
      type: args.type,
      startIndex: args.startIndex,
      endIndex: args.endIndex,
      suggestedText: args.suggestedText,
      originalText: args.originalText,
      status: "pending",
      createdAt: Date.now(),
      prompt: args.prompt,
      modelResponse: args.modelResponse,
    });
    return suggestionId;
  },
});

/**
 * Accept a single suggestion and apply it to the document
 */
export const acceptSuggestion = mutation({
  args: {
    suggestionId: v.id("suggestions"),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get the suggestion
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.status !== "pending") {
      throw new Error("Suggestion has already been processed");
    }

    // Get the document
    const document = await ctx.db.get(suggestion.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Apply the suggestion to the content
    let newContent = document.currentContent || document.content || "";
    const { type, startIndex, endIndex, suggestedText } = suggestion;

    if (type === "insert") {
      newContent =
        newContent.slice(0, startIndex) +
        suggestedText +
        newContent.slice(startIndex);
    } else if (type === "delete") {
      newContent = newContent.slice(0, startIndex) + newContent.slice(endIndex);
    } else if (type === "replace") {
      newContent =
        newContent.slice(0, startIndex) +
        suggestedText +
        newContent.slice(endIndex);
    }

    // Update the document
    await ctx.db.patch(suggestion.documentId, {
      currentContent: newContent,
      content: newContent, // Keep content field in sync
      updatedAt: Date.now(),
      lastEditedBy: identity.subject,
    });

    // Mark suggestion as accepted
    await ctx.db.patch(args.suggestionId, {
      status: "accepted",
    });

    return null;
  },
});

/**
 * Reject a single suggestion
 */
export const rejectSuggestion = mutation({
  args: {
    suggestionId: v.id("suggestions"),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get the suggestion
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.status !== "pending") {
      throw new Error("Suggestion has already been processed");
    }

    // Mark suggestion as rejected
    await ctx.db.patch(args.suggestionId, {
      status: "rejected",
    });

    return null;
  },
});

/**
 * Accept multiple suggestions in order
 */
export const bulkAcceptSuggestions = mutation({
  args: {
    documentId: v.id("documents"),
    suggestionIds: v.array(v.id("suggestions")),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get the document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Get all suggestions and sort by startIndex
    const suggestions = await Promise.all(
      args.suggestionIds.map((id) => ctx.db.get(id))
    );

    // Filter out null suggestions and ensure they're all pending
    const validSuggestions = suggestions.filter(
      (s) => s !== null && s.status === "pending" && s.documentId === args.documentId
    ) as Array<{
      _id: Id<"suggestions">;
      type: "insert" | "delete" | "replace";
      startIndex: number;
      endIndex: number;
      suggestedText: string;
      status: "pending" | "accepted" | "rejected";
    }>;

    if (validSuggestions.length === 0) {
      throw new Error("No valid pending suggestions found");
    }

    // Sort by startIndex (descending) to apply from end to start
    // This prevents index shifting issues
    validSuggestions.sort((a, b) => b.startIndex - a.startIndex);

    // Apply all suggestions
    let newContent = document.currentContent || document.content || "";
    for (const suggestion of validSuggestions) {
      const { type, startIndex, endIndex, suggestedText } = suggestion;

      if (type === "insert") {
        newContent =
          newContent.slice(0, startIndex) +
          suggestedText +
          newContent.slice(startIndex);
      } else if (type === "delete") {
        newContent = newContent.slice(0, startIndex) + newContent.slice(endIndex);
      } else if (type === "replace") {
        newContent =
          newContent.slice(0, startIndex) +
          suggestedText +
          newContent.slice(endIndex);
      }

      // Mark as accepted
      await ctx.db.patch(suggestion._id, {
        status: "accepted",
      });
    }

    // Update the document
    await ctx.db.patch(args.documentId, {
      currentContent: newContent,
      content: newContent,
      updatedAt: Date.now(),
      lastEditedBy: identity.subject,
    });

    return null;
  },
});

/**
 * Reject multiple suggestions
 */
export const bulkRejectSuggestions = mutation({
  args: {
    documentId: v.id("documents"),
    suggestionIds: v.array(v.id("suggestions")),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Update all suggestions to rejected
    for (const suggestionId of args.suggestionIds) {
      const suggestion = await ctx.db.get(suggestionId);
      if (
        suggestion &&
        suggestion.status === "pending" &&
        suggestion.documentId === args.documentId
      ) {
        await ctx.db.patch(suggestionId, {
          status: "rejected",
        });
      }
    }

    return null;
  },
});
