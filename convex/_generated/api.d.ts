/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiActions from "../aiActions.js";
import type * as aiSuggestions from "../aiSuggestions.js";
import type * as changeControlChanges from "../changeControlChanges.js";
import type * as changeControlDocuments from "../changeControlDocuments.js";
import type * as documents from "../documents.js";
import type * as suggestionActions from "../suggestionActions.js";
import type * as suggestionMutations from "../suggestionMutations.js";
import type * as suggestionQueries from "../suggestionQueries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiActions: typeof aiActions;
  aiSuggestions: typeof aiSuggestions;
  changeControlChanges: typeof changeControlChanges;
  changeControlDocuments: typeof changeControlDocuments;
  documents: typeof documents;
  suggestionActions: typeof suggestionActions;
  suggestionMutations: typeof suggestionMutations;
  suggestionQueries: typeof suggestionQueries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
