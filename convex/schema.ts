import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  documents: defineTable({
    // Core document fields (made optional for backward compatibility)
    userId: v.optional(v.string()), // Owner of the document
    title: v.optional(v.string()),
    content: v.optional(v.string()), // The currently accepted document content

    // AI Smart Editor fields
    proposedAIContent: v.optional(v.string()), // AI's suggested full content
    proposedAIDiff: v.optional(v.string()), // Server-side computed diff (JSON serialized)
    isAIPending: v.optional(v.boolean()), // Flag to indicate if an AI suggestion is active

    // Legacy fields for backward compatibility
    originalContent: v.optional(v.string()),
    currentContent: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("pendingReview"),
      v.literal("approved"),
      v.literal("rejected")
    )),
    lastEditedBy: v.optional(v.string()),
    ownerId: v.optional(v.string()), // For Change Controls feature compatibility

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_lastEditedBy", ["lastEditedBy"])
    .index("by_ownerId", ["ownerId"]),
  changes: defineTable({
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
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    timestamp: v.number(),
    originalContentSnapshot: v.string(),
  })
    .index("by_documentId", ["documentId"])
    .index("by_documentId_and_status", ["documentId", "status"]),
  collaborativeDocs: defineTable({
    title: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    lastModified: v.number(),
  }).index("by_createdBy", ["createdBy"]),
  suggestions: defineTable({
    documentId: v.id("documents"),
    type: v.union(v.literal("insert"), v.literal("delete"), v.literal("replace")),
    startIndex: v.number(),
    endIndex: v.number(),
    suggestedText: v.string(),
    originalText: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
    prompt: v.string(),
    modelResponse: v.string(),
  })
    .index("by_documentId", ["documentId"])
    .index("by_documentId_and_status", ["documentId", "status"]),
});
