import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Submit a new change to a document
 */
export const submitChange = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    changeType: v.union(
      v.literal("insertion"),
      v.literal("deletion"),
      v.literal("replacement")
    ),
    startIndex: v.number(),
    endIndex: v.number(),
    newText: v.string(),
    oldText: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the current document to snapshot its content
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    const changeId = await ctx.db.insert("changes", {
      documentId: args.documentId,
      userId: args.userId,
      changeType: args.changeType,
      startIndex: args.startIndex,
      endIndex: args.endIndex,
      newText: args.newText,
      oldText: args.oldText,
      status: "pending",
      timestamp: Date.now(),
      originalContentSnapshot: document.content ?? "",
    });

    return changeId;
  },
});

/**
 * Approve a change and apply it to the document
 */
export const approveChange = mutation({
  args: {
    changeId: v.id("changes"),
  },
  handler: async (ctx, args) => {
    const change = await ctx.db.get(args.changeId);
    if (!change) {
      throw new Error("Change not found");
    }

    const document = await ctx.db.get(change.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Apply the change to the document content
    const currentContent = document.content ?? "";
    let newContent = currentContent;

    if (change.changeType === "insertion") {
      newContent =
        currentContent.slice(0, change.startIndex) +
        change.newText +
        currentContent.slice(change.startIndex);
    } else if (change.changeType === "deletion") {
      newContent =
        currentContent.slice(0, change.startIndex) +
        currentContent.slice(change.endIndex);
    } else if (change.changeType === "replacement") {
      newContent =
        currentContent.slice(0, change.startIndex) +
        change.newText +
        currentContent.slice(change.endIndex);
    }

    // Update the document
    await ctx.db.patch(change.documentId, {
      content: newContent,
      updatedAt: Date.now(),
    });

    // Mark the change as approved
    await ctx.db.patch(args.changeId, {
      status: "approved",
    });

    return null;
  },
});

/**
 * Reject a change
 */
export const rejectChange = mutation({
  args: {
    changeId: v.id("changes"),
  },
  handler: async (ctx, args) => {
    const change = await ctx.db.get(args.changeId);
    if (!change) {
      throw new Error("Change not found");
    }

    await ctx.db.patch(args.changeId, {
      status: "rejected",
    });

    return null;
  },
});

/**
 * Tweak (update) a pending change
 */
export const tweakChange = mutation({
  args: {
    changeId: v.id("changes"),
    newText: v.optional(v.string()),
    startIndex: v.optional(v.number()),
    endIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const change = await ctx.db.get(args.changeId);
    if (!change) {
      throw new Error("Change not found");
    }

    if (change.status !== "pending") {
      throw new Error("Can only tweak pending changes");
    }

    const updates: {
      newText?: string;
      startIndex?: number;
      endIndex?: number;
    } = {};

    if (args.newText !== undefined) {
      updates.newText = args.newText;
    }
    if (args.startIndex !== undefined) {
      updates.startIndex = args.startIndex;
    }
    if (args.endIndex !== undefined) {
      updates.endIndex = args.endIndex;
    }

    await ctx.db.patch(args.changeId, updates);

    return null;
  },
});

/**
 * Get all changes for a document
 */
export const getChangesForDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const changes = await ctx.db
      .query("changes")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .collect();

    return changes;
  },
});
