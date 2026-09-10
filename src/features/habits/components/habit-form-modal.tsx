'use client';

import React, { useState } from 'react';
import { HabitFrequency, HabitCategory, HabitTemplate, DailyHabitItem } from '@/lib/habits/types';
import { createHabitAction, updateHabitAction } from '../actions';
import {
  X,
  Repeat,
  Tag,
  Clock,
  Calendar,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialHabit?: DailyHabitItem | null;
  availableTasks: Array<{ id: string; title: string; priority: string; status: string }>;
  currentDateStr: string;
}

const WEEKDAYS = [
  { label: 'M', full: 'Mon', value: 1 },
  { label: 'T', full: 'Tue', value: 2 },
  { label: 'W', full: 'Wed', value: 3 },
  { label: 'T', full: 'Thu', value: 4 },
  { label: 'F', full: 'Fri', value: 5 },
  { label: 'S', full: 'Sat', value: 6 },
  { label: 'S', full: 'Sun', value: 0 },
];

const CATEGORY_PRESETS: HabitCategory[] = [
  'productivity',
  'health',
  'learning',
  'fitness',
  'mindset',
  'finance',
  'general',
];

function HabitFormModalContent({
  onClose,
  onSuccess,
  initialHabit,
  availableTasks,
  currentDateStr,
}: Omit<HabitFormModalProps, 'isOpen'>) {
  const isEditing = Boolean(initialHabit);
  const template: HabitTemplate | undefined = initialHabit?.template;

  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [frequencyType, setFrequencyType] = useState<HabitFrequency>(
    template?.frequency_type || 'daily'
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    template?.selected_days || [1, 2, 3, 4, 5]
  );
  const [intervalDays, setIntervalDays] = useState<number>(template?.interval_days || 2);
  const [targetTimeLocal, setTargetTimeLocal] = useState<string>(
    template?.target_time_local ? template.target_time_local.slice(0, 5) : ''
  );
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<string>(
    template?.target_duration_minutes ? String(template.target_duration_minutes) : ''
  );
  const [category, setCategory] = useState<HabitCategory>(template?.category || 'general');
  const [linkedTaskId, setLinkedTaskId] = useState<string>(template?.linked_task_id || '');
  const [startDate, setStartDate] = useState<string>(template?.start_date || currentDateStr);
  const [endDate, setEndDate] = useState<string>(template?.end_date || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Habit name is required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      frequencyType,
      selectedDays: frequencyType === 'selected_days' ? selectedDays : [],
      intervalDays: frequencyType === 'custom_interval' ? intervalDays : 1,
      targetTimeLocal: targetTimeLocal.trim() ? targetTimeLocal.trim() : undefined,
      targetDurationMinutes: targetDurationMinutes ? parseInt(targetDurationMinutes, 10) : undefined,
      category,
      linkedTaskId: linkedTaskId || undefined,
      startDate: startDate || currentDateStr,
      endDate: endDate || undefined,
    };

    let res;
    if (isEditing && template) {
      res = await updateHabitAction({
        id: template.id,
        ...payload,
      });
    } else {
      res = await createHabitAction(payload);
    }

    setIsLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to save habit template.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#121217] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">
              {isEditing ? 'Edit Habit' : 'Create Recurring Habit'}
            </h2>
            <p className="text-xs text-zinc-400">
              Deterministic, streak-tracked behavioral commitment
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Habit Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Read 20 pages, Exercise, Practice DSA"
              maxLength={100}
              required
              className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Description / Intention
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this habit matters, rules of completion..."
              rows={2}
              maxLength={500}
              className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] resize-none"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Recurrence Frequency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'daily', label: 'Daily' },
                { id: 'weekdays', label: 'Weekdays (M–F)' },
                { id: 'selected_days', label: 'Custom Days' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'custom_interval', label: 'Interval (Days)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFrequencyType(opt.id as HabitFrequency)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-center ${
                    frequencyType === opt.id
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f3e198]'
                      : 'bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Weekdays Picker */}
          {frequencyType === 'selected_days' && (
            <div className="p-3 bg-zinc-900/50 border border-white/[0.06] rounded-xl">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Active Days
              </label>
              <div className="flex justify-between gap-1">
                {WEEKDAYS.map((wd) => {
                  const active = selectedDays.includes(wd.value);
                  return (
                    <button
                      key={wd.full}
                      type="button"
                      onClick={() => toggleDay(wd.value)}
                      className={`w-9 h-9 rounded-lg text-xs font-semibold border flex items-center justify-center transition-all ${
                        active
                          ? 'bg-[#d4af37] text-black border-[#e2c056]'
                          : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {wd.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Interval */}
          {frequencyType === 'custom_interval' && (
            <div className="p-3 bg-zinc-900/50 border border-white/[0.06] rounded-xl flex items-center gap-3">
              <label className="text-xs text-zinc-300">Repeat every</label>
              <input
                type="number"
                min={2}
                max={365}
                value={intervalDays}
                onChange={(e) => setIntervalDays(Math.max(2, parseInt(e.target.value, 10) || 2))}
                className="w-20 bg-zinc-900 border border-white/[0.1] rounded-lg px-2.5 py-1 text-sm text-center text-zinc-100"
              />
              <span className="text-xs text-zinc-300">days</span>
            </div>
          )}

          {/* Target Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" /> Target Time
              </label>
              <input
                type="time"
                value={targetTimeLocal}
                onChange={(e) => setTargetTimeLocal(e.target.value)}
                className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Target Minutes
              </label>
              <input
                type="number"
                min={1}
                max={720}
                value={targetDurationMinutes}
                onChange={(e) => setTargetDurationMinutes(e.target.value)}
                placeholder="e.g., 30"
                className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3 text-zinc-500" /> Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCategory(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-all border ${
                    category === preset
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f3e198] font-medium'
                      : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700/50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Link to Task */}
          {availableTasks.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-[#d4af37]" /> Optional Linked Task
              </label>
              <select
                value={linkedTaskId}
                onChange={(e) => setLinkedTaskId(e.target.value)}
                className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#d4af37]"
              >
                <option value="">-- No linked task --</option>
                {availableTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.priority})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start and End Date */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-500" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#d4af37] text-black hover:bg-[#e2c056] shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 transition-all"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function HabitFormModal(props: HabitFormModalProps) {
  if (!props.isOpen) return null;
  return (
    <HabitFormModalContent
      key={props.initialHabit?.template.id || 'new-habit'}
      {...props}
    />
  );
}
