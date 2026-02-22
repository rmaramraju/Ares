
import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutDay, Exercise, SetType, Routine, ExerciseMetadata } from './types';
import { EXERCISE_DIRECTORY } from './exerciseDirectory';
import { Card } from './components/Card';
import { 
  Plus, 
  Trash2, 
  X, 
  Save, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  Library, 
  Globe, 
  Crown, 
  User, 
  Play, 
  Search, 
  Settings2,
  Check,
  Dumbbell,
  AlertCircle,
  Clock,
  MoveUp,
  MoveDown,
  AlertTriangle,
  Youtube,
  Zap
} from 'lucide-react';
import { HapticService } from './hapticService.ts';

interface WorkoutEditorProps {
  routines: Routine[];
  activeRoutineId: string | null;
  startDate: string;
  userExercises?: ExerciseMetadata[];
  onSave: (routines: Routine[], activeId: string, effectiveDate: string, durationMonths?: number) => void;
  onCancel: () => void;
}

const ARCHIVE_SPLITS: Routine[] = [
  {
    id: 'arc-1',
    name: 'ARES PRIME PROTOCOL',
    creator: 'Ares',
    isOfficial: true,
    description: 'The ultimate Ares Prime blueprint. Optimized for aesthetic flow, high-density leg loading, and specific anterior chain volume.',
    days: [
      { id: 'arc1-d1', dayName: 'DAY 1', focus: 'Legs (Quads)', exercises: [
        { name: 'Front Squat', sets: 4, reps: '8-10', instructions: '', category: 'Compound', setConfigs: [SetType.NORMAL, SetType.NORMAL, SetType.NORMAL, SetType.FAILURE] }
      ] },
      { id: 'arc1-d2', dayName: 'DAY 2', focus: 'Chest/Triceps', exercises: [
        { name: 'Incline Bench Press', sets: 4, reps: '10-12', instructions: '', category: 'Compound', setConfigs: [SetType.NORMAL, SetType.NORMAL, SetType.NORMAL, SetType.DROPSET] }
      ] },
      { id: 'arc1-d3', dayName: 'DAY 3', focus: 'Back/Rear Delts', exercises: [
        { name: 'Deadlift', sets: 3, reps: '5-8', instructions: '', category: 'Compound' }
      ] }
    ]
  },
  {
    id: 'arc-2',
    name: 'ARNOLD GOLDEN ERA',
    creator: 'Arnold Schwarzenegger',
    isOfficial: true,
    description: 'High-frequency double-split principles. Focused on extreme high-volume hypertrophy and deep peak contraction.',
    days: [
      { id: 'arc2-d1', dayName: 'DAY 1', focus: 'Chest/Back', exercises: [
        { name: 'Incline Bench Press', sets: 5, reps: '10-15', instructions: '', category: 'Compound' }
      ] },
      { id: 'arc2-d2', dayName: 'DAY 2', focus: 'Arms/Shoulders', exercises: [
        { name: 'Bicep Curls', sets: 4, reps: '12-20', instructions: '', category: 'Isolation' },
        { name: 'Lateral Raises', sets: 4, reps: '15-20', instructions: '', category: 'Isolation' }
      ] }
    ]
  },
  {
    id: 'arc-3',
    name: 'DORIAN BLOOD & GUTS',
    creator: 'Dorian Yates',
    isOfficial: true,
    description: 'Extreme intensity HIT (High Intensity Training). One set to absolute failure. Minimal volume, maximal neural stress.',
    days: [
      { id: 'arc3-d1', dayName: 'DAY 1', focus: 'Chest/Biceps', exercises: [
        { name: 'Incline Bench Press', sets: 2, reps: '6-8 to failure', instructions: '', category: 'Compound', setConfigs: [SetType.NORMAL, SetType.FAILURE] }
      ] },
      { id: 'arc3-d2', dayName: 'DAY 2', focus: 'Back', exercises: [
        { name: 'Deadlift', sets: 1, reps: 'MAX', instructions: '', category: 'Compound', setConfigs: [SetType.FAILURE] }
      ] }
    ]
  }
];

