"use client";

import * as React from "react";
import { useState } from "react";
import { Paperclip, MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface CommandTextAreaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "onSubmit"
  > {
  onSubmit?: (value: string) => void;
}

export default function CommandTextArea({
  className,
  onSubmit,
  ...props
}: CommandTextAreaProps) {
  const [message, setMessage] = useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (onSubmit && message.trim()) {
        onSubmit(message);
        setMessage("");
      }
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="relative w-full max-w-3xl mx-auto overflow-hidden">
      <div className="relative flex items-center min-h-12 rounded-lg border border-input bg-background shadow-sm">
        <button
          className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Add attachment"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <textarea
          ref={textareaRef}
          className={cn(
            "flex-1 resize-none bg-transparent px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder="Ask DevFlow IA a question..."
          rows={1}
          onKeyDown={handleKeyDown}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          {...props}
        />
        <div className="flex items-center gap-2 pr-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (onSubmit && message.trim()) {
                onSubmit(message);
                setMessage("");
              }
            }}
            className="flex items-center h-7 w-7 justify-center rounded border text-xs text-muted-foreground"
          >
            <MoveRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
