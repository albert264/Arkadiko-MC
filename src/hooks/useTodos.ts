'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { TodoItem } from '@/types';
import { generateId, formatDate } from '@/lib/utils';

export function useTodos() {
  const [todos, setTodos, isHydrated] = useLocalStorage<TodoItem[]>('vibe-todos', []);

  const addTodo = useCallback((text: string) => {
    const newTodo: TodoItem = {
      id: generateId(),
      text,
      completed: false,
      createdAt: formatDate(new Date())
    };

    setTodos((prev) => [newTodo, ...prev]);
  }, [setTodos]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, [setTodos]);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, [setTodos]);

  const updateTodo = useCallback((id: string, text: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, text } : todo
      )
    );
  }, [setTodos]);

  return {
    todos,
    isHydrated,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo
  };
}