export const WorkoutEditor: React.FC<WorkoutEditorProps> = ({ routines, activeRoutineId, startDate, userExercises = [], onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'MY_LIBRARY' | 'ARCHIVE'>('MY_LIBRARY');
  const [localRoutines, setLocalRoutines] = useState<Routine[]>(() => routines.map(r => JSON.parse(JSON.stringify(r))));
  const [currentActiveId, setCurrentActiveId] = useState(activeRoutineId || (routines[0]?.id || ''));
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [effectiveDate, setEffectiveDate] = useState(startDate);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [planDuration, setPlanDuration] = useState(3);
  const [customDuration, setCustomDuration] = useState('');
  
  const [showDirectory, setShowDirectory] = useState<{ routineId: string; dayId: string; supersetWithIndex?: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const mergedDirectory = useMemo(() => [...EXERCISE_DIRECTORY, ...userExercises], [userExercises]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(localRoutines) !== JSON.stringify(routines) || 
           currentActiveId !== activeRoutineId || 
           effectiveDate !== startDate;
  }, [localRoutines, routines, currentActiveId, activeRoutineId, effectiveDate, startDate]);

  const categories = useMemo(() => {
    const cats = new Set(mergedDirectory.map(ex => ex.category));
    return Array.from(cats).sort();
  }, [mergedDirectory]);

  const createDefaultExercise = (): Exercise => {
    const meta = mergedDirectory[0];
    return {
      name: meta.name,
      sets: 3,
      reps: '10-12',
      instructions: 'Technical integrity priority.',
      category: meta.category,
      metadata: meta,
      setConfigs: Array.from({ length: 3 }, () => SetType.NORMAL)
    };
  };

  const addNewRoutine = () => {
    HapticService.selection();
    const newDay: WorkoutDay = {
      id: 'day-' + Date.now(),
      dayName: 'DAY 1',
      focus: 'BASE RECRUITMENT',
      exercises: [createDefaultExercise()]
    };
    const newR: Routine = {
      id: 'user-' + Date.now(),
      name: 'NEW PROTOCOL',
      creator: 'User',
      days: [newDay]
    };
    setLocalRoutines([...localRoutines, newR]);
    setEditingRoutineId(newR.id);
    setEditingDayId(newDay.id);
  };

  const importRoutine = (routine: Routine) => {
    HapticService.notificationSuccess();
    const newR = { ...JSON.parse(JSON.stringify(routine)), id: 'imp-' + Date.now(), creator: 'User' };
    setLocalRoutines([...localRoutines, newR]);
    setActiveTab('MY_LIBRARY');
    setEditingRoutineId(newR.id);
  };

  const deleteRoutine = (id: string) => {
    HapticService.impactHeavy();
    const filtered = localRoutines.filter(r => r.id !== id);
    setLocalRoutines(filtered);
    if (currentActiveId === id && filtered.length > 0) {
      setCurrentActiveId(filtered[0].id);
    }
  };

  const updateRoutineField = (id: string, field: keyof Routine, value: any) => {
    setLocalRoutines(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addDay = (routineId: string) => {
    HapticService.selection();
    setLocalRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      const newDay: WorkoutDay = {
        id: 'day-' + Date.now(),
        dayName: `DAY ${r.days.length + 1}`,
        focus: 'SPECIFIC FOCUS',
        exercises: [createDefaultExercise()]
      };
      return { ...r, days: [...r.days, newDay] };
    }));
  };

  const updateDayField = (routineId: string, dayId: string, field: keyof WorkoutDay, value: any) => {
    setLocalRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      return {
        ...r,
        days: r.days.map(d => d.id === dayId ? { ...d, [field]: value } : d)
      };
    }));
  };

  const removeDay = (routineId: string, dayId: string) => {
    HapticService.impactMedium();
    setLocalRoutines(prev => prev.map(r => r.id === routineId ? { ...r, days: r.days.filter(d => d.id !== dayId) } : r));
  };

  const updateExerciseField = (routineId: string, dayId: string, exIdx: number, field: keyof Exercise, value: any) => {
    setLocalRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      return {
        ...r,
        days: r.days.map(d => {
          if (d.id !== dayId) return d;
          const newExs = [...d.exercises];
          newExs[exIdx] = { ...newExs[exIdx], [field]: value };
          if (field === 'sets' && typeof value === 'number') {
            newExs[exIdx].setConfigs = Array.from({ length: value }, (_, i) => (newExs[exIdx].setConfigs?.[i] || SetType.NORMAL));
          }
          return { ...d, exercises: newExs };
        })
      };
    }));
  };

  const removeExercise = (routineId: string, dayId: string, exIdx: number) => {
    HapticService.impactLight();
    setLocalRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      return {
        ...r,
        days: r.days.map(d => {
          if (d.id !== dayId) return d;
          const remaining = d.exercises.filter((_, i) => i !== exIdx);
          return { ...d, exercises: remaining };
        })
      };
    }));
  };

  const reorderExercise = (routineId: string, dayId: string, exIdx: number, direction: 'up' | 'down') => {
    HapticService.selection();
    setLocalRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      return {
        ...r,
        days: r.days.map(d => {
          if (d.id !== dayId) return d;
          const newExs = [...d.exercises];
          const targetIdx = direction === 'up' ? exIdx - 1 : exIdx + 1;
          if (targetIdx < 0 || targetIdx >= newExs.length) return d;
          [newExs[exIdx], newExs[targetIdx]] = [newExs[targetIdx], newExs[exIdx]];
          return { ...d, exercises: newExs };
        })
      };
    }));
  };

  const toggleSuperset = (routineId: string, dayId: string, exIdx: number) => {
    HapticService.selection();
    setLocalRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      return {
        ...r,
        days: r.days.map(d => {
          if (d.id !== dayId) return d;
          const newExs = [...d.exercises];
          const currentEx = newExs[exIdx];
          
          if (currentEx.supersetPartner) {
            const partner = currentEx.supersetPartner;
            const { supersetPartner, ...rest } = currentEx;
            newExs[exIdx] = rest;
            newExs.splice(exIdx + 1, 0, partner);
          } else if (exIdx < newExs.length - 1) {
            const partner = newExs[exIdx + 1];
            newExs[exIdx] = { ...currentEx, supersetPartner: partner };
            newExs.splice(exIdx + 1, 1);
          }
          
          return { ...d, exercises: newExs };
        })
      };
    }));
  };

  const updateSupersetPartnerField = (routineId: string, dayId: string, exIdx: number, field: keyof Exercise, value: any) => {
    setLocalRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      return {
        ...r,
        days: r.days.map(d => {
          if (d.id !== dayId) return d;
          const newExs = [...d.exercises];
          if (newExs[exIdx].supersetPartner) {
            newExs[exIdx].supersetPartner = { ...newExs[exIdx].supersetPartner!, [field]: value };
          }
          return { ...d, exercises: newExs };
        })
      };
    }));
  };

  const addExerciseToDay = (metadata: any) => {
    if (!showDirectory) return;
    HapticService.notificationSuccess();
    const { routineId, dayId, supersetWithIndex } = showDirectory;
    const newEx: Exercise = {
      name: metadata.name,
      sets: 3,
      reps: '10-12',
      instructions: '',
      category: metadata.category,
      metadata: metadata,
      setConfigs: Array.from({ length: 3 }, () => SetType.NORMAL)
    };
    setLocalRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      return {
        ...r,
        days: r.days.map(d => {
          if (d.id !== dayId) return d;
          
          if (supersetWithIndex !== undefined) {
            const exercises = [...d.exercises];
            exercises[supersetWithIndex] = {
              ...exercises[supersetWithIndex],
              supersetPartner: newEx
            };
            return { ...d, exercises };
          }
          
          return { ...d, exercises: [...d.exercises, newEx] };
        })
      };
    }));
    setShowDirectory(null);
  };

  const isRoutineValid = (routine: Routine) => {
    if (routine.days.length === 0) return false;
    return routine.days.every(day => day.exercises.length > 0);
  };

  const startSplit = (id: string) => {
    const routine = localRoutines.find(r => r.id === id);
    if (!routine || !isRoutineValid(routine)) {
      setValidationError("DEPLOYMENT BLOCKED: Protocol requires at least 1 movement module per phase.");
      HapticService.notificationError();
      setTimeout(() => setValidationError(null), 4000);
      return;
    }
    HapticService.impactHeavy();
    setCurrentActiveId(id);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setEffectiveDate(dateStr);
  };

  const handleGlobalSave = () => {
    const activeRoutine = localRoutines.find(r => r.id === currentActiveId);
    if (!activeRoutine || !isRoutineValid(activeRoutine)) {
      setValidationError("VALIDATION ERROR: System cannot deploy incomplete protocols. Check for empty phases.");
      HapticService.notificationError();
      setTimeout(() => setValidationError(null), 4000);
      return;
    }
    setShowFinalizeModal(true);
  };

  const confirmFinalize = () => {
    onSave(localRoutines, currentActiveId, effectiveDate, planDuration);
  };

  const handleBack = () => {
    if (hasChanges) {
      HapticService.impactMedium();
      setShowExitWarning(true);
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white reveal overflow-hidden">
      <header className="px-8 pt-16 pb-6 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em] mb-1">Architecture</p>
              <h1 className="text-2xl font-light tracking-tight uppercase">Split Room</h1>
            </div>
          </div>
          <button 
            onClick={handleGlobalSave}
            className="gold-metallic px-4 py-2 rounded-xl text-[9px] shadow-lg active:scale-95 transition-all"
          >
            Deploy Changes
          </button>
        </div>
        
        <div className="flex gap-4 mt-8 p-1 bg-zinc-900/50 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('MY_LIBRARY')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'MY_LIBRARY' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Library size={14} /> My Library
          </button>
          <button 
            onClick={() => setActiveTab('ARCHIVE')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'ARCHIVE' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Globe size={14} /> Import Archive
          </button>
        </div>
      </header>

      {validationError && (
        <div className="bg-gold/10 border-b border-gold/20 px-8 py-4 flex items-center gap-4 animate-in slide-in-from-top duration-500">
          <AlertCircle size={18} className="text-gold shrink-0" />
          <p className="text-[10px] font-black text-gold uppercase tracking-widest leading-relaxed">{validationError}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32 no-scrollbar">
        {activeTab === 'MY_LIBRARY' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Available Blueprint(s)</h3>
              <button onClick={addNewRoutine} className="text-[10px] font-bold text-gold uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform">
                <Plus size={14} /> Forge New
              </button>
            </div>

            {localRoutines.map(routine => {
              const isValid = isRoutineValid(routine);
              return (
                <Card key={routine.id} className={`transition-all border-white/[0.03] overflow-hidden ${currentActiveId === routine.id ? 'border-gold/40 ring-1 ring-gold/10 bg-gold/5 shadow-[0_0_30px_rgba(212,175,55,0.05)]' : 'bg-zinc-950/50'}`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        {routine.creator === 'Ares' ? <Crown size={12} className="text-gold" /> : <User size={12} className="text-zinc-500" />}
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{routine.creator} Protocol</span>
                        {currentActiveId === routine.id && <span className="px-2 py-0.5 bg-gold text-black text-[7px] font-black rounded-full ml-2">RUNNING</span>}
                        {!isValid && <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[7px] font-black rounded-full ml-2 uppercase border border-white/10">STRUCTURALLY INCOMPLETE</span>}
                      </div>
                      <h4 className={`text-lg font-bold uppercase tracking-tight ${currentActiveId === routine.id ? 'gold-text' : 'text-white'}`}>{routine.name}</h4>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{routine.days.length} PHASES IN ROTATION</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <button 
                        onClick={() => startSplit(routine.id)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest transition-all ${currentActiveId === routine.id ? 'bg-gold text-black shadow-lg shadow-gold/20' : (isValid ? 'bg-white/5 border border-white/10 text-zinc-400 hover:border-gold/60 hover:text-gold hover:bg-white/10' : 'bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed opacity-50')}`}
                      >
                        {currentActiveId === routine.id ? 'RUNNING' : 'START THIS SPLIT'}
                      </button>
                      <button 
                        onClick={() => setEditingRoutineId(editingRoutineId === routine.id ? null : routine.id)}
                        className={`p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all ${editingRoutineId === routine.id ? 'rotate-180 text-gold' : ''}`}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>

                  {editingRoutineId === routine.id && (
                    <div className="mt-8 pt-8 border-t border-white/5 space-y-8 animate-in fade-in duration-300">
                      <div className="space-y-4">
                        <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Protocol Identifier</label>
                        <input 
                          className="w-full bg-zinc-900/50 p-5 rounded-2xl text-xs font-bold text-gold outline-none border border-white/5 focus:border-gold/30 uppercase tracking-widest"
                          value={routine.name}
                          onChange={(e) => updateRoutineField(routine.id, 'name', e.target.value.toUpperCase())}
                        />
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Phases (Rotation Nodes)</p>
                          <button onClick={() => addDay(routine.id)} className="text-[9px] font-bold text-gold uppercase tracking-widest">+ Add Node</button>
                        </div>

                        {routine.days.map(day => (
                          <div key={day.id} className={`bg-black/40 border rounded-2xl overflow-hidden mb-4 ${day.exercises.length === 0 ? 'border-gold/20 bg-gold/5' : 'border-white/5'}`}>
                            <div 
                              className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                              onClick={() => setEditingDayId(editingDayId === day.id ? null : day.id)}
                            >
                              <div className="space-y-1">
                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{day.dayName}</p>
                                <h5 className={`font-bold text-xs uppercase tracking-tight ${day.exercises.length === 0 ? 'text-gold' : ''}`}>{day.focus}</h5>
                              </div>
                              <div className="flex items-center gap-4">
                                {day.exercises.length === 0 && <AlertCircle size={14} className="text-gold" />}
                                <button onClick={(e) => { e.stopPropagation(); removeDay(routine.id, day.id); }} className="text-zinc-800 hover:text-zinc-400"><Trash2 size={14} /></button>
                                <ChevronDown size={14} className={`text-zinc-700 transition-transform ${editingDayId === day.id ? 'rotate-180' : ''}`} />
                              </div>
                            </div>

                            {editingDayId === day.id && (
                              <div className="p-4 pt-0 space-y-6 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-3">
                                  <input className="bg-zinc-900/50 p-3 rounded-xl text-[10px] font-bold outline-none text-white border border-white/5 focus:border-gold/30 uppercase" value={day.dayName} onChange={(e) => updateDayField(routine.id, day.id, 'dayName', e.target.value.toUpperCase())} />
                                  <input className="bg-zinc-900/50 p-3 rounded-xl text-[10px] font-bold outline-none text-white border border-white/5 focus:border-gold/30 uppercase" value={day.focus} onChange={(e) => updateDayField(routine.id, day.id, 'focus', e.target.value.toUpperCase())} />
                                </div>

                                <div className="space-y-3">
                                  {day.exercises.map((ex, exIdx) => (
                                      <div key={exIdx} className={`p-4 rounded-xl border space-y-4 group transition-all relative ${ex.supersetPartner ? 'bg-gold/5 border-gold/20 ring-1 ring-gold/10 mb-8' : 'bg-zinc-900/20 border-white/5'}`}>
                                        {ex.supersetPartner && (
                                          <div className="absolute -bottom-6 left-8 w-px h-6 bg-gold/30" />
                                        )}
                                        <div className="flex justify-between items-start">
                                          <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                              <h6 className="text-[11px] font-bold uppercase tracking-tight text-white/90">{ex.name}</h6>
                                              {ex.supersetPartner && <span className="text-[7px] bg-gold text-black px-1.5 py-0.5 rounded font-black">SUPERSET</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button 
                                                disabled={exIdx === 0}
                                                onClick={() => reorderExercise(routine.id, day.id, exIdx, 'up')}
                                                className={`p-1 rounded bg-white/5 transition-all ${exIdx === 0 ? 'opacity-20 cursor-not-allowed' : 'text-gold hover:bg-gold hover:text-black'}`}
                                              >
                                                <ChevronUp size={10} strokeWidth={3} />
                                              </button>
                                              <button 
                                                disabled={exIdx === day.exercises.length - 1}
                                                onClick={() => reorderExercise(routine.id, day.id, exIdx, 'down')}
                                                className={`p-1 rounded bg-white/5 transition-all ${exIdx === day.exercises.length - 1 ? 'opacity-20 cursor-not-allowed' : 'text-gold hover:bg-gold hover:text-black'}`}
                                              >
                                                <ChevronDown size={10} strokeWidth={3} />
                                              </button>
                                              {!ex.supersetPartner && (
                                                <button 
                                                  onClick={() => setShowDirectory({ routineId: routine.id, dayId: day.id, supersetWithIndex: exIdx })}
                                                  className="px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest bg-white/5 text-zinc-500 hover:text-gold transition-all flex items-center gap-1"
                                                >
                                                  <Zap size={8} /> Add Partner
                                                </button>
                                              )}
                                              {ex.supersetPartner && (
                                                <button 
                                                  onClick={() => toggleSuperset(routine.id, day.id, exIdx)}
                                                  className="px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest bg-gold text-black transition-all"
                                                >
                                                  Break Superset
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          <button onClick={() => removeExercise(routine.id, day.id, exIdx)} className="text-zinc-800 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                            <p className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-1">Sets</p>
                                            <input 
                                              type="number"
                                              className="w-full bg-black/40 p-3 rounded-lg text-xs font-bold text-gold outline-none text-center"
                                              value={ex.sets}
                                              onChange={(e) => updateExerciseField(routine.id, day.id, exIdx, 'sets', parseInt(e.target.value) || 0)}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-1">{ex.name} Reps</p>
                                            <input 
                                              className="w-full bg-black/40 p-3 rounded-lg text-xs font-bold text-white outline-none text-center uppercase tracking-widest"
                                              value={ex.reps}
                                              placeholder="10-12"
                                              onChange={(e) => updateExerciseField(routine.id, day.id, exIdx, 'reps', e.target.value)}
                                            />
                                          </div>
                                        </div>

                                        {ex.supersetPartner && (
                                          <div className="pt-4 border-t border-gold/10 space-y-4 animate-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2">
                                              <Zap size={10} className="text-gold" />
                                              <h6 className="text-[10px] font-bold uppercase tracking-tight text-gold">{ex.supersetPartner.name}</h6>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                              <div className="space-y-1">
                                                <p className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-1">{ex.supersetPartner.name} Reps</p>
                                                <input 
                                                  className="w-full bg-black/40 p-3 rounded-lg text-xs font-bold text-white outline-none text-center uppercase tracking-widest"
                                                  value={ex.supersetPartner.reps}
                                                  placeholder="10-12"
                                                  onChange={(e) => updateSupersetPartnerField(routine.id, day.id, exIdx, 'reps', e.target.value)}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                  ))}
                                  {day.exercises.length === 0 && (
                                    <div className="py-8 px-4 border border-dashed border-gold/20 rounded-xl flex flex-col items-center justify-center gap-3 bg-gold/5">
                                      <AlertCircle size={20} className="text-gold opacity-40" />
                                      <p className="text-[8px] font-black text-gold uppercase tracking-widest text-center">Empty phase: Insert module to proceed</p>
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => setShowDirectory({ routineId: routine.id, dayId: day.id })}
                                    className="w-full py-4 border border-dashed border-white/10 rounded-xl text-[9px] font-bold text-zinc-700 uppercase tracking-widest hover:border-gold/20 hover:text-gold transition-all"
                                  >
                                    + Insert Module Node
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {routine.creator === 'User' && (
                        <button 
                          onClick={() => deleteRoutine(routine.id)}
                          className="w-full py-4 bg-zinc-900 border border-white/10 rounded-2xl text-[9px] font-black text-zinc-500 uppercase tracking-widest hover:bg-zinc-800 hover:text-zinc-200 transition-all"
                        >
                          Decommission Blueprint
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-8">
            <header className="px-2 space-y-1">
              <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">Historical Archives</h3>
              <p className="text-[11px] text-zinc-600 font-light leading-relaxed">Import world-class architectures from performance legends.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
              {ARCHIVE_SPLITS.map(arch => (
                <Card key={arch.id} className="p-8 bg-zinc-900/40 border-white/5 group hover:border-gold/30 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><Crown size={180} /></div>
                  <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] font-black text-gold uppercase tracking-widest">Official Blueprint</span>
                        <div className="h-px flex-1 bg-gold/10" />
                      </div>
                      <h4 className="text-2xl font-black uppercase tracking-tighter">{arch.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Architect: {arch.creator}</p>
                      <p className="text-[11px] text-zinc-600 leading-relaxed max-w-[95%]">{arch.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest mb-1">Complexity</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{arch.days.length} NODES</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest mb-1">Density</p>
                        <p className="text-[10px] font-bold text-gold uppercase tracking-widest">EXTREME</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => importRoutine(arch)}
                      className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gold hover:text-black hover:border-gold transition-all"
                    >
                      <Play size={14} fill="currentColor" /> Import Protocol
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Settings2 size={16} className="text-gold" />
            <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em]">Temporal Sync</h3>
          </div>
          <Card className="bg-[#0A0A0B] border-white/5 p-8 space-y-4">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Effective Cycle Deployment</p>
            <input 
              type="date" 
              className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-sm gold-text outline-none focus:border-gold/30 uppercase tracking-widest transition-all"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
            <p className="text-[8px] text-zinc-700 font-medium uppercase tracking-widest leading-relaxed">
              *Resets the rotation cycle for the active protocol on this anchor date.
            </p>
          </Card>
        </div>
      </div>

      {showFinalizeModal && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="w-full max-w-md space-y-10">
            <header className="text-center space-y-4">
              <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto">
                <Clock size={32} className="text-gold" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-gold font-bold uppercase tracking-[0.4em]">Temporal Commitment</p>
                <h2 className="text-2xl font-light tracking-tight uppercase">Protocol Duration</h2>
                <p className="text-[11px] text-zinc-500 font-light leading-relaxed">Define the operational window for this training block. Consistency is the primary catalyst for adaptation.</p>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-4">
              {[3, 6, 9].map(m => (
                <button 
                  key={m}
                  onClick={() => { setPlanDuration(m); setCustomDuration(''); }}
                  className={`py-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${planDuration === m && !customDuration ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20'}`}
                >
                  <span className="text-2xl font-black tabular-nums">{m}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest">Months</span>
                </button>
              ))}
              <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${customDuration ? 'bg-gold/10 border-gold/40' : 'bg-zinc-900 border-white/5'}`}>
                <input 
                  type="number"
                  placeholder="Custom"
                  value={customDuration}
                  onChange={(e) => { setCustomDuration(e.target.value); setPlanDuration(Number(e.target.value)); }}
                  className="w-full bg-transparent text-center text-2xl font-black text-white outline-none placeholder:text-zinc-800"
                />
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Months</span>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={confirmFinalize}
                className="w-full py-6 bg-white text-black rounded-[32px] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all"
              >
                Finalize Protocol
              </button>
              <button 
                onClick={() => setShowFinalizeModal(false)}
                className="w-full py-4 text-zinc-600 font-bold uppercase tracking-widest text-[9px] hover:text-zinc-400 transition-colors"
              >
                Abort & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {showDirectory && (
        <div className="fixed inset-0 z-[600] bg-black/98 backdrop-blur-2xl flex flex-col animate-in fade-in slide-in-from-bottom duration-500">
          <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-xl pt-16">
            <div className="space-y-1">
              <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">Inventory</p>
              <h2 className="text-2xl font-light tracking-tight uppercase">Module Selector</h2>
            </div>
            <button onClick={() => setShowDirectory(null)} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all"><X size={20} /></button>
          </header>
          
          <div className="p-8 border-b border-white/5 bg-zinc-950/50 space-y-6">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
              <input 
                placeholder="SEARCH ARCHIVES" 
                className="w-full bg-zinc-900/50 border border-white/5 rounded-[28px] p-6 pl-16 text-xs tracking-widest outline-none focus:border-gold-solid text-white uppercase transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
               <button onClick={() => setSelectedCategory(null)} className={`flex-none px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${!selectedCategory ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-transparent border-white/10 text-zinc-500 hover:text-zinc-300'}`}>All</button>
               {categories.map(cat => (
                 <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-none px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-transparent border-white/10 text-zinc-500 hover:text-zinc-300'}`}>{cat}</button>
               ))}
            </div>
          </div>

          <div className="p-8 flex-1 overflow-y-auto space-y-4 no-scrollbar pb-32">
            {mergedDirectory.filter(ex => 
              (ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || ex.primaryMuscle.toLowerCase().includes(searchTerm.toLowerCase())) &&
              (!selectedCategory || ex.category === selectedCategory)
            ).map(ex => (
              <Card key={ex.id} onClick={() => addExerciseToDay(ex)} className="bg-zinc-900/20 border-white/5 p-6 flex justify-between items-center group hover:border-gold/20 transition-all">
                <div className="flex gap-6 items-center">
                  <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-700 overflow-hidden relative">
                    {ex.youtubeId ? (
                      <img src={ex.animationUrl} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <Youtube size={24} className="text-zinc-800 opacity-20" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-tight group-hover:gold-text transition-colors">{ex.name}</h5>
                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-1">{ex.primaryMuscle} | {ex.category}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold group-hover:text-black transition-all">
                  <Plus size={18} strokeWidth={3} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showExitWarning && (
        <div className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="w-full max-w-sm space-y-10 bg-zinc-900 border border-white/10 p-10 rounded-[48px] shadow-2xl text-center">
              <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} className="text-gold animate-pulse" />
              </div>
              <div className="space-y-2">
                 <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">Architecture Alert</p>
                 <h2 className="text-2xl font-light tracking-tight uppercase">Unsaved Changes</h2>
                 <p className="text-xs text-zinc-500 leading-relaxed uppercase tracking-tighter mt-4">
                    Biological protocols have been modified. Exiting now will de-synchronize the current architecture blueprint.
                 </p>
              </div>
              <div className="space-y-3 pt-4">
                 <button 
                  onClick={() => onCancel()} 
                  className="w-full py-5 rounded-[24px] bg-gold text-black font-black uppercase tracking-[0.4em] text-[10px] shadow-lg active:scale-95 transition-all"
                 >
                   Discard Edits
                 </button>
                 <button 
                  onClick={() => setShowExitWarning(false)} 
                  className="w-full py-4 text-zinc-500 font-bold uppercase tracking-widest text-[9px] hover:text-white transition-colors"
                 >
                   Return to Editor
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
