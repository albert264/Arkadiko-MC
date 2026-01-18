'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { formatDate } from '@/lib/utils';

interface NotesState {
  content: string;
  updatedAt: string;
}

const defaultNotes: NotesState = {
  content: '',
  updatedAt: ''
};

export function useNotes() {
  const [notes, setNotes, isHydrated] = useLocalStorage<NotesState>('vibe-notes', defaultNotes);

  const updateContent = useCallback((content: string) => {
    setNotes({
      content,
      updatedAt: formatDate(new Date())
    });
  }, [setNotes]);

  return {
    content: notes.content,
    updatedAt: notes.updatedAt,
    isHydrated,
    updateContent
  };
}
