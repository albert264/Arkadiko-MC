'use client';

import { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useKanban } from '@/hooks/useKanban';
import { KanbanColumn } from './KanbanColumn';
import { CardDetailModal } from './CardDetailModal';
import { KanbanStatus, KanbanCard } from '@/types';

const columnConfig: { id: KanbanStatus; title: string; collapsible?: boolean }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'complete', title: 'Complete' },
  { id: 'archive', title: 'Archive', collapsible: true }
];

export function KanbanBoard() {
  const {
    columns,
    availableLabels,
    teamMembers,
    isHydrated,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addTeamMember
  } = useKanban();

  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    moveCard(
      draggableId,
      source.droppableId as KanbanStatus,
      destination.droppableId as KanbanStatus,
      source.index,
      destination.index
    );
  };

  const handleCardClick = (card: KanbanCard) => {
    setSelectedCard(card);
  };

  // Find the current version of the selected card (in case it was updated)
  const currentSelectedCard = selectedCard
    ? Object.values(columns).flat().find(c => c.id === selectedCard.id) || null
    : null;

  if (!isHydrated) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columnConfig.map(({ id, title }) => (
          <div key={id} className="flex-1 min-w-[300px] max-w-[380px] bg-bg-secondary border border-border-subtle rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-border-default" />
              <h3 className="text-sm font-display font-medium text-text-primary tracking-tight">
                {title}
              </h3>
            </div>
            <div className="min-h-[250px] rounded-xl flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columnConfig.map(({ id, title }) => (
            <KanbanColumn
              key={id}
              columnId={id}
              title={title}
              cards={columns[id]}
              onAddCard={addCard}
              onUpdateCard={updateCard}
              onDeleteCard={deleteCard}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Card Detail Modal */}
      {currentSelectedCard && (
        <CardDetailModal
          card={currentSelectedCard}
          availableLabels={availableLabels}
          teamMembers={teamMembers}
          onClose={() => setSelectedCard(null)}
          onUpdate={updateCard}
          onDelete={deleteCard}
          onAddSubtask={addSubtask}
          onToggleSubtask={toggleSubtask}
          onDeleteSubtask={deleteSubtask}
          onAddTeamMember={addTeamMember}
        />
      )}
    </>
  );
}
