"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import DiffMatchPatch from "diff-match-patch";

/**
 * Send an AI request to modify document content
 * This action:
 * 1. Calls OpenAI with the user's prompt and current content
 * 2. Computes the diff between original and AI-suggested content
 * 3. Stores the proposed changes in the database
 */
export const sendAIRequest = action({
  args: {
    documentId: v.id("documents"),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    try {
      // Get the current document content
      const document = await ctx.runQuery(internal.documents.getDocumentInternal, {
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

      // Compute diff using diff-match-patch
      const dmp = new DiffMatchPatch();
      const diffs = dmp.diff_main(originalContent, proposedContent);
      dmp.diff_cleanupSemantic(diffs);

      // Serialize the diff result to JSON for storage
      const diffResult = JSON.stringify(diffs);

      // Update the document with AI suggestions using internal mutation
      await ctx.runMutation(internal.documents.updateWithAISuggestion, {
        documentId: args.documentId,
        proposedContent,
        diffResult,
      });

      return {
        success: true,
        message: "AI suggestions generated successfully",
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
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    try {
      const document = await ctx.runQuery(internal.documents.getDocumentInternal, {
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

      // Compute diff
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
