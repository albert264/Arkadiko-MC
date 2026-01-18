'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  KanbanState,
  KanbanCard,
  KanbanStatus,
  Priority,
  Assignee,
  Label,
  Subtask,
  DEFAULT_LABELS,
  DEFAULT_TEAM
} from '@/types';
import { generateId, formatDate } from '@/lib/utils';

const defaultState: KanbanState = {
  columns: {
    'todo': [],
    'in-progress': [],
    'complete': [],
    'archive': []
  },
  availableLabels: DEFAULT_LABELS,
  teamMembers: DEFAULT_TEAM
};

export interface NewCardData {
  title: string;
  description?: string;
  priority?: Priority;
  assignees?: Assignee[];
  labels?: Label[];
  dueDate?: string;
}

export interface CardUpdateData {
  title?: string;
  description?: string;
  priority?: Priority;
  assignees?: Assignee[];
  labels?: Label[];
  subtasks?: Subtask[];
  dueDate?: string;
}

export function useKanban() {
  const [state, setState, isHydrated] = useLocalStorage<KanbanState>('vibe-kanban-v2', defaultState);

  // Ensure all columns exist (handles migration from old data)
  const columns = {
    'todo': state.columns?.['todo'] || [],
    'in-progress': state.columns?.['in-progress'] || [],
    'complete': state.columns?.['complete'] || [],
    'archive': state.columns?.['archive'] || []
  };

  const addCard = useCallback((columnId: KanbanStatus, data: NewCardData) => {
    const now = formatDate(new Date());
    const newCard: KanbanCard = {
      id: generateId(),
      title: data.title,
      description: data.description,
      status: columnId,
      priority: data.priority || 'medium',
      assignees: data.assignees || [],
      labels: data.labels || [],
      subtasks: [],
      dueDate: data.dueDate,
      createdAt: now,
      updatedAt: now,
      order: 0
    };

    setState((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [columnId]: [newCard, ...prev.columns[columnId]]
      }
    }));
  }, [setState]);

  const updateCard = useCallback((cardId: string, updates: CardUpdateData) => {
    setState((prev) => {
      const newColumns = { ...prev.columns };

      for (const status of Object.keys(newColumns) as KanbanStatus[]) {
        const cardIndex = newColumns[status].findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
          newColumns[status] = [...newColumns[status]];
          newColumns[status][cardIndex] = {
            ...newColumns[status][cardIndex],
            ...updates,
            updatedAt: formatDate(new Date())
          };
          break;
        }
      }

      return { ...prev, columns: newColumns };
    });
  }, [setState]);

  const deleteCard = useCallback((cardId: string) => {
    setState((prev) => {
      const newColumns = { ...prev.columns };

      for (const status of Object.keys(newColumns) as KanbanStatus[]) {
        const cardIndex = newColumns[status].findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
          newColumns[status] = newColumns[status].filter(c => c.id !== cardId);
          break;
        }
      }

      return { ...prev, columns: newColumns };
    });
  }, [setState]);

  const moveCard = useCallback((
    cardId: string,
    sourceCol: KanbanStatus,
    destCol: KanbanStatus,
    sourceIdx: number,
    destIdx: number
  ) => {
    setState((prev) => {
      const newColumns = { ...prev.columns };
      const sourceCards = [...newColumns[sourceCol]];
      const [movedCard] = sourceCards.splice(sourceIdx, 1);

      if (!movedCard) return prev;

      if (sourceCol === destCol) {
        sourceCards.splice(destIdx, 0, {
          ...movedCard,
          updatedAt: formatDate(new Date())
        });
        newColumns[sourceCol] = sourceCards;
      } else {
        const destCards = [...newColumns[destCol]];
        destCards.splice(destIdx, 0, {
          ...movedCard,
          status: destCol,
          updatedAt: formatDate(new Date())
        });
        newColumns[sourceCol] = sourceCards;
        newColumns[destCol] = destCards;
      }

      return { ...prev, columns: newColumns };
    });
  }, [setState]);

  // Subtask management
  const addSubtask = useCallback((cardId: string, text: string) => {
    const newSubtask: Subtask = {
      id: generateId(),
      text,
      completed: false
    };

    setState((prev) => {
      const newColumns = { ...prev.columns };

      for (const status of Object.keys(newColumns) as KanbanStatus[]) {
        const cardIndex = newColumns[status].findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
          newColumns[status] = [...newColumns[status]];
          newColumns[status][cardIndex] = {
            ...newColumns[status][cardIndex],
            subtasks: [...newColumns[status][cardIndex].subtasks, newSubtask],
            updatedAt: formatDate(new Date())
          };
          break;
        }
      }

      return { ...prev, columns: newColumns };
    });
  }, [setState]);

  const toggleSubtask = useCallback((cardId: string, subtaskId: string) => {
    setState((prev) => {
      const newColumns = { ...prev.columns };

      for (const status of Object.keys(newColumns) as KanbanStatus[]) {
        const cardIndex = newColumns[status].findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
          newColumns[status] = [...newColumns[status]];
          const card = newColumns[status][cardIndex];
          newColumns[status][cardIndex] = {
            ...card,
            subtasks: card.subtasks.map(st =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            ),
            updatedAt: formatDate(new Date())
          };
          break;
        }
      }

      return { ...prev, columns: newColumns };
    });
  }, [setState]);

  const deleteSubtask = useCallback((cardId: string, subtaskId: string) => {
    setState((prev) => {
      const newColumns = { ...prev.columns };

      for (const status of Object.keys(newColumns) as KanbanStatus[]) {
        const cardIndex = newColumns[status].findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
          newColumns[status] = [...newColumns[status]];
          const card = newColumns[status][cardIndex];
          newColumns[status][cardIndex] = {
            ...card,
            subtasks: card.subtasks.filter(st => st.id !== subtaskId),
            updatedAt: formatDate(new Date())
          };
          break;
        }
      }

      return { ...prev, columns: newColumns };
    });
  }, [setState]);

  // Team member management
  const addTeamMember = useCallback((name: string) => {
    const newMember: Assignee = {
      id: generateId(),
      name
    };

    setState((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, newMember]
    }));

    return newMember;
  }, [setState]);

  const removeTeamMember = useCallback((memberId: string) => {
    setState((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter(m => m.id !== memberId)
    }));
  }, [setState]);

  return {
    columns,
    availableLabels: state.availableLabels || DEFAULT_LABELS,
    teamMembers: state.teamMembers || DEFAULT_TEAM,
    isHydrated,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addTeamMember,
    removeTeamMember
  };
}
