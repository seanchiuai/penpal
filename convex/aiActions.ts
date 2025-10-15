"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import DiffMatchPatch from "diff-match-patch";

// Type definitions for change groups
type ChangeGroup = {
  startPos: number;
  endPos: number;
  deletions: Array<{ text: string; position: number }>;
  insertions: Array<{ text: string; position: number }>;
};

/**
 * Compute structured diff data from original and suggested content
 * Returns change groups where each group contains deletions and insertions at specific positions
 * Positions are relative to the ORIGINAL text
 *
 * SIMPLIFIED APPROACH: Each change (delete/insert pair) gets its own group
 * This ensures position tracking is always accurate
 */
function computeStructuredDiff(original: string, suggested: string): ChangeGroup[] {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(original, suggested);
  dmp.diff_cleanupSemantic(diffs);

  const changeGroups: ChangeGroup[] = [];
  let currentPosInOriginal = 0;

  // Track pending changes to group deletions and insertions that happen together
  let pendingDeletions: Array<{ text: string; position: number }> = [];
  let pendingInsertions: Array<{ text: string; position: number }> = [];
  let groupStartPos = 0;
  let groupEndPos = 0;

  const flushPendingGroup = () => {
    if (pendingDeletions.length > 0 || pendingInsertions.length > 0) {
      changeGroups.push({
        startPos: groupStartPos,
        endPos: groupEndPos,
        deletions: pendingDeletions,
        insertions: pendingInsertions,
      });
      pendingDeletions = [];
      pendingInsertions = [];
    }
  };

  for (const [operation, text] of diffs) {
    if (operation === 0) {
      // DIFF_EQUAL - unchanged text
      // Finalize any pending group before this unchanged text
      flushPendingGroup();

      // Move position forward
      currentPosInOriginal += text.length;
    } else if (operation === -1) {
      // DIFF_DELETE - text removed from original
      if (pendingDeletions.length === 0) {
        // Start a new group
        groupStartPos = currentPosInOriginal;
      }

      pendingDeletions.push({
        text,
        position: currentPosInOriginal,
      });

      groupEndPos = currentPosInOriginal + text.length;
      currentPosInOriginal += text.length;
    } else if (operation === 1) {
      // DIFF_INSERT - text added in suggested version
      if (pendingDeletions.length === 0 && pendingInsertions.length === 0) {
        // Pure insertion with no preceding deletion
        groupStartPos = currentPosInOriginal;
        groupEndPos = currentPosInOriginal;
      }

      pendingInsertions.push({
        text,
        position: currentPosInOriginal,
      });
      // Don't increment position for insertions
    }
  }

  // Flush any remaining pending group
  flushPendingGroup();

  return changeGroups;
}

/**
 * Send an AI request to modify document content
 * This action:
 * 1. Calls OpenAI with the user's prompt and current content
 * 2. Computes the structured diff with grouped changes
 * 3. Stores the inline suggestions in the aiSuggestions table
 */
export const sendAIRequest = action({
  args: {
    documentId: v.id("documents"),
    prompt: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    suggestionId: any;
    changeGroupCount: number;
  }> => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    try {
      // Get the current document content
      const document: any = await ctx.runQuery(internal.documents.getDocumentInternal, {
        documentId: args.documentId,
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Ensure user owns the document
      if (document.userId !== identity.subject) {
        throw new Error("Unauthorized access to document");
      }

      const originalContent = document.content || "";

      // Call OpenAI to generate modified content
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are a helpful writing assistant. The user has the following document:

---
${originalContent}
---

The user wants you to: ${args.prompt}

Please provide the complete modified version of the document. Return ONLY the modified document content, without any explanations or markdown formatting.`,
        temperature: 0.7,
      });

      const proposedContent = result.text.trim();

      // Compute structured diff with grouped changes
      const changeGroups = computeStructuredDiff(originalContent, proposedContent);

      // Store the inline suggestion using internal mutation
      const suggestionId: any = await ctx.runMutation(internal.aiSuggestions.createInternal, {
        documentId: args.documentId,
        userId: identity.subject,
        changeGroups,
      });

      // Also update the legacy format for backward compatibility
      const dmp = new DiffMatchPatch();
      const diffs = dmp.diff_main(originalContent, proposedContent);
      dmp.diff_cleanupSemantic(diffs);
      const diffResult = JSON.stringify(diffs);

      await ctx.runMutation(internal.documents.updateWithAISuggestion, {
        documentId: args.documentId,
        proposedContent,
        diffResult,
      });

      return {
        success: true,
        message: "AI suggestions generated successfully",
        suggestionId,
        changeGroupCount: changeGroups.length,
      };
    } catch (error) {
      console.error("AI request error:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("rate limit")) {
          throw new Error("OpenAI rate limit exceeded. Please try again later.");
        }
        if (error.message.includes("timeout")) {
          throw new Error("AI request timed out. Please try again.");
        }
        throw new Error(`AI request failed: ${error.message}`);
      }

      throw new Error("AI request failed with an unknown error");
    }
  },
});

/**
 * Alternative AI action for more complex editing tasks
 * Uses a more sophisticated prompt structure
 */
export const sendAdvancedAIRequest = action({
  args: {
    documentId: v.id("documents"),
    prompt: v.string(),
    systemPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    suggestionId: any;
    changeGroupCount: number;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    try {
      const document: any = await ctx.runQuery(internal.documents.getDocumentInternal, {
        documentId: args.documentId,
      });

      if (!document) {
        throw new Error("Document not found");
      }

      if (document.userId !== identity.subject) {
        throw new Error("Unauthorized access to document");
      }

      const originalContent = document.content || "";

      const systemMessage = args.systemPrompt ||
        "You are an expert writing assistant that helps improve documents while preserving the author's voice and intent.";

      const result = await generateText({
        model: openai("gpt-4o"),
        system: systemMessage,
        prompt: `Current document content:

---
${originalContent}
---

User instruction: ${args.prompt}

Provide the complete revised document. Return ONLY the document content without explanations.`,
        temperature: 0.7,
      });

      const proposedContent = result.text.trim();

      // Compute structured diff with grouped changes
      const changeGroups = computeStructuredDiff(originalContent, proposedContent);

      // Store the inline suggestion
      const suggestionId: any = await ctx.runMutation(internal.aiSuggestions.createInternal, {
        documentId: args.documentId,
        userId: identity.subject,
        changeGroups,
      });

      // Also update the legacy format for backward compatibility
      const dmp = new DiffMatchPatch();
      const diffs = dmp.diff_main(originalContent, proposedContent);
      dmp.diff_cleanupSemantic(diffs);
      const diffResult = JSON.stringify(diffs);

      await ctx.runMutation(internal.documents.updateWithAISuggestion, {
        documentId: args.documentId,
        proposedContent,
        diffResult,
      });

      return {
        success: true,
        message: "Advanced AI suggestions generated successfully",
        suggestionId,
        changeGroupCount: changeGroups.length,
      };
    } catch (error) {
      console.error("Advanced AI request error:", error);

      if (error instanceof Error) {
        throw new Error(`AI request failed: ${error.message}`);
      }

      throw new Error("AI request failed with an unknown error");
    }
  },
});
