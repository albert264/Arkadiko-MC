export type KanbanStatus = 'todo' | 'in-progress' | 'complete' | 'archive';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Assignee {
  id: string;
  name: string;
  avatar?: string;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  status: KanbanStatus;
  priority: Priority;
  assignees: Assignee[];
  labels: Label[];
  subtasks: Subtask[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface KanbanState {
  columns: {
    'todo': KanbanCard[];
    'in-progress': KanbanCard[];
    'complete': KanbanCard[];
    'archive': KanbanCard[];
  };
  availableLabels: Label[];
  teamMembers: Assignee[];
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  updatedAt: string;
}

export interface AppState {
  kanban: KanbanState;
  todos: TodoItem[];
  notes: Note[];
  version: number;
}

// Default labels
export const DEFAULT_LABELS: Label[] = [
  { id: 'bug', name: 'Bug', color: '#EF4444' },
  { id: 'feature', name: 'Feature', color: '#3B82F6' },
  { id: 'design', name: 'Design', color: '#8B5CF6' },
  { id: 'docs', name: 'Docs', color: '#10B981' },
  { id: 'refactor', name: 'Refactor', color: '#F59E0B' },
];

// Default team members (user can customize)
export const DEFAULT_TEAM: Assignee[] = [
  { id: 'user-1', name: 'You' },
];

// Priority config
export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: '#6B7280', bgColor: '#F3F4F6' },
  medium: { label: 'Medium', color: '#D97706', bgColor: '#FEF3C7' },
  high: { label: 'High', color: '#DC2626', bgColor: '#FEE2E2' },
  urgent: { label: 'Urgent', color: '#FFFFFF', bgColor: '#DC2626' },
};
