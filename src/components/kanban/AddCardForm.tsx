'use client';

import { useState } from 'react';
import { KanbanStatus } from '@/types';
import { cn } from '@/lib/utils';
import { NewCardData } from '@/hooks/useKanban';

interface AddCardFormProps {
  columnId: KanbanStatus;
  onAdd: (columnId: KanbanStatus, data: NewCardData) => void;
}

export function AddCardForm({ columnId, onAdd }: AddCardFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(columnId, { title: title.trim() });
      setTitle('');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTitle('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'w-full py-3 text-sm text-text-muted',
          'hover:text-accent hover:bg-accent-subtle/50',
          'rounded-xl transition-all duration-200',
          'flex items-center justify-center gap-2',
          'border-2 border-dashed border-transparent hover:border-accent/30'
        )}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-medium">Add card</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 animate-scale-in">
      <div className="bg-bg-secondary border border-border-subtle rounded-xl p-4 shadow-card">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="What needs to be done?"
          className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
        />
        <p className="text-xs text-text-muted mt-2">
          Click the card after creating to add details
        </p>
        <div className="flex gap-2 mt-3">
          <button
            type="submit"
            disabled={!title.trim()}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all btn-press',
              'bg-accent text-text-inverse hover:bg-accent-hover',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            Add card
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setIsOpen(false);
            }}
            className="px-4 py-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
