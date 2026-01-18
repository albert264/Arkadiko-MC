'use client';

import { Draggable } from '@hello-pangea/dnd';
import { KanbanCard as KanbanCardType, PRIORITY_CONFIG } from '@/types';
import { cn } from '@/lib/utils';
import { CardUpdateData } from '@/hooks/useKanban';

interface KanbanCardProps {
  card: KanbanCardType;
  index: number;
  onUpdate: (id: string, updates: CardUpdateData) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}

export function KanbanCard({ card, index, onClick }: KanbanCardProps) {
  // Handle cards from old data that might not have new fields
  const priority = card.priority || 'medium';
  const subtasks = card.subtasks || [];
  const labels = card.labels || [];
  const assignees = card.assignees || [];

  const priorityConfig = PRIORITY_CONFIG[priority];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const totalSubtasks = subtasks.length;

  // Check if due date is past
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && card.status !== 'complete';

  // Format due date
  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            'group bg-bg-secondary border border-border-subtle rounded-xl p-4 mb-3 cursor-pointer',
            'transition-all duration-200 card-lift',
            'hover:border-border hover:shadow-card',
            snapshot.isDragging && 'shadow-lg border-accent rotate-1 scale-[1.02]'
          )}
        >
          {/* Labels */}
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {labels.map(label => (
                <span
                  key={label.id}
                  className="px-2 py-0.5 text-xs font-medium text-white rounded-full"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <p className="text-sm text-text-primary font-medium leading-relaxed">
            {card.title}
          </p>

          {/* Description preview */}
          {card.description && (
            <p className="mt-1.5 text-xs text-text-muted line-clamp-2">
              {card.description}
            </p>
          )}

          {/* Meta info row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Priority badge */}
            <span
              className="px-2 py-0.5 text-xs font-medium rounded"
              style={{
                backgroundColor: priorityConfig.bgColor,
                color: priorityConfig.color
              }}
            >
              {priorityConfig.label}
            </span>

            {/* Due date */}
            {card.dueDate && (
              <span className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue ? 'text-red-500' : 'text-text-muted'
              )}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDueDate(card.dueDate)}
              </span>
            )}

            {/* Subtasks progress */}
            {totalSubtasks > 0 && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </div>

          {/* Assignees */}
          {assignees.length > 0 && (
            <div className="flex items-center gap-1 mt-3">
              <div className="flex -space-x-2">
                {assignees.slice(0, 3).map((assignee, i) => (
                  <div
                    key={assignee.id}
                    className="w-6 h-6 rounded-full bg-accent/20 border-2 border-bg-secondary flex items-center justify-center text-xs font-medium text-accent"
                    style={{ zIndex: 3 - i }}
                    title={assignee.name}
                  >
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {assignees.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-bg-tertiary border-2 border-bg-secondary flex items-center justify-center text-xs font-medium text-text-muted">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
