"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconCheck, IconX, IconEdit } from "@tabler/icons-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Change {
  _id: Id<"changes">;
  changeType: "insertion" | "deletion" | "replacement";
  startIndex: number;
  endIndex: number;
  newText: string;
  oldText: string;
  status: "pending" | "approved" | "rejected";
  userId: string;
  timestamp: number;
}

interface ChangeControlsProps {
  change: Change;
  onApproved?: () => void;
  onRejected?: () => void;
}

export function ChangeControls({
  change,
  onApproved,
  onRejected,
}: ChangeControlsProps) {
  const approveChange = useMutation(api.changeControlChanges.approveChange);
  const rejectChange = useMutation(api.changeControlChanges.rejectChange);
  const tweakChange = useMutation(api.changeControlChanges.tweakChange);

  const [isTweaking, setIsTweaking] = useState(false);
  const [tweakedText, setTweakedText] = useState(change.newText);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveChange({ changeId: change._id });
      onApproved?.();
    } catch (error) {
      console.error("Failed to approve change:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await rejectChange({ changeId: change._id });
      onRejected?.();
    } catch (error) {
      console.error("Failed to reject change:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTweak = async () => {
    setIsProcessing(true);
    try {
      await tweakChange({ changeId: change._id, newText: tweakedText });
      setIsTweaking(false);
    } catch (error) {
      console.error("Failed to tweak change:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getChangeTypeLabel = () => {
    switch (change.changeType) {
      case "insertion":
        return "Insert";
      case "deletion":
        return "Delete";
      case "replacement":
        return "Replace";
      default:
        return "Change";
    }
  };

  const getChangeTypeColor = () => {
    switch (change.changeType) {
      case "insertion":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "deletion":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "replacement":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      default:
        return "";
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getChangeTypeColor()}>
            {getChangeTypeLabel()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Position: {change.startIndex}
            {change.endIndex !== change.startIndex &&
              ` - ${change.endIndex}`}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(change.timestamp).toLocaleString()}
        </span>
      </div>

      <div className="space-y-2">
        {change.changeType !== "insertion" && change.oldText && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Old: </span>
            <span className="line-through text-red-600 dark:text-red-400">
              {change.oldText}
            </span>
          </div>
        )}

        {change.changeType !== "deletion" && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">New: </span>
            {isTweaking ? (
              <div className="mt-1 flex gap-2">
                <Input
                  value={tweakedText}
                  onChange={(e) => setTweakedText(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleTweak}
                  disabled={isProcessing}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsTweaking(false);
                    setTweakedText(change.newText);
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">
                {change.newText}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex items-center gap-1"
        >
          <IconCheck className="h-4 w-4" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleReject}
          disabled={isProcessing}
          className="flex items-center gap-1"
        >
          <IconX className="h-4 w-4" />
          Reject
        </Button>
        {change.changeType !== "deletion" && !isTweaking && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsTweaking(true)}
            disabled={isProcessing}
            className="flex items-center gap-1"
          >
            <IconEdit className="h-4 w-4" />
            Tweak
          </Button>
        )}
      </div>
    </div>
  );
}
