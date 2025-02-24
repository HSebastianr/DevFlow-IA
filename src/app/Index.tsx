"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  BadgeCheck,
  Bell,
  Check,
  Copy,
  CreditCard,
  GalleryVerticalEnd,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CommandTextArea from "@/components/command-textarea";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const customOneDark = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    backgroundColor: "#18181b",
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: "transparent",
  },
};

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock = ({ code, language }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4">
      <SyntaxHighlighter
        style={customOneDark}
        language={language || "javascript"}
        className="w-full bg-zinc-900 text-white p-4 rounded-md border overflow-x-auto whitespace-pre-wrap text-sm"
      >
        {code}
      </SyntaxHighlighter>
      <button
        onClick={handleCopy}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 z-10 h-6 w-6 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50 [&_svg]:h-3 [&_svg]:w-3 absolute right-4 top-4"
      >
        <span className="sr-only">Copy</span>
        {copied ? <Check /> : <Copy />}
      </button>
    </div>
  );
};

type MessagePart =
  | { type: "text"; content: string }
  | { type: "code"; language: string; content: string }
  | { type: "bold"; content: string }
  | { type: "h1"; content: string };

const parseMessage = (message: string): MessagePart[] => {
  const parts: MessagePart[] = [];
  let lastIndex = 0;
  const regex = /```(\w+)?\n([\s\S]*?)```|\*\*(.*?)\*\*|###\s*(.*?)\n/g;
  let match;
  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: message.slice(lastIndex, match.index),
      });
    }
    if (match[2]) {
      parts.push({
        type: "code",
        language: match[1] ? match[1] : "javascript",
        content: match[2].trim(),
      });
    } else if (match[3]) {
      parts.push({
        type: "bold",
        content: match[3],
      });
    } else if (match[4]) {
      parts.push({
        type: "h1",
        content: match[4],
      });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < message.length) {
    parts.push({
      type: "text",
      content: message.slice(lastIndex),
    });
  }
  return parts;
};

const MessageRenderer = ({ message }: { message: string }) => {
  const parts = parseMessage(message);
  return (
    <div className="w-full max-w-2xl">
      {parts.map((part, index) => {
        switch (part.type) {
          case "code":
            return (
              <CodeBlock
                key={index}
                code={part.content}
                language={part.language}
              />
            );
          case "bold":
            return (
              <strong key={index} className="text-white">
                {part.content}
              </strong>
            );
          case "h1":
            return (
              <h1 key={index} className="text-3xl font-bold text-white my-4">
                {part.content}
              </h1>
            );
          default:
            return (
              <p
                key={index}
                className="whitespace-pre-wrap text-white my-2 inline"
              >
                {part.content}
              </p>
            );
        }
      })}
    </div>
  );
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const ChatMessageBubble = ({ message }: { message: ChatMessage }) => {
  if (message.role === "assistant") {
    return (
      <div className="self-center mb-4">
        <div className="rounded-md">
          <MessageRenderer message={message.content} />
        </div>
      </div>
    );
  } else {
    return (
      <div className="self-end mb-4">
        <div className="text-sm ml-auto bg-primary text-primary-foreground px-3 py-2 rounded-md">
          {message.content}
        </div>
      </div>
    );
  }
};

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<{
    email: string | null;
    name: string | null;
  }>({
    email: null,
    name: null,
  });

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          email: currentUser.email,
          name: currentUser.displayName || "Sin nombre",
        });
      } else {
        setUser({ email: null, name: null });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (userMessage: string) => {
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: userMessage }),
    });
    const data = await response.json();

    setMessages((prev) => [...prev, { role: "assistant", content: data.code }]);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <section className="mx-4 sm:mx-8 md:mx-16 lg:mx-36 mt-4 flex flex-col relative">
      <header className="fixed left-4 sm:left-8 md:left-16 lg:left-36 right-4 sm:right-8 md:right-16 lg:right-36 top-0 pt-4 flex flex-wrap justify-between items-center px-4 py-2 bg-background z-50">
        <Button
          size="lg"
          asChild
          className="bg-transparent hover:bg-transparent shadow-none px-2"
        >
          <a href="#">
            <div className="flex aspect-square w-8 items-center justify-center rounded-lg bg-white text-sidebar-primary-foreground">
              <GalleryVerticalEnd className="w-4 h-4 text-black" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-medium text-white">DevFlow IA</span>
            </div>
          </a>
        </Button>
        {user.email ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="w-9 h-9">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg">
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sparkles />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => router.push("/login")} size="sm">
            Login
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto my-4 flex flex-col w-full max-w-2xl mx-auto mb-28 mt-20 min-h-[29rem]">
        {messages.map((msg, index) => (
          <ChatMessageBubble key={index} message={msg} />
        ))}
      </div>
      <div className="sticky bottom-0 w-full max-w-2xl mx-auto bg-background pb-5 z-50 rounded-t-md ">
        <CommandTextArea onSubmit={handleSendMessage} />
      </div>
    </section>
  );
};

export default Index;
