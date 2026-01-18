'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AddTodoFormProps {
  onAdd: (text: string) => void;
}

export function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Add a quick task..."
        className={cn(
          'w-full bg-bg-tertiary border rounded-xl px-4 py-3 pr-12',
          'text-sm text-text-primary placeholder-text-muted',
          'transition-all duration-200',
          'focus:outline-none',
          isFocused ? 'border-accent shadow-sm' : 'border-border-subtle'
        )}
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2',
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'transition-all duration-200 btn-press',
          text.trim()
            ? 'bg-accent text-white hover:bg-accent-hover'
            : 'bg-bg-secondary text-text-muted border border-border-subtle'
        )}
        aria-label="Add todo"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </form>
  );
}
