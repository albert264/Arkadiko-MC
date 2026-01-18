'use client';

import { useState, useEffect } from 'react';
import {
  KanbanCard,
  Priority,
  Assignee,
  Label,
  Subtask,
  PRIORITY_CONFIG
} from '@/types';
import { cn } from '@/lib/utils';
import { CardUpdateData } from '@/hooks/useKanban';

interface CardDetailModalProps {
  card: KanbanCard;
  availableLabels: Label[];
  teamMembers: Assignee[];
  onClose: () => void;
  onUpdate: (cardId: string, updates: CardUpdateData) => void;
  onDelete: (cardId: string) => void;
  onAddSubtask: (cardId: string, text: string) => void;
  onToggleSubtask: (cardId: string, subtaskId: string) => void;
  onDeleteSubtask: (cardId: string, subtaskId: string) => void;
  onAddTeamMember: (name: string) => Assignee;
}

export function CardDetailModal({
  card,
  availableLabels,
  teamMembers,
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onAddTeamMember
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState<Priority>(card.priority || 'medium');
  const [selectedAssignees, setSelectedAssignees] = useState<Assignee[]>(card.assignees || []);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>(card.labels || []);
  const [dueDate, setDueDate] = useState(card.dueDate || '');

  // Handle old cards without subtasks
  const subtasks = card.subtasks || [];
  const [newSubtask, setNewSubtask] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);

  // Save changes when values change
  useEffect(() => {
    const timeout = setTimeout(() => {
      onUpdate(card.id, {
        title,
        description: description || undefined,
        priority,
        assignees: selectedAssignees,
        labels: selectedLabels,
        dueDate: dueDate || undefined
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [title, description, priority, selectedAssignees, selectedLabels, dueDate, card.id, onUpdate]);

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      onAddSubtask(card.id, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const toggleAssignee = (assignee: Assignee) => {
    setSelectedAssignees(prev =>
      prev.some(a => a.id === assignee.id)
        ? prev.filter(a => a.id !== assignee.id)
        : [...prev, assignee]
    );
  };

  const toggleLabel = (label: Label) => {
    setSelectedLabels(prev =>
      prev.some(l => l.id === label.id)
        ? prev.filter(l => l.id !== label.id)
        : [...prev, label]
    );
  };

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      const newMember = onAddTeamMember(newMemberName.trim());
      setSelectedAssignees(prev => [...prev, newMember]);
      setNewMemberName('');
    }
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const totalSubtasks = subtasks.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-secondary rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border-subtle">
          <div className="flex-1 pr-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-display font-semibold text-text-primary bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="Card title"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Priority</label>
            <div className="flex gap-2">
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-all btn-press',
                    priority === p
                      ? 'ring-2 ring-offset-2 ring-accent'
                      : 'hover:opacity-80'
                  )}
                  style={{
                    backgroundColor: PRIORITY_CONFIG[p].bgColor,
                    color: PRIORITY_CONFIG[p].color
                  }}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Assignees</label>
            <div className="relative">
              <button
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left bg-bg-tertiary border border-border-subtle rounded-lg hover:border-border transition-colors"
              >
                {selectedAssignees.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedAssignees.map(a => (
                      <span key={a.id} className="px-2 py-0.5 bg-accent-subtle text-accent text-sm rounded-full">
                        {a.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-text-muted text-sm">Add assignees...</span>
                )}
              </button>

              {showAssigneeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-subtle rounded-lg shadow-lg z-10 p-2">
                  {teamMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => toggleAssignee(member)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                        selectedAssignees.some(a => a.id === member.id)
                          ? 'bg-accent-subtle text-accent'
                          : 'hover:bg-bg-tertiary text-text-primary'
                      )}
                    >
                      <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                      {member.name}
                      {selectedAssignees.some(a => a.id === member.id) && (
                        <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-border-subtle mt-2 pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                        placeholder="Add new member..."
                        className="flex-1 px-3 py-1.5 text-sm bg-bg-tertiary border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
                      />
                      <button
                        onClick={handleAddMember}
                        disabled={!newMemberName.trim()}
                        className="px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Labels</label>
            <div className="relative">
              <button
                onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left bg-bg-tertiary border border-border-subtle rounded-lg hover:border-border transition-colors"
              >
                {selectedLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedLabels.map(l => (
                      <span
                        key={l.id}
                        className="px-2 py-0.5 text-white text-sm rounded-full"
                        style={{ backgroundColor: l.color }}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-text-muted text-sm">Add labels...</span>
                )}
              </button>

              {showLabelDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-subtle rounded-lg shadow-lg z-10 p-2">
                  {availableLabels.map(label => (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                        selectedLabels.some(l => l.id === label.id)
                          ? 'bg-bg-tertiary'
                          : 'hover:bg-bg-tertiary'
                      )}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-text-primary">{label.name}</span>
                      {selectedLabels.some(l => l.id === label.id) && (
                        <svg className="w-4 h-4 ml-auto text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-subtle rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none resize-none"
            />
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">Subtasks</label>
              {totalSubtasks > 0 && (
                <span className="text-xs text-text-muted">
                  {completedSubtasks}/{totalSubtasks} completed
                </span>
              )}
            </div>

            {/* Progress bar */}
            {totalSubtasks > 0 && (
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-status-complete transition-all duration-300"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
            )}

            {/* Subtask list */}
            <div className="space-y-1 mb-3">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="group flex items-center gap-2 py-1.5">
                  <button
                    onClick={() => onToggleSubtask(card.id, subtask.id)}
                    className={cn(
                      'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
                      subtask.completed
                        ? 'bg-status-complete border-status-complete'
                        : 'border-border-default hover:border-accent'
                    )}
                  >
                    {subtask.completed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={cn(
                    'flex-1 text-sm',
                    subtask.completed ? 'text-text-muted line-through' : 'text-text-primary'
                  )}>
                    {subtask.text}
                  </span>
                  <button
                    onClick={() => onDeleteSubtask(card.id, subtask.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-500 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add a subtask..."
                className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtask.trim()}
                className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors btn-press"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border-subtle bg-bg-tertiary/50">
          <button
            onClick={() => {
              onDelete(card.id);
              onClose();
            }}
            className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete card
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors btn-press"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
