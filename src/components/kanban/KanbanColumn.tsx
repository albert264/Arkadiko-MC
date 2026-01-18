'use client';

import { Droppable } from '@hello-pangea/dnd';
import { KanbanCard as KanbanCardType, KanbanStatus } from '@/types';
import { KanbanCard } from './KanbanCard';
import { AddCardForm } from './AddCardForm';
import { cn } from '@/lib/utils';
import { NewCardData, CardUpdateData } from '@/hooks/useKanban';

interface KanbanColumnProps {
  columnId: KanbanStatus;
  title: string;
  cards: KanbanCardType[];
  onAddCard: (columnId: KanbanStatus, data: NewCardData) => void;
  onUpdateCard: (id: string, updates: CardUpdateData) => void;
  onDeleteCard: (id: string) => void;
  onCardClick: (card: KanbanCardType) => void;
}

const columnStyles: Record<KanbanStatus, { dot: string; count: string; label: string; dropBg: string }> = {
  'todo': {
    dot: 'bg-status-todo',
    count: 'text-status-todo bg-status-todo/10',
    label: 'text-status-todo',
    dropBg: 'bg-status-todo/5'
  },
  'in-progress': {
    dot: 'bg-status-progress',
    count: 'text-status-progress bg-status-progress/10',
    label: 'text-status-progress',
    dropBg: 'bg-status-progress/5'
  },
  'complete': {
    dot: 'bg-status-complete',
    count: 'text-status-complete bg-status-complete/10',
    label: 'text-status-complete',
    dropBg: 'bg-status-complete/5'
  },
  'archive': {
    dot: 'bg-gray-400',
    count: 'text-gray-500 bg-gray-100',
    label: 'text-gray-500',
    dropBg: 'bg-gray-50'
  }
};

export function KanbanColumn({
  columnId,
  title,
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onCardClick
}: KanbanColumnProps) {
  const styles = columnStyles[columnId];
  const isArchive = columnId === 'archive';

  return (
    <div className={cn(
      "flex-1 min-w-[300px] bg-bg-secondary border border-border-subtle rounded-2xl p-4",
      isArchive ? "max-w-[280px] opacity-80 bg-bg-tertiary/50" : "max-w-[380px]"
    )}>
      {/* Column Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className={cn(
          'w-2.5 h-2.5 rounded-full status-dot',
          styles.dot,
          columnId === 'in-progress' && 'active'
        )} />
        <h3 className="text-sm font-display font-medium text-text-primary tracking-tight">
          {title}
        </h3>
        <span className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full',
          styles.count
        )}>
          {cards.length}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'min-h-[250px] rounded-xl transition-all duration-200',
              snapshot.isDraggingOver
                ? cn('bg-accent/5 ring-2 ring-accent/20 ring-inset')
                : ''
            )}
          >
            {cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={card}
                index={index}
                onUpdate={onUpdateCard}
                onDelete={onDeleteCard}
                onClick={() => onCardClick(card)}
              />
            ))}
            {provided.placeholder}

            {/* Add Card Form - not shown for archive */}
            {!isArchive && (
              <AddCardForm columnId={columnId} onAdd={onAddCard} />
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
