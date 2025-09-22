"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignUpButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import TodoDashboard from "@/components/TodoDashboard";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-light">VIBED</span>
            <span className="text-xs text-gray-400">Productivity</span>
          </div>
          <UserButton />
        </div>
      </header>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
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
      <h1 className="text-3xl font-light mb-2">Welcome to VIBED</h1>
      <p className="text-gray-500 mb-8">Sign in to start organizing your tasks</p>
      <div className="flex flex-col gap-3">
        <SignInButton mode="modal">
          <button className="w-full px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
            Create account
          </button>
        </SignUpButton>
      </div>
    </div>
  );
}

