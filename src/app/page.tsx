'use client';

import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TodoList } from '@/components/todos/TodoList';
import { NotesArea } from '@/components/notes/NotesArea';

export default function Home() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border-subtle bg-bg-secondary p-6 flex flex-col gap-10 shadow-sm">
        {/* Brand */}
        <header className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-display font-semibold text-text-primary tracking-tight">
                MCVibe
              </h1>
              <p className="text-xs text-text-muted font-body tracking-wide uppercase">
                Project Manager
              </p>
            </div>
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Stylized MC monogram */}
                <path
                  d="M4 18V6L8 12L12 6V18"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 18V10C14 8 15.5 6 18 6C20.5 6 20 8 20 10"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Small checkmark accent */}
                <circle cx="19" cy="17" r="3.5" fill="white" fillOpacity="0.25"/>
                <path
                  d="M17.5 17L18.5 18L20.5 16"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </header>

        {/* Todo Section */}
        <section className="animate-fade-in stagger-1 opacity-0">
          <TodoList />
        </section>

        {/* Notes Section - pushed to bottom */}
        <section className="mt-auto animate-fade-in stagger-2 opacity-0">
          <NotesArea />
        </section>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto bg-bg-primary">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-accent rounded-full" />
            <h2 className="text-3xl font-display font-medium text-text-primary tracking-tight">
              Board
            </h2>
          </div>
          <p className="text-text-secondary ml-4 pl-3 border-l-2 border-border-subtle">
            Drag cards to organize your workflow
          </p>
        </header>

        {/* Kanban Board */}
        <div className="animate-fade-in stagger-1 opacity-0">
          <KanbanBoard />
        </div>
      </main>
    </div>
  );
}
