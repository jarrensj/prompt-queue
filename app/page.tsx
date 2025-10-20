'use client';

import { useState, useEffect } from 'react';

interface TodoItem {
  id: string;
  text: string;
  isCompleting: boolean;
  countdown?: number;
}

export default function Home() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('todos');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTodos(parsed.map((item: TodoItem) => ({ ...item, isCompleting: false, countdown: undefined })));
      } catch (e) {
        console.error('Error loading todos:', e);
      }
    }
  }, []);

  // Save to localStorage whenever todos change
  useEffect(() => {
    if (mounted) {
      const todosToSave = todos.filter(todo => !todo.isCompleting);
      localStorage.setItem('todos', JSON.stringify(todosToSave));
    }
  }, [todos, mounted]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        isCompleting: false,
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
      
      // Highlight the newly added item
      setNewlyAddedId(newTodo.id);
      setTimeout(() => setNewlyAddedId(null), 3000);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const markAsComplete = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, isCompleting: true, countdown: 3 } : todo
    ));

    // Countdown timer
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        setTodos(prev => prev.filter(todo => todo.id !== id));
      } else {
        setTodos(prev => prev.map(todo => 
          todo.id === id ? { ...todo, countdown: count } : todo
        ));
      }
    }, 1000);
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 text-center">
            Prompt Queue
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            Add your prompts and watch them disappear
          </p>

          <form onSubmit={addTodo} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Add a new prompt…"
                className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Add
              </button>
            </div>
          </form>

          {todos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No prompts yet. Add one to get started!
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                    todo.isCompleting
                      ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 scale-95'
                      : newlyAddedId === todo.id
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 shadow-lg'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  <span className={`flex-1 text-lg ${
                    todo.isCompleting 
                      ? 'line-through text-gray-500 dark:text-gray-400' 
                      : 'text-gray-800 dark:text-white'
                  }`}>
                    {todo.text}
                  </span>
                  
                  {todo.isCompleting ? (
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 dark:text-red-400 font-bold text-xl animate-pulse">
                        Deleting in {todo.countdown}…
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(todo.text, todo.id)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
                      >
                        {copiedId === todo.id ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => markAsComplete(todo.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {todos.length} {todos.length === 1 ? 'prompt' : 'prompts'}
          </div>
        </div>
      </div>
    </div>
  );
}
