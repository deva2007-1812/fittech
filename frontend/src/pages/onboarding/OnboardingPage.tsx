import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { getApiErrorMessage } from '../../services/api';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { ACTIVITY_LABELS, GOAL_LABELS } from '../../utils/helpers';
import type { ActivityLevel, FitnessGoal } from '../../types';
import toast from 'react-hot-toast';

interface ProfileForm {
  age: string;
  height: string;
  weight: string;
  activityLevel: ActivityLevel | '';
  fitnessGoal: FitnessGoal | '';
}

const STEPS = ['Personal Info', 'Activity Level', 'Fitness Goal'] as const;

const ACTIVITY_OPTIONS: ActivityLevel[] = [
  'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'
];

const GOAL_OPTIONS: { value: FitnessGoal; emoji: string; desc: string }[] = [
  { value: 'maintain_weight', emoji: '⚖️', desc: 'Keep your current weight stable' },
  { value: 'improve_fitness', emoji: '🏃', desc: 'Build strength, endurance & energy' },
  { value: 'weight_management', emoji: '📈', desc: 'Make gradual, healthy changes' },
];

export function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    age: '',
    height: '',
    weight: '',
    activityLevel: '',
    fitnessGoal: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 13 || Number(form.age) > 100) e.age = 'Please enter a valid age (13–100)';
      if (!form.height || isNaN(Number(form.height)) || Number(form.height) < 100 || Number(form.height) > 250) e.height = 'Enter height in cm (100–250)';
      if (!form.weight || isNaN(Number(form.weight)) || Number(form.weight) < 30 || Number(form.weight) > 300) e.weight = 'Enter weight in kg (30–300)';
    }
    if (step === 1 && !form.activityLevel) e.activityLevel = 'Please select your activity level';
    if (step === 2 && !form.fitnessGoal) e.fitnessGoal = 'Please select a fitness goal';
    return e;
  };

  const next = () => {
    const errs = validateStep();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const updated = await userService.completeOnboarding({
        age: Number(form.age),
        height: Number(form.height),
        weight: Number(form.weight),
        activityLevel: form.activityLevel as ActivityLevel,
        fitnessGoal: form.fitnessGoal as FitnessGoal,
        profileComplete: true,
      });
      updateUser(updated);
      toast.success('Profile saved! Welcome to FitMind AI 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">Let's personalize your experience. This takes about 2 minutes.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                  i < step ? 'bg-emerald-600 text-white' :
                  i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60' :
                  'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500'
                }`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium hidden sm:block">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${i < step ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-800'}`} style={{ maxWidth: '60px' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="card p-8 animate-slide-up">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">Personal Information</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Help us calculate your personalized targets.</p>
              </div>
              <div className="input-group">
                <label htmlFor="age" className="label">Age <span className="text-neutral-400 font-normal">(years)</span></label>
                <input id="age" type="number" min={13} max={100} value={form.age}
                  onChange={e => { setForm(f => ({ ...f, age: e.target.value })); setErrors(ev => ({ ...ev, age: '' })); }}
                  className={`input ${errors.age ? 'border-red-400' : ''}`} placeholder="e.g. 28" />
                {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label htmlFor="height" className="label">Height <span className="text-neutral-400 font-normal">(cm)</span></label>
                  <input id="height" type="number" min={100} max={250} value={form.height}
                    onChange={e => { setForm(f => ({ ...f, height: e.target.value })); setErrors(ev => ({ ...ev, height: '' })); }}
                    className={`input ${errors.height ? 'border-red-400' : ''}`} placeholder="e.g. 170" />
                  {errors.height && <p className="text-xs text-red-500 mt-1">{errors.height}</p>}
                </div>
                <div className="input-group">
                  <label htmlFor="weight" className="label">Weight <span className="text-neutral-400 font-normal">(kg)</span></label>
                  <input id="weight" type="number" min={30} max={300} step={0.1} value={form.weight}
                    onChange={e => { setForm(f => ({ ...f, weight: e.target.value })); setErrors(ev => ({ ...ev, weight: '' })); }}
                    className={`input ${errors.weight ? 'border-red-400' : ''}`} placeholder="e.g. 70" />
                  {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">Activity Level</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">How active are you on a typical week?</p>
              </div>
              {errors.activityLevel && <p className="text-xs text-red-500">{errors.activityLevel}</p>}
              <div className="space-y-2">
                {ACTIVITY_OPTIONS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, activityLevel: level })); setErrors(ev => ({ ...ev, activityLevel: '' })); }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-150 ${
                      form.activityLevel === level
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      form.activityLevel === level ? 'border-emerald-500' : 'border-neutral-300 dark:border-neutral-600'
                    }`}>
                      {form.activityLevel === level && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <span className="text-sm font-medium">{ACTIVITY_LABELS[level]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">Fitness Goal</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">What's your primary focus right now?</p>
              </div>
              {errors.fitnessGoal && <p className="text-xs text-red-500">{errors.fitnessGoal}</p>}
              <div className="space-y-3">
                {GOAL_OPTIONS.map(({ value, emoji, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, fitnessGoal: value })); setErrors(ev => ({ ...ev, fitnessGoal: '' })); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
                      form.fitnessGoal === value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className={`text-sm font-semibold ${form.fitnessGoal === value ? 'text-emerald-800 dark:text-emerald-300' : 'text-neutral-800 dark:text-neutral-200'}`}>
                        {GOAL_LABELS[value]}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{desc}</p>
                    </div>
                    {form.fitnessGoal === value && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <button onClick={next} disabled={isLoading} className="btn-primary px-8">
            {isLoading ? <LoadingSpinner size="sm" /> : step === STEPS.length - 1 ? 'Finish setup' : <>Next <ChevronRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
