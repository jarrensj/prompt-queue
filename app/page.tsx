'use client';

import { useState, useEffect, useRef } from 'react';

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
  const intervalsRef = useRef<Record<string, NodeJS.Timeout>>({});

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
      todo.id === id ? { ...todo, isCompleting: true, countdown: 2 } : todo
    ));

    // Countdown timer
    let count = 2;
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        delete intervalsRef.current[id];
        setTodos(prev => prev.filter(todo => todo.id !== id));
      } else {
        setTodos(prev => prev.map(todo => 
          todo.id === id ? { ...todo, countdown: count } : todo
        ));
      }
    }, 1000);
    
    // Store interval reference so we can cancel it
    intervalsRef.current[id] = interval;
  };

  const cancelDelete = (id: string) => {
    // Clear the interval
    if (intervalsRef.current[id]) {
      clearInterval(intervalsRef.current[id]);
      delete intervalsRef.current[id];
    }
    
    // Reset the todo back to normal state
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, isCompleting: false, countdown: undefined } : todo
    ));
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen py-12 px-6" style={{ background: '#FAF7F0' }}>
      <div className="max-w-3xl mx-auto">
        <div className="sketch-border p-10 mb-8" style={{ background: '#FFFBF5' }}>
          <h1 className="text-5xl font-light mb-3 text-center" style={{ color: '#4A4A4A', letterSpacing: '0.02em' }}>
            Prompt Queue
          </h1>
          <p className="text-center mb-10 opacity-70" style={{ color: '#6B6B6B', fontSize: '0.95rem' }}>
            record your upcoming prompts
          </p>

          <form onSubmit={addTodo} className="mb-10">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Add a new prompt…"
                className="flex-1 px-5 py-3 rounded-lg border-2 focus:outline-none transition-all"
                style={{ 
                  borderColor: '#4A4A4A',
                  background: '#FFFBF5',
                  color: '#4A4A4A',
                  boxShadow: '2px 2px 0px rgba(74, 74, 74, 0.1)'
                }}
              />
              <button
                type="submit"
                className="sketch-button px-7 py-3 font-medium"
                style={{ 
                  background: '#8B9A7C',
                  color: '#FFFBF5',
                  borderColor: '#6B7C5D'
                }}
              >
                Add
              </button>
            </div>
          </form>

          {todos.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg opacity-60" style={{ color: '#6B6B6B' }}>
                No prompts yet. Add one to get started!
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`flex items-center justify-between p-5 rounded-lg transition-all duration-300 border-2`}
                  style={{
                    background: todo.isCompleting
                      ? '#F5E6E6'
                      : newlyAddedId === todo.id
                      ? '#F5F0E6'
                      : '#FAF7F0',
                    borderColor: todo.isCompleting
                      ? '#D4A5A5'
                      : newlyAddedId === todo.id
                      ? '#C9BC9A'
                      : '#4A4A4A',
                    opacity: todo.isCompleting ? 0.7 : 1,
                    boxShadow: newlyAddedId === todo.id ? '3px 3px 0px rgba(74, 74, 74, 0.15)' : '2px 2px 0px rgba(74, 74, 74, 0.1)'
                  }}
                >
                  <span 
                    className={`flex-1 text-lg pr-4 ${todo.isCompleting ? 'line-through' : ''}`}
                    style={{ color: todo.isCompleting ? '#8B8B8B' : '#4A4A4A' }}
                  >
                    {todo.text}
                  </span>
                  
                  {todo.isCompleting ? (
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-base animate-pulse" style={{ color: '#A67C52' }}>
                        Deleting in {todo.countdown}…
                      </span>
                      <button
                        onClick={() => cancelDelete(todo.id)}
                        className="sketch-button px-4 py-2 font-medium"
                        style={{ 
                          background: '#6B6B6B',
                          color: '#FFFBF5',
                          borderColor: '#4A4A4A'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => copyToClipboard(todo.text, todo.id)}
                        className="sketch-button px-5 py-2 font-medium"
                        style={{ 
                          background: copiedId === todo.id ? '#B8C9A8' : '#FFFBF5',
                          color: copiedId === todo.id ? '#FFFBF5' : '#8B9A7C',
                          borderColor: '#8B9A7C'
                        }}
                      >
                        {copiedId === todo.id ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => markAsComplete(todo.id)}
                        className="sketch-button px-5 py-2 font-medium"
                        style={{ 
                          background: '#8B9A7C',
                          color: '#FFFBF5',
                          borderColor: '#6B7C5D'
                        }}
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 text-center text-sm opacity-60" style={{ color: '#6B6B6B' }}>
            {todos.length} {todos.length === 1 ? 'prompt' : 'prompts'}
          </div>
        </div>
      </div>
    </div>
  );
}
