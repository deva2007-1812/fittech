import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Dumbbell, Clock } from 'lucide-react';
import { Modal } from '../../components/shared/Modal';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { workoutService } from '../../services/workoutService';
import { getApiErrorMessage } from '../../services/api';
import { formatDuration, getLocalDateString } from '../../utils/helpers';
import type { WorkoutEntry } from '../../types';
import toast from 'react-hot-toast';

interface WorkoutForm {
  exercise: string;
  duration: string;
  sets: string;
  reps: string;
  notes: string;
}

function WorkoutCard({ entry, onDelete }: { entry: WorkoutEntry; onDelete: (id: string) => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-all group">
      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center flex-shrink-0">
        <Dumbbell size={18} className="text-purple-600 dark:text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{entry.exercise}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
            <Clock size={11} /> {formatDuration(entry.duration)}
          </span>
          {entry.sets && <span className="text-xs text-neutral-400 dark:text-neutral-500">{entry.sets} sets</span>}
          {entry.reps && <span className="text-xs text-neutral-400 dark:text-neutral-500">× {entry.reps} reps</span>}
        </div>
        {entry.notes && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 italic">{entry.notes}</p>}
      </div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-500 transition-all"
        aria-label={`Delete ${entry.exercise}`}
      >
        {isDeleting ? <LoadingSpinner size="sm" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}

export function WorkoutPage() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<WorkoutForm>({ exercise: '', duration: '', sets: '', reps: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchWorkouts = async () => {
    try {
      const data = await workoutService.getTodayWorkouts();
      setWorkouts(data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const totalDuration = workouts.reduce((s, w) => s + (w.duration || 0), 0);

  const handleDelete = async (id: string) => {
    try {
      await workoutService.deleteWorkout(id);
      toast.success('Workout removed');
      await fetchWorkouts();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.exercise.trim()) errs.exercise = 'Exercise name is required';
    if (!form.duration || isNaN(Number(form.duration)) || Number(form.duration) <= 0) {
      errs.duration = 'Enter a valid duration in minutes';
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSubmitting(true);
    try {
      await workoutService.addWorkout({
        exercise: form.exercise.trim(),
        duration: Number(form.duration),
        sets: form.sets ? Number(form.sets) : undefined,
        reps: form.reps ? Number(form.reps) : undefined,
        notes: form.notes.trim() || undefined,
        date: getLocalDateString(),
      });
      toast.success('Workout logged to database!');
      setShowModal(false);
      setForm({ exercise: '', duration: '', sets: '', reps: '', notes: '' });
      await fetchWorkouts();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const QUICK_EXERCISES = ['Running', 'Cycling', 'Swimming', 'Push-ups', 'Squats', 'Yoga', 'HIIT', 'Walking'];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Workout</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Track your exercises and stay active</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Log Workout
        </button>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Time', value: totalDuration > 0 ? formatDuration(totalDuration) : '—', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40' },
          { label: 'Exercises', value: workouts.length.toString(), color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40' },
          { label: 'Calories Burned', value: `${Math.round(totalDuration * 7)} kcal (est)`, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card p-4 text-center ${bg}`}>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Workouts list */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Today's Exercises</h3>
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading workouts…" />
          </div>
        ) : workouts.length === 0 ? (
          <EmptyState
            icon={<Dumbbell size={32} />}
            title="No workouts logged today"
            description="Log your workout session to track your active minutes and calories."
            action={<button onClick={() => setShowModal(true)} className="btn-primary text-xs">Log a workout</button>}
          />
        ) : (
          <div className="space-y-2">
            {workouts.map(w => (
              <WorkoutCard key={w.id} entry={w} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Workout" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <p className="label mb-2">Quick select</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EXERCISES.map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, exercise: ex }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    form.exercise === ex
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="exercise" className="label">Exercise name</label>
            <input
              id="exercise"
              type="text"
              value={form.exercise}
              onChange={e => {
                setForm(f => ({ ...f, exercise: e.target.value }));
                setErrors(ev => ({ ...ev, exercise: '' }));
              }}
              className={`input ${errors.exercise ? 'border-red-400' : ''}`}
              placeholder="e.g. Bench press, 5k run"
            />
            {errors.exercise && <p className="text-xs text-red-500 mt-1">{errors.exercise}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="input-group">
              <label htmlFor="duration" className="label">Duration <span className="text-neutral-400">(min)</span></label>
              <input
                id="duration"
                type="number"
                min={1}
                max={1440}
                value={form.duration}
                onChange={e => {
                  setForm(f => ({ ...f, duration: e.target.value }));
                  setErrors(ev => ({ ...ev, duration: '' }));
                }}
                className={`input ${errors.duration ? 'border-red-400' : ''}`}
                placeholder="30"
              />
              {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
            </div>

            <div className="input-group">
              <label htmlFor="sets" className="label">Sets <span className="text-neutral-400">(opt)</span></label>
              <input
                id="sets"
                type="number"
                min={1}
                value={form.sets}
                onChange={e => setForm(f => ({ ...f, sets: e.target.value }))}
                className="input"
                placeholder="3"
              />
            </div>

            <div className="input-group">
              <label htmlFor="reps" className="label">Reps <span className="text-neutral-400">(opt)</span></label>
              <input
                id="reps"
                type="number"
                min={1}
                value={form.reps}
                onChange={e => setForm(f => ({ ...f, reps: e.target.value }))}
                className="input"
                placeholder="10"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="notes" className="label">Notes <span className="text-neutral-400">(optional)</span></label>
            <input
              id="notes"
              type="text"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input"
              placeholder="e.g. felt strong today, increased weight"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? <LoadingSpinner size="sm" label="Saving workout…" /> : 'Save Workout'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
