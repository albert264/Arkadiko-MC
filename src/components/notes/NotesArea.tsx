'use client';

import { useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';

export function NotesArea() {
  const { content, isHydrated, updateContent } = useNotes();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-display font-medium text-text-primary tracking-tight">
          Notes
        </h2>
        <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </div>

      {/* Notes Textarea */}
      <div className={cn(
        'relative rounded-xl overflow-hidden transition-all duration-200',
        isFocused ? 'ring-2 ring-accent/20' : ''
      )}>
        {!isHydrated ? (
          <div className="w-full h-[180px] bg-bg-tertiary border border-border-subtle rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Jot down ideas, links, or anything..."
            className={cn(
              'w-full h-[180px] bg-bg-tertiary border rounded-xl px-4 py-3',
              'text-sm text-text-primary placeholder-text-muted',
              'resize-none focus:outline-none scrollbar-thin',
              'leading-relaxed',
              'transition-all duration-200',
              isFocused ? 'border-accent' : 'border-border-subtle'
            )}
          />
        )}

        {/* Character hint - fades in when typing */}
        {isHydrated && content.length > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-text-muted/60 pointer-events-none">
            {content.length} chars
          </div>
        )}
      </div>

      {/* Subtle tip */}
      <p className="mt-2 text-xs text-text-muted/70">
        Auto-saves as you type
      </p>
    </div>
  );
}
