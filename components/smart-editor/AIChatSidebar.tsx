"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage } from "./ChatMessage";
import { Id } from "@/convex/_generated/dataModel";

interface AIChatSidebarProps {
  documentId: Id<"documents">;
  isAIPending: boolean;
  isLoading: boolean;
  onSendPrompt: (prompt: string) => Promise<void>;
  onAcceptChanges: () => Promise<void>;
  onRejectChanges: () => Promise<void>;
}

export function AIChatSidebar({
  documentId,
  isAIPending,
  isLoading,
  onSendPrompt,
  onAcceptChanges,
  onRejectChanges,
}: AIChatSidebarProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chat messages for this document
  const messages = useQuery(api.chatMessages.getDocumentMessages, { documentId });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSendPrompt = async () => {
    if (!input.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const promptText = input.trim();
    setInput(""); // Clear input immediately for better UX

    try {
      await onSendPrompt(promptText);
    } catch (error) {
      console.error("Error sending prompt:", error);
      toast.error("Failed to send message");
      // Restore the input if it fails
      setInput(promptText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const handleAccept = async () => {
    try {
      await onAcceptChanges();
      toast.success("All changes accepted");
    } catch (error) {
      console.error("Error accepting changes:", error);
      toast.error("Failed to accept changes");
    }
  };

  const handleReject = async () => {
    try {
      await onRejectChanges();
      toast.success("Changes rejected");
    } catch (error) {
      console.error("Error rejecting changes:", error);
      toast.error("Failed to reject changes");
    }
  };

  const quickActions = [
    "Fix grammar and spelling",
    "Make this more concise",
    "Expand with more detail",
    "Improve clarity",
    "Make it more professional",
  ];

  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-purple-500 text-white">
            <Sparkles className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <p className="text-xs text-muted-foreground">Ask me to improve your document</p>
        </div>
      </div>

      {/* Chat History - Scrollable */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages === undefined ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              <Sparkles className="h-8 w-8 mx-auto mb-3 text-purple-500" />
              <p className="font-medium mb-1">Start a conversation</p>
              <p className="text-xs">Ask me to improve your document or use a quick action below</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message._id}
                role={message.role}
                content={message.content}
                timestamp={message.createdAt}
              />
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <ChatMessage
              role="assistant"
              content=""
              isLoading
            />
          )}
        </div>
      </ScrollArea>

      {/* Accept/Reject Actions */}
      {isAIPending && (
        <div className="border-t border-b p-4 bg-blue-50 dark:bg-blue-950/20">
          <p className="text-sm font-medium mb-3 text-blue-900 dark:text-blue-100">
            Review suggestions in the editor
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              size="sm"
              className="flex-1"
              disabled={isLoading}
            >
              <Check className="mr-2 h-4 w-4" />
              Accept All
            </Button>
            <Button
              onClick={handleReject}
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Reject All
            </Button>
          </div>
        </div>
      )}

      {/* Input Area - Fixed at bottom */}
      <div className="border-t p-4">
        <div className="flex gap-2 mb-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to improve your document..."
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendPrompt}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-[80px] w-12 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Quick actions:</p>
          <div className="flex flex-wrap gap-1">
            {quickActions.map((action) => (
              <Button
                key={action}
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setInput(action)}
                disabled={isLoading}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
