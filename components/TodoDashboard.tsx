"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

type Tab = "all" | "pending" | "completed";

export default function TodoDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [editingId, setEditingId] = useState<Id<"todos"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const todos = useQuery(api.todos.list);
  const createTodo = useMutation(api.todos.create);
  const toggleComplete = useMutation(api.todos.toggleComplete);
  const removeTodo = useMutation(api.todos.remove);
  const updateTodo = useMutation(api.todos.update);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    await createTodo({
      title: newTodoTitle.trim(),
      description: newTodoDescription.trim() || undefined,
    });

    setNewTodoTitle("");
    setNewTodoDescription("");
  };

  const handleStartEdit = (todo: any) => {
    setEditingId(todo._id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;

    await updateTodo({
      id: editingId,
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
    });

    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const filteredTodos = todos?.filter((todo) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return todo.status === "pending";
    if (activeTab === "completed") return todo.status === "completed";
    return true;
  });

  const pendingCount = todos?.filter((t) => t.status === "pending").length || 0;
  const completedCount = todos?.filter((t) => t.status === "completed").length || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-light mb-2">My Tasks</h1>
        <p className="text-sm text-gray-500">Stay organized and productive</p>
      </div>

      <div className="mb-6 bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
        <form onSubmit={handleCreateTodo} className="space-y-3">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Add a task..."
            className="w-full px-3 py-2 bg-transparent border-none outline-none text-base placeholder-gray-400"
          />
          {newTodoTitle && (
            <>
              <textarea
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-1 bg-transparent border-none outline-none text-sm placeholder-gray-400 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-sm rounded-md hover:opacity-80 transition-opacity"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewTodoTitle("");
                    setNewTodoDescription("");
                  }}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "all"
              ? "text-black dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          All
          {activeTab === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "pending"
              ? "text-black dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
              {pendingCount}
            </span>
          )}
          {activeTab === "pending" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "completed"
              ? "text-black dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Completed
          {completedCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
              {completedCount}
            </span>
          )}
          {activeTab === "completed" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
      </div>

      <div className="space-y-2">
        {!filteredTodos ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {activeTab === "completed"
              ? "No completed tasks"
              : activeTab === "pending"
              ? "No pending tasks"
              : "No tasks yet. Add one above!"}
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo._id}
              className="group bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              {editingId === todo._id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-700 outline-none"
                    autoFocus
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-700 outline-none text-sm resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-xs rounded hover:opacity-80"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete({ id: todo._id })}
                    className={`mt-1 w-5 h-5 rounded border-2 flex-shrink-0 transition-colors ${
                      todo.status === "completed"
                        ? "bg-black dark:bg-white border-black dark:border-white"
                        : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                    }`}
                  >
                    {todo.status === "completed" && (
                      <svg
                        className="w-full h-full text-white dark:text-black p-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <h3
                      className={`text-base ${
                        todo.status === "completed"
                          ? "line-through text-gray-400"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {todo.title}
                    </h3>
                    {todo.description && (
                      <p
                        className={`text-sm mt-1 ${
                          todo.status === "completed"
                            ? "line-through text-gray-300"
                            : "text-gray-500"
                        }`}
                      >
                        {todo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(todo.createdAt).toLocaleDateString()}
                      </span>
                      {todo.completedAt && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Completed {new Date(todo.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(todo)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeTodo({ id: todo._id })}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}