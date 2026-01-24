# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCVibe Project Manager is a full-stack web application built with Next.js 15 and React 19. It's a clean, aesthetically designed project management tool featuring a Kanban board, quick task management, and notes - all with localStorage persistence.

## Commands

```bash
# Development server (with Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

### Tech Stack
- **Framework:** Next.js 15.1.0 with App Router
- **UI:** React 19.0.0 with TypeScript 5.7.0 (strict mode)
- **Styling:** Tailwind CSS 3.4.0 with custom design tokens
- **Drag & Drop:** @hello-pangea/dnd 17.0.0
- **State:** Local React hooks with localStorage persistence (no external state management)

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main layout (sidebar + content)
│   ├── layout.tsx         # Root layout with metadata
│   └── globals.css        # Global styles, animations, CSS variables
├── components/
│   ├── kanban/            # KanbanBoard, KanbanColumn, KanbanCard, AddCardForm, CardDetailModal
│   ├── todos/             # TodoList, TodoItem, AddTodoForm
│   └── notes/             # NotesArea
├── hooks/                 # Custom React hooks
│   ├── useKanban.ts       # Kanban state management
│   ├── useTodos.ts        # Todo CRUD operations
│   ├── useNotes.ts        # Notes state
│   └── useLocalStorage.ts # Debounced localStorage persistence
├── types/
│   └── index.ts           # All TypeScript interfaces
└── lib/
    └── utils.ts           # Utilities (generateId, formatDate, cn)
```

### Key Patterns

1. **Client Components:** All components use `'use client'` directive
2. **State Hooks:** Custom hooks manage isolated state domains with useCallback memoization
3. **Persistence:** localStorage with debounced saves (300ms); keys: `vibe-kanban-v2`, `vibe-todos`, `vibe-notes`
4. **Styling:** Tailwind CSS with `cn()` utility for conditional classes; CSS variables for design tokens
5. **Types:** Centralized in `/src/types/index.ts` (KanbanCard, TodoItem, KanbanStatus, Priority)

### Key Types
- `KanbanStatus`: 'todo' | 'in-progress' | 'complete' | 'archive'
- `Priority`: 'low' | 'medium' | 'high' | 'urgent'
- `KanbanCard`: Full card with labels, assignees, subtasks, due dates

## Code Conventions

- Use TypeScript strict mode - full type coverage required
- Use absolute imports with `@/*` path alias (maps to `./src/*`)
- Event handlers should be memoized with useCallback
- Prefer Tailwind classes over inline styles
- Use the `cn()` utility from `lib/utils.ts` for conditional class names

## Design System

- **Accent color:** Terracotta (#D4654A)
- **Font:** Trebuchet MS
- **Animations:** fadeIn, slideIn, scaleIn with staggered delays
- **Color palette:** Warm editorial tones defined as CSS variables in globals.css
