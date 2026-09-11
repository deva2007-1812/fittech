import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Mic, MicOff, Utensils, Search, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/shared/Modal';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { MacroProgress } from '../../components/shared/MacroProgress';
import { nutritionService, type FoodSearchResult } from '../../services/nutritionService';
import { userService } from '../../services/userService';
import { getApiErrorMessage } from '../../services/api';
import type { FoodEntry, MealType, NutritionLog, DailyTargets } from '../../types';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  { value: 'snacks', label: 'Snacks', emoji: '🍎' },
];

function FoodCard({ entry, onDelete }: { entry: FoodEntry; onDelete: (id: string) => void }) {
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
    <div className="flex items-center gap-3 py-3 border-b border-neutral-50 last:border-0 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-800 truncate">{entry.foodName}</p>
        <p className="text-xs text-neutral-400">{entry.quantity}</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-neutral-500 flex-shrink-0">
        <span className="font-semibold text-neutral-800">{Math.round(entry.calories)} <span className="font-normal">kcal</span></span>
        <span className="hidden sm:inline text-emerald-600 font-medium">{Math.round(entry.protein)}g P</span>
        <span className="hidden sm:inline text-amber-600 font-medium">{Math.round(entry.carbs)}g C</span>
        <span className="hidden sm:inline text-purple-600 font-medium">{Math.round(entry.fat)}g F</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-all duration-150"
          aria-label={`Delete ${entry.foodName}`}
        >
          {isDeleting ? <LoadingSpinner size="sm" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

interface AddFoodFormData {
  foodName: string;
  quantity: string;
  mealType: MealType;
}

function AddFoodModal({
  isOpen,
  onClose,
  onEntriesAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onEntriesAdded: () => void;
}) {
  const [isVoice, setIsVoice] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<AddFoodFormData>({ foodName: '', quantity: '1 serving', mealType: 'breakfast' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmedFoods, setConfirmedFoods] = useState<FoodEntry[] | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Live Food Search Debounce
  useEffect(() => {
    if (!form.foodName.trim() || form.foodName.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await nutritionService.searchFoods(form.foodName);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [form.foodName]);

  // Speech Recognition setup
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser. You can type your meal description below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((r: any) => r[0].transcript)
          .join('');
        setVoiceText(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Voice input error. You can type your meal description.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      toast.error('Could not activate microphone');
      setIsListening(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.foodName.trim()) errs.foodName = 'Food name is required';
    if (!form.quantity.trim()) errs.quantity = 'Quantity is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    try {
      await nutritionService.addFoodEntry({
        foodName: form.foodName.trim(),
        quantity: form.quantity.trim(),
        mealType: form.mealType,
      });
      toast.success('Food logged! Backend calculated nutrition.');
      onEntriesAdded();
      onClose();
      setForm({ foodName: '', quantity: '1 serving', mealType: 'breakfast' });
      setSearchResults([]);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSubmit = async () => {
    if (!voiceText.trim()) return;
    setIsLoading(true);
    try {
      const loggedEntries = await nutritionService.analyzeFoodText(voiceText.trim());
      setConfirmedFoods(loggedEntries);
      toast.success(`Successfully analyzed and logged ${loggedEntries.length} item(s)!`);
      onEntriesAdded();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setConfirmedFoods(null);
    setVoiceText('');
    setForm({ foodName: '', quantity: '1 serving', mealType: 'breakfast' });
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Log Food" size="md">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setIsVoice(false); setConfirmedFoods(null); }}
          className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all', !isVoice ? 'bg-emerald-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700')}
        >
          <Search size={14} className="inline mr-1.5" /> Manual & Search
        </button>
        <button
          onClick={() => { setIsVoice(true); setConfirmedFoods(null); }}
          className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all', isVoice ? 'bg-emerald-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700')}
        >
          <Mic size={14} className="inline mr-1.5" /> Voice AI
        </button>
      </div>

      {confirmedFoods ? (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
            <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Food Logged to Database!</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Backend calculated the nutrition breakdown:</p>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {confirmedFoods.map((item, idx) => (
              <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">{item.foodName} ({item.quantity})</p>
                  <p className="text-neutral-500 dark:text-neutral-400 capitalize">{item.mealType}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">{Math.round(item.calories)} kcal</p>
                  <p className="text-neutral-500 dark:text-neutral-400">{Math.round(item.protein)}g P · {Math.round(item.carbs)}g C · {Math.round(item.fat)}g F</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={resetAndClose} className="btn-primary w-full">
            Done
          </button>
        </div>
      ) : isVoice ? (
        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 transition-all shadow-md',
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-600 text-white hover:bg-emerald-700'
              )}
              aria-label={isListening ? 'Stop listening' : 'Start speaking'}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <p className="text-sm font-semibold text-emerald-900">
              {isListening ? 'Listening… Speak now' : 'Click mic to speak, or type below'}
            </p>
            <p className="text-xs text-emerald-700 mt-1">e.g. "I had two idlis and a glass of milk"</p>
          </div>
          <textarea
            value={voiceText}
            onChange={e => setVoiceText(e.target.value)}
            placeholder='Type or speak your meal description here…'
            className="input resize-none h-24"
            aria-label="Voice input text"
          />
          <button
            onClick={handleVoiceSubmit}
            disabled={!voiceText.trim() || isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? <LoadingSpinner size="sm" label="Analyzing food with AI…" /> : 'Analyze & Log Food'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleManualAdd} className="space-y-4">
          <div className="input-group">
            <label className="label">Meal type</label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mealType: value }))}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium border transition-all',
                    form.mealType === value ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  )}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group relative">
            <label htmlFor="foodName" className="label">Food item name</label>
            <div className="relative">
              <input
                id="foodName"
                type="text"
                value={form.foodName}
                onChange={e => {
                  setForm(f => ({ ...f, foodName: e.target.value }));
                  setErrors(ev => ({ ...ev, foodName: '' }));
                }}
                className={`input pr-8 ${errors.foodName ? 'border-red-400' : ''}`}
                placeholder="e.g. Eggs, Chicken breast, Brown rice, Idli…"
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            {errors.foodName && <p className="text-xs text-red-500 mt-1">{errors.foodName}</p>}

            {/* Food Search Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const unit = (item.servingUnit || '').toLowerCase();
                      const isPiece = unit.includes('piece') || unit.includes('item') || unit.includes('slice') || unit.includes('egg');
                      setForm(f => ({
                        ...f,
                        foodName: item.name,
                        quantity: isPiece ? '1 piece' : `${item.servingSize}${item.servingUnit}`,
                      }));
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between text-xs border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-neutral-800 dark:text-neutral-200">{item.name}</p>
                      <p className="text-neutral-400 dark:text-neutral-500">{item.servingSize} {item.servingUnit}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round(item.calories)} kcal</span>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{Math.round(item.protein)}g P · {Math.round(item.carbohydrates)}g C</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="quantity" className="label">Quantity / Serving</label>
            <input
              id="quantity"
              type="text"
              value={form.quantity}
              onChange={e => {
                setForm(f => ({ ...f, quantity: e.target.value }));
                setErrors(ev => ({ ...ev, quantity: '' }));
              }}
              className={`input ${errors.quantity ? 'border-red-400' : ''}`}
              placeholder="e.g. 100g, 2 pieces, 1 cup, 1 bowl"
            />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
          </div>

          <p className="text-xs text-neutral-400">All nutrition and calorie metrics are calculated by the backend database.</p>
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? <LoadingSpinner size="sm" label="Logging food…" /> : 'Log Food to Database'}
          </button>
        </form>
      )}
    </Modal>
  );
}

export function NutritionPage() {
  const [log, setLog] = useState<NutritionLog | null>(null);
  const [targets, setTargets] = useState<DailyTargets | null>(null);
  const [activeTab, setActiveTab] = useState<MealType>('breakfast');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNutritionData = async () => {
    setIsLoading(true);
    try {
      const [todayLog, dailyTargets] = await Promise.all([
        nutritionService.getTodayLog(),
        userService.getDailyTargets().catch(() => ({
          calories: 2000,
          protein: 150,
          carbs: 250,
          fat: 55,
          water: 2500,
        })),
      ]);
      setLog(todayLog);
      setTargets(dailyTargets);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const totals = log?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const calTarget = targets?.calories || 2000;
  const pTarget = targets?.protein || 150;
  const cTarget = targets?.carbs || 250;
  const fTarget = targets?.fat || 55;

  const filteredEntries = (log?.entries || []).filter(e => {
    const m = (e.mealType || '').toLowerCase();
    const tab = activeTab.toLowerCase();
    return m === tab || (tab === 'snacks' && m === 'snack');
  });

  const handleDelete = async (id: string) => {
    try {
      await nutritionService.deleteFoodEntry(id);
      toast.success('Food entry removed');
      await fetchNutritionData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Nutrition</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Log Food
        </button>
      </div>

      {/* Daily Summary */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-neutral-900">
              {Math.round(totals.calories)} <span className="text-base font-normal text-neutral-400">kcal</span>
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">of {calTarget} kcal daily goal</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-neutral-700">
              {Math.max(0, calTarget - Math.round(totals.calories))} kcal
            </p>
            <p className="text-xs text-neutral-400">remaining</p>
          </div>
        </div>
        <div className="space-y-3">
          <MacroProgress label="Protein" current={Math.round(totals.protein)} target={pTarget} color="#10b981" />
          <MacroProgress label="Carbs" current={Math.round(totals.carbs)} target={cTarget} color="#f59e0b" />
          <MacroProgress label="Fat" current={Math.round(totals.fat)} target={fTarget} color="#8b5cf6" />
        </div>
        {/* Macro pills */}
        <div className="flex gap-3 pt-1">
          {[
            { label: 'Calories', value: `${Math.round(totals.calories)} kcal`, color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
            { label: 'Protein', value: `${Math.round(totals.protein)}g`, color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
            { label: 'Carbs', value: `${Math.round(totals.carbs)}g`, color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
            { label: 'Fat', value: `${Math.round(totals.fat)}g`, color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`flex-1 text-center py-2 rounded-xl ${color}`}>
              <p className="text-sm font-bold">{value}</p>
              <p className="text-[10px] font-medium opacity-75">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meal tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
        {MEAL_TYPES.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
              activeTab === value ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            )}
          >
            <span className="hidden sm:inline">{emoji} </span>{label}
          </button>
        ))}
      </div>

      {/* Food entries */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 capitalize">
            {MEAL_TYPES.find(m => m.value === activeTab)?.emoji} {MEAL_TYPES.find(m => m.value === activeTab)?.label}
          </h3>
          <button onClick={() => setShowModal(true)} className="btn-ghost text-xs py-1 px-2.5">
            <Plus size={14} /> Add
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading nutrition entries…" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            icon={<Utensils size={32} />}
            title={`No ${activeTab} logged yet`}
            description="Log your food to automatically track calories and macronutrients."
            action={<button onClick={() => setShowModal(true)} className="btn-primary text-xs">Log food</button>}
          />
        ) : (
          <div>
            {filteredEntries.map(entry => (
              <FoodCard key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100">
              <span className="text-xs font-medium text-neutral-500">Subtotal</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-neutral-800">
                  {Math.round(filteredEntries.reduce((s, e) => s + (e.calories || 0), 0))} kcal
                </span>
                <span className="text-emerald-600 font-medium hidden sm:inline">
                  {Math.round(filteredEntries.reduce((s, e) => s + (e.protein || 0), 0))}g P
                </span>
                <span className="text-amber-600 font-medium hidden sm:inline">
                  {Math.round(filteredEntries.reduce((s, e) => s + (e.carbs || 0), 0))}g C
                </span>
                <span className="text-purple-600 font-medium hidden sm:inline">
                  {Math.round(filteredEntries.reduce((s, e) => s + (e.fat || 0), 0))}g F
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddFoodModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onEntriesAdded={fetchNutritionData}
      />
    </div>
  );
}
