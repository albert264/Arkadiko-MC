'use client';

import { useTodos } from '@/hooks/useTodos';
import { TodoItem } from './TodoItem';
import { AddTodoForm } from './AddTodoForm';

export function TodoList() {
  const { todos, isHydrated, addTodo, toggleTodo, deleteTodo, updateTodo } = useTodos();

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-display font-medium text-text-primary tracking-tight">
          Quick Tasks
        </h2>
        {isHydrated && totalCount > 0 && (
          <span className="text-xs font-medium text-text-muted bg-bg-tertiary px-2 py-1 rounded-full">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Add Todo Form */}
      <AddTodoForm onAdd={addTodo} />

      {/* Todo List */}
      <div className="mt-4 space-y-1 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
        {!isHydrated ? (
          <div className="py-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : todos.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-bg-tertiary flex items-center justify-center">
              <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">
              No tasks yet
            </p>
            <p className="text-xs text-text-muted/70 mt-1">
              Add one above to get started
            </p>
          </div>
        ) : (
          todos.map((todo, index) => (
            <div
              key={todo.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <TodoItem
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onUpdate={updateTodo}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
