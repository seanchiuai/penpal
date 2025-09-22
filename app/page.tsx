"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignUpButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import TodoDashboard from "@/components/TodoDashboard";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-mona-bold">VIBED</span>
            <span className="text-xs text-muted-foreground">Productivity</span>
          </div>
          <UserButton />
        </div>
      </header>
      <main className="min-h-screen bg-background">
        <div className="py-12 px-4">
          <Authenticated>
            <TodoDashboard />
          </Authenticated>
          <Unauthenticated>
            <SignInForm />
          </Unauthenticated>
        </div>
      </main>
    </>
  );
}

function SignInForm() {
  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-3xl font-mona-heading mb-2">Welcome to VIBED</h1>
      <p className="text-muted-foreground mb-8">Sign in to start organizing your tasks</p>
      <div className="flex flex-col gap-3">
        <SignInButton mode="modal">
          <button className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="w-full px-4 py-2.5 border border-border rounded-lg hover:bg-secondary transition-colors">
            Create account
          </button>
        </SignUpButton>
      </div>
    </div>
  );
}

