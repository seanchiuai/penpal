"use client";

import React, { useState, useCallback } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, X } from "lucide-react";

type ChangeGroupStatus = "pending" | "accepted" | "rejected";

interface HoverableChangeProps {
  children: React.ReactNode;
  status: ChangeGroupStatus;
  onAccept: () => void;
  onReject: () => void;
  groupIndex: number;
}

/**
 * HoverableChange wraps an inline change group (deletions + insertions)
 * and shows Accept/Reject buttons in a Radix UI Popover on hover.
 *
 * Features:
 * - Radix UI Popover for precise positioning and portal rendering
 * - Smooth hover interaction with debounced close
 * - Prevents flicker by tracking hover on both trigger and content
 * - High z-index and proper pointer events for buttons
 */
export function HoverableChange({
  children,
  status,
  onAccept,
  onReject,
  groupIndex,
}: HoverableChangeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle mouse enter - open popover and clear any pending close
  const handleMouseEnter = useCallback(() => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    if (status === "pending") {
      setIsOpen(true);
    }
  }, [closeTimeout, status]);

  // Handle mouse leave - debounced close to prevent flicker
  const handleMouseLeave = useCallback(() => {
    const timeout = setTimeout(() => {
      setIsOpen(false);
    }, 150); // 150ms debounce
    setCloseTimeout(timeout);
  }, []);

  // Handle accept with proper event handling
  const handleAccept = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAccept();
    setIsOpen(false);
  }, [onAccept]);

  // Handle reject with proper event handling
  const handleReject = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onReject();
    setIsOpen(false);
  }, [onReject]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <span
          className={`relative inline-block px-1 py-0.5 rounded cursor-pointer transition-colors ${
            status === "accepted"
              ? "opacity-50 bg-green-50 dark:bg-green-900/10"
              : status === "rejected"
              ? "opacity-30 line-through bg-red-50 dark:bg-red-900/10"
              : "hover:bg-blue-50 dark:hover:bg-blue-900/10"
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-change-group={groupIndex}
        >
          {children}
          {/* Status indicator for accepted/rejected changes */}
          {status === "accepted" && (
            <span className="ml-1 inline-flex items-center text-green-600 dark:text-green-400">
              <Check className="w-3 h-3" />
            </span>
          )}
          {status === "rejected" && (
            <span className="ml-1 inline-flex items-center text-red-600 dark:text-red-400">
              <X className="w-3 h-3" />
            </span>
          )}
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={8}
          className="z-[9999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg px-2 py-1.5 flex items-center gap-1 animate-in fade-in-0 zoom-in-95"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <button
            onClick={handleAccept}
            className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors group"
            title="Accept this change"
            type="button"
          >
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </button>
          <button
            onClick={handleReject}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors group"
            title="Reject this change"
            type="button"
          >
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
