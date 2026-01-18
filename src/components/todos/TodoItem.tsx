'use client';

import { useState } from 'react';
import { TodoItem as TodoItemType } from '@/types';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: TodoItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(todo.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  return (
    <div className={cn(
      'group flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg',
      'hover:bg-bg-tertiary/50 transition-colors duration-150'
    )}>
      {/* Custom Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        className={cn(
          'mt-0.5 w-[18px] h-[18px] rounded flex-shrink-0 flex items-center justify-center',
          'border-2 transition-all duration-200',
          todo.completed
            ? 'bg-status-complete border-status-complete'
            : 'border-border-default hover:border-accent bg-bg-secondary'
        )}
        aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {todo.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Text / Edit Input */}
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="flex-1 bg-transparent border-b-2 border-accent text-sm text-text-primary focus:outline-none py-0.5"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={cn(
            'flex-1 text-sm cursor-text leading-relaxed py-0.5',
            todo.completed
              ? 'text-text-muted line-through decoration-text-muted/50'
              : 'text-text-primary'
          )}
        >
          {todo.text}
        </span>
      )}

      {/* Delete Button */}
      <button
        onClick={() => onDelete(todo.id)}
        className={cn(
          'opacity-0 group-hover:opacity-100 p-1 rounded',
          'text-text-muted hover:text-red-500 hover:bg-red-50',
          'transition-all duration-150'
        )}
        aria-label="Delete todo"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
