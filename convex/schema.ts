import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  documents: defineTable({
    // For Inline Diff feature
    originalContent: v.string(),
    currentContent: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("pendingReview"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    lastEditedBy: v.string(),
    // Shared fields
    title: v.optional(v.string()),
    content: v.optional(v.string()), // For Change Controls feature compatibility
    ownerId: v.optional(v.string()), // For Change Controls feature compatibility
    createdAt: v.number(),
    updatedAt: v.number(),
  })
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
});
