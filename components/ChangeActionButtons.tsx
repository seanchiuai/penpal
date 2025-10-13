"use client";

import React from "react";

interface ChangeActionButtonsProps {
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  hasChanges?: boolean;
}

export default function ChangeActionButtons({
  onApprove,
  onReject,
  isLoading = false,
  disabled = false,
  hasChanges = true,
}: ChangeActionButtonsProps) {
  if (!hasChanges) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onApprove}
        disabled={disabled || isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        {isLoading ? "Approving..." : "Approve Changes"}
      </button>

      <button
        onClick={onReject}
        disabled={disabled || isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        {isLoading ? "Rejecting..." : "Reject Changes"}
      </button>
    </div>
  );
}
