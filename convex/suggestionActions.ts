"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Generate AI suggestions for document content
 * This action calls OpenAI to get structured suggestions
 */
export const generateSuggestions = action({
  args: {
    documentId: v.id("documents"),
    currentContent: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: You must be logged in to generate suggestions");
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in Convex environment variables");
    }

    // Limit document size to avoid token limits (approximately 16k characters)
    if (args.currentContent.length > 16000) {
      throw new Error("Document is too large. Maximum size is 16,000 characters.");
    }

    try {
      // Call OpenAI to generate suggestions
      const systemPrompt = `You are a helpful writing assistant that provides specific, actionable suggestions to improve text.

Given a document and a user's request, provide suggestions in the following JSON array format:
[
  {
    "type": "insert" | "delete" | "replace",
    "startIndex": number,
    "endIndex": number,
    "suggestedText": string,
    "originalText": string,
    "reason": string
  }
]

Rules:
- For "insert": startIndex and endIndex should be the same (insertion point)
- For "delete": suggestedText should be empty, originalText contains what to delete
- For "replace": both suggestedText and originalText should be filled
- Indexes are character positions in the document (0-based)
- Provide up to 5 most impactful suggestions
- Be specific and precise with character indexes
- Only return valid JSON, no additional text

Example:
If the document is "The cat sat on mat." and the request is "fix grammar",
you might suggest:
[
  {
    "type": "replace",
    "startIndex": 15,
    "endIndex": 18,
    "suggestedText": "the mat",
    "originalText": "mat",
    "reason": "Missing article 'the' before 'mat'"
  }
]`;

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `Document:\n${args.currentContent}\n\nUser request: ${args.prompt}\n\nProvide suggestions as a JSON array:`,
        system: systemPrompt,
        temperature: 0.3,
      });

      // Parse the AI response
      let suggestions: Array<{
        type: "insert" | "delete" | "replace";
        startIndex: number;
        endIndex: number;
        suggestedText: string;
        originalText: string;
        reason?: string;
      }>;

      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error("No JSON array found in AI response");
        }
        suggestions = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("Failed to parse AI response:", text);
        throw new Error("Failed to parse AI suggestions. Please try again.");
      }

      // Validate and store suggestions
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error("No valid suggestions received from AI");
      }

      // Store each suggestion in the database
      const suggestionIds: Array<Id<"suggestions">> = [];

      for (const suggestion of suggestions) {
        // Validate suggestion
        if (
          !["insert", "delete", "replace"].includes(suggestion.type) ||
          typeof suggestion.startIndex !== "number" ||
          typeof suggestion.endIndex !== "number" ||
          suggestion.startIndex < 0 ||
          suggestion.endIndex > args.currentContent.length ||
          suggestion.startIndex > suggestion.endIndex
        ) {
          console.warn("Skipping invalid suggestion:", suggestion);
          continue;
        }

        // Store suggestion
        const id: Id<"suggestions"> = await ctx.runMutation(
          internal.suggestionMutations.createSuggestion,
          {
            documentId: args.documentId,
            type: suggestion.type,
            startIndex: suggestion.startIndex,
            endIndex: suggestion.endIndex,
            suggestedText: suggestion.suggestedText || "",
            originalText: suggestion.originalText || "",
            prompt: args.prompt,
            modelResponse: text,
          }
        );

        suggestionIds.push(id);
      }

      if (suggestionIds.length === 0) {
        throw new Error("No valid suggestions could be generated");
      }

      return suggestionIds;
    } catch (error) {
      console.error("Error generating suggestions:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate suggestions: ${error.message}`);
      }
      throw new Error("Failed to generate suggestions. Please try again.");
    }
  },
});
