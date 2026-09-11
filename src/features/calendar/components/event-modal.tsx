'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, FormField, Alert } from '@/components/ui';
import type { CalendarEventWithRelations, CalendarColorTag } from '@/types/domain';
import {
  createCalendarEventAction,
  updateCalendarEventAction,
  deleteCalendarEventAction,
} from '../actions';
import { Clock, Calendar as CalendarIcon, Tag, Trash2, FolderKanban, Target, CheckSquare } from 'lucide-react';
import { getLocalHourAndMinute } from '@/lib/time';

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEventWithRelations | null;
  initialDateStr: string; // "YYYY-MM-DD"
  initialStartTimeStr?: string; // "HH:mm"
  timezone: string;
  projects?: Array<{ id: string; title: string }>;
  goals?: Array<{ id: string; title: string }>;
  tasks?: Array<{ id: string; title: string }>;
  onEventSaved: () => void;
}

const COLOR_OPTIONS: Array<{ value: CalendarColorTag; label: string; bg: string; border: string }> = [
  { value: 'gold', label: 'Gold', bg: 'bg-[#d4af37]', border: 'border-[#d4af37]' },
  { value: 'blue', label: 'Neutral Charcoal', bg: 'bg-zinc-400', border: 'border-zinc-400' },
  { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-500', border: 'border-amber-500' },
  { value: 'purple', label: 'Muted', bg: 'bg-zinc-500', border: 'border-zinc-500' },
  { value: 'rose', label: 'Urgent', bg: 'bg-rose-500', border: 'border-rose-500' },
];

export function EventModal(props: EventModalProps) {
  if (!props.isOpen) return null;
  return <EventModalContent {...props} />;
}

function EventModalContent({
  isOpen,
  onClose,
  eventToEdit,
  initialDateStr,
  initialStartTimeStr = '09:00',
  timezone,
  projects = [],
  goals = [],
  tasks = [],
  onEventSaved,
}: EventModalProps) {
  const [title, setTitle] = useState(() => (eventToEdit ? eventToEdit.title : ''));
  const [description, setDescription] = useState(() => (eventToEdit ? eventToEdit.description || '' : ''));
  const [date, setDate] = useState(() => initialDateStr);
  const [startTime, setStartTime] = useState(() => {
    if (eventToEdit) {
      const start = getLocalHourAndMinute(eventToEdit.start_time, timezone);
      const sh = String(start.hour).padStart(2, '0');
      const sm = String(start.minute).padStart(2, '0');
      return `${sh}:${sm}`;
    }
    return initialStartTimeStr || '09:00';
  });
  const [endTime, setEndTime] = useState(() => {
    if (eventToEdit) {
      const end = getLocalHourAndMinute(eventToEdit.end_time, timezone);
      const eh = String(end.hour).padStart(2, '0');
      const em = String(end.minute).padStart(2, '0');
      return `${eh}:${em}`;
    }
    const [h, m] = (initialStartTimeStr || '09:00').split(':').map((v) => parseInt(v, 10));
    const endHour = (h + 1) % 24;
    return `${String(endHour).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
  });
  const [colorTag, setColorTag] = useState<CalendarColorTag>(() =>
    eventToEdit ? eventToEdit.color_tag || 'gold' : 'gold'
  );
  const [projectId, setProjectId] = useState<string>(() =>
    eventToEdit ? eventToEdit.project_id || '' : ''
  );
  const [goalId, setGoalId] = useState<string>(() =>
    eventToEdit ? eventToEdit.goal_id || '' : ''
  );
  const [taskId, setTaskId] = useState<string>(() =>
    eventToEdit ? eventToEdit.task_id || '' : ''
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter an event title.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      local_date: date,
      local_start_time: startTime,
      local_end_time: endTime,
      timezone,
      color_tag: colorTag,
      project_id: projectId || null,
      goal_id: goalId || null,
      task_id: taskId || null,
    };

    if (eventToEdit) {
      const res = await updateCalendarEventAction(eventToEdit.id, payload);
      setIsLoading(false);
      if (res.success) {
        onEventSaved();
        onClose();
      } else {
        setError(res.error || 'Failed to update event.');
      }
    } else {
      const res = await createCalendarEventAction(payload);
      setIsLoading(false);
      if (res.success) {
        onEventSaved();
        onClose();
      } else {
        setError(res.error || 'Failed to create event.');
      }
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit) return;
    if (!window.confirm(`Are you sure you want to remove "${eventToEdit.title}"?`)) return;

    setIsDeleting(true);
    setError(null);
    const res = await deleteCalendarEventAction(eventToEdit.id);
    setIsDeleting(false);
    if (res.success) {
      onEventSaved();
      onClose();
    } else {
      setError(res.error || 'Failed to delete event.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Edit Calendar Event' : 'Add Calendar Event'}
      description={`Schedule your day in your profile timezone (${timezone}).`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <Alert variant="danger" title="Event Error">
            {error}
          </Alert>
        )}

        {/* Google Calendar Sync Indicator Banner */}
        {eventToEdit && (eventToEdit.is_external || eventToEdit.google_event_id) && (
          <div className="p-3 rounded-2xl bg-zinc-900 border border-[#d4af37]/30 text-xs text-zinc-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#d4af37]" />
              <span>
                {eventToEdit.is_external ? 'Imported from Google Calendar' : 'Synchronized with Google Calendar'}
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30">
              Google Sync
            </span>
          </div>
        )}

        {/* Title */}
        <FormField label="Event Title" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deep Work: Architecture Strategy"
            required
            autoFocus
            className="text-sm bg-zinc-900/90 border-white/[0.1] focus:border-[#d4af37]"
          />
        </FormField>

        {/* Date, Start Time, End Time in Equal-Width Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Date</span>
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full h-11 bg-zinc-900/90 border border-white/[0.1] rounded-xl px-3 text-xs text-zinc-200 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Start Time</span>
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full h-11 bg-zinc-900/90 border border-white/[0.1] rounded-xl px-3 text-xs text-zinc-200 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>End Time</span>
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full h-11 bg-zinc-900/90 border border-white/[0.1] rounded-xl px-3 text-xs text-zinc-200 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
            />
          </div>
        </div>

        {/* Color Accent Picker */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#d4af37]" />
            Color Tag
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColorTag(c.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                  colorTag === c.value
                    ? 'bg-zinc-800 border-[#d4af37] text-zinc-100 ring-1 ring-[#d4af37]/50 shadow-sm'
                    : 'bg-zinc-900/70 border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Linkage: Project, Goal, Task */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-[#d4af37]" />
                Linked Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-11 bg-zinc-900/90 border border-white/[0.1] rounded-xl px-3 text-xs text-zinc-200 focus:outline-none focus:border-[#d4af37]"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {goals.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#d4af37]" />
                Linked Goal (Optional)
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full h-11 bg-zinc-900/90 border border-white/[0.1] rounded-xl px-3 text-xs text-zinc-200 focus:outline-none focus:border-[#d4af37]"
              >
                <option value="">None</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {tasks.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[#d4af37]" />
              Linked Task / Commitment (Optional)
            </label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full h-11 bg-zinc-900/90 border border-white/[0.1] rounded-xl px-3 text-xs text-zinc-200 focus:outline-none focus:border-[#d4af37]"
            >
              <option value="">None</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold text-zinc-300">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Key objectives or notes for this scheduled block..."
            className="w-full bg-zinc-900/90 border border-white/[0.1] rounded-xl p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
          {eventToEdit ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={isDeleting}
              onClick={handleDelete}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isLoading}>
              {eventToEdit ? 'Save Changes' : 'Schedule Event'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
