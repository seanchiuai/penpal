"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, timestamp, isLoading }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={cn(
          isUser ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Bubble */}
      <div className={cn(
        "flex flex-col",
        isUser ? "items-end" : "items-start",
        "max-w-[75%]"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-2 whitespace-pre-wrap",
          isUser
            ? "bg-blue-500 text-white rounded-tr-none"
            : "bg-muted text-foreground rounded-tl-none"
        )}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <p className="text-sm">{content}</p>
          )}
        </div>

        {timestamp && !isLoading && (
          <span className="text-xs text-muted-foreground mt-1">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>
    </div>
  );
}
