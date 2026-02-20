import React, { useState, useMemo, useEffect } from 'react';
import { AppState, WorkoutDay, DayStatus, ExerciseLog, ExerciseMetadata } from './types.ts';
import { Card } from './components/Card.tsx';
import { BiologicalScan } from './BiologicalScan.tsx';
import { LIGHT_EXERCISES, EXERCISE_DIRECTORY } from './exerciseDirectory.ts';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft,
  Activity, 
  Calendar as CalendarIcon, 
  Target, 
  X, 
  Clock, 
  Dumbbell,
  Lock,
  Heart,
  Dices,
  Search,
  Scan,
  Plus,
  Check,
  ArrowLeft,
  AlertCircle,
  Zap as Power,
  RefreshCcw,
  LayoutGrid,
  Filter,
  Flame,
  Utensils,
  Scale,
  Zap,
  CheckCircle,
  ArrowRight,
  MoveRight,
  CalendarDays,
  AlertTriangle
} from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onStartWorkout: (workout: WorkoutDay) => void;
  onEditSplit: () => void;
  onToggleRestDay: (dateStr: string) => void;
  onRescheduleWorkout?: (missedDate: string, targetDate: string, workout: WorkoutDay) => void;
  onToggleNav?: (visible: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onStartWorkout, onEditSplit, onToggleRestDay, onRescheduleWorkout, onToggleNav }) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const joinDate = state.profile?.joinDate ? new Date(state.profile.joinDate) : new Date();
  
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showRecoveryLab, setShowRecoveryLab] = useState(false);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [showSplitLab, setShowSplitLab] = useState(false);
  const [showReschedulePicker, setShowReschedulePicker] = useState<{ date: string; workout: WorkoutDay } | null>(null);
  const [showBioScan, setShowBioScan] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recoverySelection, setRecoverySelection] = useState<any[]>([]);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const mergedDirectory = useMemo(() => [...EXERCISE_DIRECTORY, ...state.userExercises], [state.userExercises]);

  useEffect(() => {
    if (onToggleNav) {
      onToggleNav(!(showRecoveryLab || showManualPicker || showSplitLab || !!showReschedulePicker || !!selectedDate || showBioScan));
    }
  }, [showRecoveryLab, showManualPicker, showSplitLab, showReschedulePicker, selectedDate, showBioScan, onToggleNav]);

  const categories = useMemo(() => {
    const cats = new Set(mergedDirectory.map(ex => ex.category));
    return Array.from(cats).sort();
  }, [mergedDirectory]);

  const isDateWorkoutDay = (date: Date) => {
    if (!state.profile?.selectedDays || state.profile.selectedDays.length === 0) return false;
    return state.profile.selectedDays.includes(date.getDay());
  };

  const getWorkoutForDate = (date: Date) => {
    if (!state.workoutPlan || state.workoutPlan.length === 0) return null;
    if (!state.profile?.selectedDays || state.profile.selectedDays.length === 0) return null;
    
    const dayOfWeek = date.getDay();
    if (!state.profile.selectedDays.includes(dayOfWeek)) return null;

    const sortedDays = [...state.profile.selectedDays].sort();
    const phaseIndex = sortedDays.indexOf(dayOfWeek);
    
    return state.workoutPlan[phaseIndex % state.workoutPlan.length];
  };

  const missedWorkouts = useMemo(() => {
    const completedToday = state.workoutHistory.some(h => h.date === todayStr);
    const rescheduledToday = !!state.rescheduledWorkouts?.[todayStr];
    if (completedToday) return [];

    const missed: { date: string, workout: WorkoutDay | null }[] = [];
    const joinStr = joinDate.toISOString().split('T')[0];

    for (let i = 1; i <= 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      if (dStr < joinStr) continue;

      const isWorkday = isDateWorkoutDay(d);
      const activity = state.activityLog[dStr];
      const history = state.workoutHistory.find(h => h.date === dStr);
      
      const workoutForDay = getWorkoutForDate(d);
      const isCurrentlyRescheduled = workoutForDay 
        ? (Object.values(state.rescheduledWorkouts || {}) as WorkoutDay[]).some(w => w && w.id === workoutForDay.id) 
        : false;

      if (isWorkday && !activity && !history && !isCurrentlyRescheduled) {
        missed.push({ date: dStr, workout: workoutForDay });
      }
    }
    return missed;
  }, [state.activityLog, state.workoutPlan, state.workoutHistory, state.rescheduledWorkouts, todayStr, state.profile?.selectedDays]);

  const scheduledWorkoutToday = isDateWorkoutDay(now) ? getWorkoutForDate(now) : null;
  const isTodayManualRest = state.activityLog[todayStr] === 'rest';
  const rescheduledWorkoutToday = state.rescheduledWorkouts?.[todayStr];
  
  const todayWorkout = rescheduledWorkoutToday || (isTodayManualRest ? null : scheduledWorkoutToday);
  
  const latestMetric = state.dailyMetricsHistory.length > 0 
    ? state.dailyMetricsHistory[state.dailyMetricsHistory.length - 1] 
    : null;
  const score = latestMetric ? Math.round(latestMetric.zpi) : 0;

  const getRank = (s: number) => {
    if (s >= 90) return 'S';
    if (s >= 80) return 'A';
    if (s >= 70) return 'B';
    if (s >= 60) return 'C';
    return 'D';
  };
  const rank = getRank(score);

  const tryStartWorkout = (workout: WorkoutDay | null) => {
    if (!workout) return;
    if (workout.exercises.length === 0) {
      setLaunchError(`SYSTEM ERROR: Protocol "${workout.focus}" has 0 modules. Architect the split before deployment.`);
      setTimeout(() => setLaunchError(null), 4000);
      return;
    }
    onStartWorkout(workout);
  };

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const getStatusStyle = (status: DayStatus | undefined, isToday: boolean, isWorkoutDay: boolean, dateStr: string) => {
    const base = "w-full aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer relative ";
    const todayStr = now.toISOString().split('T')[0];
    const isRescheduledDay = !!state.rescheduledWorkouts?.[dateStr];
    
    let classes = base;

    if (status === 'full') {
      classes += "bg-[#C5A059] text-black shadow-[0_0_15px_rgba(197,160,89,0.3)] hover:brightness-110 ";
    } else if (status === 'rest') {
      classes += "bg-blue-500/20 text-blue-400 border border-blue-500/10 hover:bg-blue-500/40 hover:border-blue-500/30 ";
    } else if (isRescheduledDay) {
      classes += "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 border-dashed hover:bg-indigo-500/40 hover:border-indigo-500 ";
    } else if (status === 'missed' || (!status && dateStr < todayStr && isWorkoutDay)) {
      classes += "bg-red-500/10 text-red-500 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:bg-red-500/30 hover:border-red-500 ";
    } else if (!isWorkoutDay) {
      classes += "bg-zinc-900 text-zinc-600 border border-white/[0.03] hover:bg-zinc-800 hover:text-zinc-400 ";
    } else {
      classes += "bg-white/[0.02] text-zinc-400 border border-white/[0.02] hover:bg-white/10 hover:border-white/40 ";
    }

    if (isToday) {
      classes += "ring-2 ring-[#C5A059] ring-offset-2 ring-offset-black z-10 ";
    }

    return classes;
  };

  const handleFinalizePlan = () => {
    if (recoverySelection.length === 0) return;
    const customWorkout: WorkoutDay = {
      id: 'custom-' + Date.now(),
      dayName: 'PROTOCOL',
      focus: recoverySelection.length === 1 ? recoverySelection[0].name.toUpperCase() : 'MANUAL LOADOUT',
      exercises: recoverySelection.map(ex => ({
        name: ex.name,
        sets: ex.isCardio ? 1 : 3,
        reps: ex.isCardio ? 'MANUAL' : '10-12',
        instructions: 'Focus on technical integrity.',
        category: ex.category || 'Manual',
        metadata: ex
      }))
    };
    setShowRecoveryLab(false);
    setShowManualPicker(false);
    setRecoverySelection([]);
    tryStartWorkout(customWorkout);
  };

  const toggleRecoverySelection = (exercise: any) => {
    setRecoverySelection(prev => {
      const exists = prev.find(i => i.id === exercise.id);
      if (exists) return prev.filter(i => i.id !== exercise.id);
      return [...prev, exercise];
    });
  };

  const getAvailableRestDaysThisWeek = () => {
    const days = [];
    const currentDay = now.getDay(); 
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      
      const isWorkday = isDateWorkoutDay(d);
      const activity = state.activityLog[dStr];
      const isRescheduled = !!state.rescheduledWorkouts?.[dStr];

      if (dStr >= todayStr && !isWorkday && activity !== 'rest' && !isRescheduled) {
        days.push({ date: dStr, label: d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' }) });
      }
    }
    return days;
  };

  const performReschedule = (targetDate: string) => {
    if (!showReschedulePicker || !onRescheduleWorkout) return;
    onRescheduleWorkout(showReschedulePicker.date, targetDate, showReschedulePicker.workout);
    setShowReschedulePicker(null);
  };

  const renderMonthCalendar = () => {
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-full aspect-square" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const isToday = dateStr === now.toISOString().split('T')[0];
      const isWorkday = isDateWorkoutDay(date);
      const status = state.activityLog[dateStr];
      days.push(<div key={d} onClick={() => setSelectedDate(dateStr)} className={getStatusStyle(status, isToday, isWorkday, dateStr)}>{d}</div>);
    }

    return (
      <div className="space-y-6">
        <header className="flex justify-between items-center mb-8">
          <button onClick={handlePrevMonth} className="p-2 text-zinc-500 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
          <p className="text-xs font-bold uppercase tracking-[0.3em]">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          <button onClick={handleNextMonth} className="p-2 text-zinc-500 hover:text-white transition-colors"><ChevronRight size={20} /></button>
        </header>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['M','T','W','T','F','S','S'].map((day, i) => (<div key={i} className="text-center text-[8px] font-bold text-zinc-700 uppercase tracking-widest">{day}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>
    );
  };

  const renderDailyRecord = () => {
    if (!selectedDate) return null;
    const dateObj = new Date(selectedDate);
    const isScheduledWorkday = isDateWorkoutDay(dateObj);
    const status = state.activityLog[selectedDate];
    const dayHistory = state.workoutHistory.find(h => h.date === selectedDate);
    const dayWeight = state.weightHistory.find(w => w.date === selectedDate);
    const isToday = selectedDate === now.toISOString().split('T')[0];
    const rescheduled = state.rescheduledWorkouts?.[selectedDate];

    const dailyKcal = isToday 
      ? state.dailyMeals.reduce((acc, m) => m.checked ? acc + m.calories : acc, 0)
      : (dayHistory ? 2450 + Math.floor(Math.random() * 200) : 1800 + Math.floor(Math.random() * 200));
    
    const dailyProtein = isToday 
      ? state.dailyMeals.reduce((acc, m) => m.checked ? acc + m.protein : acc, 0)
      : 180 + Math.floor(Math.random() * 20);
    
    const dailyFiber = isToday 
      ? state.dailyMeals.reduce((acc, m) => m.checked ? acc + m.fiber : acc, 0)
      : 30 + Math.floor(Math.random() * 10);

    return (
      <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-2xl flex items-end sm:items-center justify-center animate-in fade-in duration-300">
        <div className="absolute inset-0" onClick={() => setSelectedDate(null)} />
        <div className="relative w-full max-w-md bg-surface border-t sm:border border-white/10 rounded-t-[48px] sm:rounded-[48px] p-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
          <header className="flex justify-between items-start mb-12">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gold uppercase tracking-[0.5em]">Protocol Summary</p>
              <h2 className="text-3xl font-light tracking-tight uppercase tabular-nums">{selectedDate}</h2>
            </div>
            <button onClick={() => setSelectedDate(null)} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all hover:bg-white/10"><X size={24} /></button>
          </header>

          <div className="space-y-8 pb-12">
             <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 bg-white/[0.02] border-white/5 text-center hover:bg-white/5 hover:border-white/20 transition-all">
                   <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-2">Workout Status</p>
                   <p className={`text-[10px] font-black uppercase ${dayHistory ? 'text-green-500' : (rescheduled ? 'text-indigo-400' : 'text-zinc-500')}`}>
                      {dayHistory ? 'COMPLETE' : (rescheduled ? 'RESCHEDULED HERE' : (status === 'rest' ? 'OVERRIDE REST' : (isScheduledWorkday ? 'MISSED' : 'AUTO REST')))}
                   </p>
                </Card>
                <Card className="p-6 bg-white/[0.02] border-white/5 text-center hover:bg-white/5 hover:border-white/20 transition-all">
                   <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-2">Body Mass</p>
                   <p className="text-[10px] font-black uppercase text-gold">
                      {dayWeight ? `${dayWeight.weight} KG` : 'NO RECORD'}
                   </p>
                </Card>
             </div>

             {rescheduled && (
               <Card className="p-8 border-indigo-500/20 bg-indigo-500/5 space-y-4 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center gap-3">
                    <RefreshCcw size={16} className="text-indigo-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Shifted Module</h4>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Focus</p>
                      <p className="text-xs font-bold uppercase">{rescheduled.focus}</p>
                    </div>
                    {isToday && (
                      <button onClick={() => tryStartWorkout(rescheduled)} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 active:scale-95 transition-all">Deploy Now</button>
                    )}
                  </div>
               </Card>
             )}

             {dayHistory && (
               <Card className="p-8 border-gold/10 bg-gold/5 space-y-4 hover:bg-gold/10 hover:border-gold/30 transition-all">
                 <div className="flex items-center gap-3">
                   <Dumbbell size={16} className="text-gold" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest">Training Diagnostic</h4>
                 </div>
                 <div className="grid grid-cols-2 gap-y-6">
                    <div>
                       <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Focus</p>
                       <p className="text-xs font-bold uppercase">{dayHistory.focus}</p>
                    </div>
                    <div>
                       <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Energy Burn</p>
                       <p className="text-xs font-bold uppercase tabular-nums">{dayHistory.calories} KCAL</p>
                    </div>
                    <div>
                       <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Duration</p>
                       <p className="text-xs font-bold uppercase tabular-nums">{dayHistory.duration} MIN</p>
                    </div>
                    <div>
                       <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Rating</p>
                       <div className="flex items-center gap-1">
                          <CheckCircle size={12} className="text-green-500" />
                          <p className="text-xs font-bold uppercase">Rank A</p>
                       </div>
                    </div>
                 </div>
               </Card>
             )}

             <section className="space-y-4">
                <div className="flex items-center gap-3 ml-2">
                   <Utensils size={14} className="text-zinc-600" />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Nutritional Inventory</h4>
                </div>
                <div className="grid grid-cols-4 gap-2">
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center hover:bg-white/10 hover:border-white/30 transition-all cursor-default">
                      <p className="text-[7px] font-black text-zinc-700 uppercase mb-1">CAL</p>
                      <p className="text-[10px] font-bold gold-text tabular-nums">{dailyKcal}</p>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center hover:bg-white/10 hover:border-white/30 transition-all cursor-default">
                      <p className="text-[7px] font-black text-zinc-700 uppercase mb-1">PRO</p>
                      <p className="text-[10px] font-bold tabular-nums">{dailyProtein}G</p>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center hover:bg-white/10 hover:border-white/30 transition-all cursor-default">
                      <p className="text-[7px] font-black text-zinc-700 uppercase mb-1">FBR</p>
                      <p className="text-[10px] font-bold text-green-500 tabular-nums">{dailyFiber}G</p>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center hover:bg-white/10 hover:border-white/30 transition-all cursor-default">
                      <p className="text-[7px] font-black text-zinc-700 uppercase mb-1">Score</p>
                      <p className="text-[10px] font-bold">92%</p>
                   </div>
                </div>
             </section>

             {isScheduledWorkday && !dayHistory && (
                <button 
                  onClick={() => onToggleRestDay(selectedDate)} 
                  className={`w-full py-6 rounded-3xl text-[10px] font-bold uppercase tracking-[0.5em] border transition-all ${status === 'rest' ? 'bg-gold/10 border-gold/60 text-gold shadow-lg shadow-gold/10 hover:bg-gold/20' : 'bg-transparent border-white/10 text-zinc-600 hover:border-gold/60 hover:text-zinc-200 hover:bg-white/5'}`}
                >
                  {status === 'rest' ? 'RESUME SCHEDULED DEPLOYMENT' : 'OVERRIDE TO REST'}
                </button>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full px-6 pt-12 space-y-12 reveal pb-40">
      <header className="w-full flex justify-between items-end border-b border-white/5 pb-8">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.4em]">Ares</p>
          <h1 className="text-3xl font-bold gold-text uppercase leading-tight tracking-tight">Hello {state.profile?.name?.split(' ')[0] || 'GUEST'}</h1>
        </div>
        <div className="flex flex-col items-end">
          <button 
            onClick={() => setShowBioScan(true)}
            className="mb-4 p-2 bg-gold/10 border border-gold/20 rounded-lg text-gold hover:bg-gold/20 transition-all flex items-center gap-2"
          >
            <Scan size={14} className="animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest">Bio-Scan</span>
          </button>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-black text-gold uppercase tracking-widest">RANK {rank}</span>
            <div className="text-4xl font-bold gold-text leading-none">{score}</div>
          </div>
          <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 mt-1.5">ZPI Efficiency</p>
        </div>
      </header>

      {launchError && (
        <div className="w-full bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-relaxed">{launchError}</p>
        </div>
      )}

      {missedWorkouts.length > 0 && (
        <Card className="w-full bg-red-500/10 border-red-500/20 p-8 flex flex-col gap-6 animate-in slide-in-from-top duration-500 hover:bg-red-500/20 hover:border-red-500 transition-all">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <AlertTriangle className="text-red-500" size={24} />
                 <div>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Incomplete Deployment</p>
                    <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest mt-1">PROTOCOL MISSED: {missedWorkouts[0].date}</p>
                 </div>
              </div>
           </div>
           <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => tryStartWorkout(missedWorkouts[0].workout)} 
                className="flex-1 px-5 py-4 bg-red-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-red-600 active:scale-95 transition-all"
              >
                <RefreshCcw size={14} /> REDEPLOY: {missedWorkouts[0].workout?.focus || 'MISS'}
              </button>
              <div className="flex gap-2 flex-1">
                 <button 
                  onClick={() => setShowReschedulePicker({ date: missedWorkouts[0].date, workout: missedWorkouts[0].workout! })}
                  className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/40 transition-all"
                 >
                   <MoveRight size={14} className="text-gold" /> Reschedule
                 </button>
                 <button onClick={() => setShowRecoveryLab(true)} className="px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-bold text-zinc-500 uppercase tracking-widest hover:bg-white/10 transition-all">LAB</button>
              </div>
           </div>
        </Card>
      )}

      <section className="w-full">
        {!todayWorkout ? (
          <Card className="relative overflow-hidden p-12 bg-zinc-950 border-white/5 border group hover:border-blue-500/50 hover:bg-blue-500/[0.02]">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500"><Heart size={200} /></div>
            <div className="relative z-10 space-y-10">
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.5em]">Recovery Mode</p>
                  </div>
                  <h2 className="text-4xl font-semibold tracking-tight uppercase leading-none">Today is a rest day.</h2>
                  <p className="text-xs text-zinc-500 font-light leading-relaxed max-w-[85%]">Biological repair window active. Protocol shifted to structural maintenance.</p>
               </div>
               <div className="pt-8 border-t border-white/5">
                  <button 
                    onClick={() => { setShowRecoveryLab(true); setRecoverySelection([]); }} 
                    className="w-full flex items-center justify-between p-7 bg-white/[0.02] border border-white/5 rounded-[32px] group hover:border-gold/60 hover:bg-gold/10 transition-all active:scale-95"
                  >
                    <div className="flex items-center gap-5">
                       <Heart className="text-zinc-600 group-hover:text-gold transition-colors" size={24} />
                       <span className="text-[13px] font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors">Get light activity in</span>
                    </div>
                    <ArrowRight size={24} className="text-gold transition-transform group-hover:translate-x-2" strokeWidth={2.5} />
                  </button>
               </div>
            </div>
          </Card>
        ) : (
          <Card onClick={() => tryStartWorkout(todayWorkout)} className={`relative overflow-hidden p-12 group cursor-pointer active:scale-95 transition-all ${rescheduledWorkoutToday ? 'bg-indigo-950/20 border-indigo-500/40 ring-1 ring-indigo-500/10 hover:border-indigo-500 hover:bg-indigo-950/40' : 'bg-surface border-white/5 hover:border-gold-solid hover:bg-white/[0.04]'}`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity duration-500"><Target size={180} className={rescheduledWorkoutToday ? 'text-indigo-400' : 'gold-text'} /></div>
            <div className="relative z-10 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${rescheduledWorkoutToday ? 'bg-indigo-400' : 'gold-bg'}`} />
                    <p className={`text-[10px] font-bold uppercase tracking-[0.5em] ${rescheduledWorkoutToday ? 'text-indigo-400' : 'gold-text'}`}>
                      {rescheduledWorkoutToday ? 'Shifted Deployment' : 'Active Deployment'}
                    </p>
                  </div>
                  <h2 className="text-4xl font-semibold tracking-tight uppercase leading-none">{todayWorkout.focus}</h2>
                </div>
                <Activity size={24} className="text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <div className="flex items-center gap-6">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center text-black shadow-2xl group-hover:scale-110 transition-transform ${rescheduledWorkoutToday ? 'bg-indigo-400 shadow-indigo-500/30' : 'gold-bg shadow-gold/30'}`}>
                      <Play fill="currentColor" size={24} className="ml-1" />
                   </div>
                   <span className={`text-[12px] font-bold tracking-[0.5em] text-zinc-500 group-hover:text-white transition-colors uppercase`}>Initiate Session</span>
                </div>
                <ChevronRight size={24} className="text-zinc-400 group-hover:text-white transition-all group-hover:translate-x-1" />
              </div>
            </div>
          </Card>
        )}
      </section>

      {showReschedulePicker && (
         <div className="fixed inset-0 z-[505] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="w-full max-w-md space-y-10">
               <header className="text-center space-y-4">
                  <CalendarDays size={48} className="text-gold mx-auto" strokeWidth={1.5} />
                  <div>
                    <p className="text-[10px] text-gold font-bold uppercase tracking-[0.4em]">Temporal Shift</p>
                    <h2 className="text-2xl font-light tracking-tight uppercase">Reschedule Lab</h2>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-2">Relocating: {showReschedulePicker.workout.focus}</p>
                  </div>
               </header>
               
               <div className="space-y-4">
                  <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest px-2">Available rest windows this week</p>
                  <div className="grid grid-cols-1 gap-3">
                     {getAvailableRestDaysThisWeek().length > 0 ? getAvailableRestDaysThisWeek().map(slot => (
                        <Card key={slot.date} onClick={() => performReschedule(slot.date)} className="p-6 bg-zinc-900/40 border-white/5 hover:border-gold/80 hover:bg-white/[0.04] transition-all flex items-center justify-between group tap-feedback">
                           <span className="text-[11px] font-bold uppercase tracking-widest group-hover:text-gold transition-colors">{slot.label}</span>
                           <ArrowRight size={16} className="text-zinc-800 group-hover:text-gold transition-all group-hover:translate-x-1" />
                        </Card>
                     )) : (
                        <div className="p-10 border border-dashed border-red-900/20 rounded-[32px] text-center bg-red-950/5">
                           <AlertCircle size={24} className="text-red-900 mx-auto mb-4" />
                           <p className="text-[10px] text-red-900 font-bold uppercase tracking-widest">No available rest windows remaining this week.</p>
                           <p className="text-[8px] text-zinc-700 uppercase tracking-widest mt-2">Deploy now or mark as failed phase.</p>
                        </div>
                     )}
                  </div>
               </div>
               
               <button onClick={() => setShowReschedulePicker(null)} className="w-full py-5 text-zinc-600 font-bold uppercase tracking-widest text-[10px] hover:text-zinc-400 transition-colors">Abort Shift</button>
            </div>
         </div>
      )}

      {showSplitLab && (
        <div className="fixed inset-0 z-[502] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
           <div className="w-full max-w-md space-y-10 py-10">
              <header className="flex items-center gap-4 text-left">
                <button onClick={() => setShowSplitLab(false)} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all hover:bg-white/10"><ArrowLeft size={18} /></button>
                <div className="space-y-1">
                  <p className="text-[10px] text-gold font-bold uppercase tracking-[0.4em]">Protocol Override</p>
                  <h2 className="text-2xl font-light tracking-tight uppercase">Split Deployment</h2>
                </div>
              </header>
              <div className="space-y-4">
                 <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest px-2 mb-2">Select Active Module</p>
                 {state.workoutPlan?.map((plan) => (
                    <Card key={plan.id} onClick={() => { setShowSplitLab(false); tryStartWorkout(plan); }} className="p-8 border-white/5 bg-zinc-900/40 hover:border-gold-solid hover:bg-white/[0.04] transition-all flex items-center justify-between group tap-feedback">
                       <div className="flex items-center gap-6">
                          <div className="p-3 bg-white/5 rounded-xl group-hover:bg-gold/10 transition-colors"><LayoutGrid size={18} className="text-zinc-600 group-hover:text-gold" /></div>
                          <div>
                             <h4 className={`font-bold text-lg tracking-tight uppercase group-hover:gold-text transition-colors ${plan.exercises.length === 0 ? 'text-zinc-700' : ''}`}>{plan.focus}</h4>
                             <p className="text-[9px] text-zinc-600 uppercase font-semibold tracking-widest">{plan.dayName}</p>
                          </div>
                       </div>
                       <Play size={18} className={`text-zinc-800 group-hover:text-gold transition-colors ${plan.exercises.length === 0 ? 'opacity-20' : ''}`} />
                    </Card>
                 ))}
              </div>
              <button onClick={() => setShowSplitLab(false)} className="w-full py-4 rounded-xl text-[9px] font-bold text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors">Abort Selection</button>
           </div>
        </div>
      )}

      {showRecoveryLab && (
        <div className="fixed inset-0 z-[501] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
           <div className="w-full max-w-md space-y-8 py-10">
              <header className="flex items-center gap-4 text-left">
                <button onClick={() => setShowRecoveryLab(false)} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all hover:bg-white/10"><ArrowLeft size={18} /></button>
                <div className="space-y-1">
                  <p className="text-[10px] text-gold font-bold uppercase tracking-[0.4em]">Recovery Lab</p>
                  <h2 className="text-2xl font-light tracking-tight uppercase">Movement Selector</h2>
                </div>
              </header>
              <Card className="bg-zinc-900/40 border-white/5 p-8 flex flex-col gap-6">
                 <div className="flex gap-4">
                    <button onClick={() => {
                        const random = LIGHT_EXERCISES[Math.floor(Math.random() * LIGHT_EXERCISES.length)];
                        setRecoverySelection([random]);
                    }} className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 font-bold text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:bg-white/10 hover:text-white hover:border-white/20"><Dices size={14} /> Randomize</button>
                    <button onClick={() => { setShowRecoveryLab(false); setShowManualPicker(true); }} className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:bg-white/10 hover:border-gold-solid"><Search size={14} className="text-gold" /> Search Library</button>
                 </div>
                 <div className="space-y-3">
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest px-2">Essential Modules</p>
                    {LIGHT_EXERCISES.map(ex => {
                      const isSelected = recoverySelection.find(i => i.id === ex.id);
                      return (
                        <button key={ex.id} onClick={() => toggleRecoverySelection(ex)} className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${isSelected ? 'bg-gold/10 border-gold-solid' : 'bg-transparent border-white/5 hover:border-gold-solid/60 hover:bg-white/5'}`}>
                           <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-gold border-gold text-black' : 'bg-zinc-900 border-white/5 text-zinc-800 group-hover:border-gold/40'}`}>{isSelected ? <Check size={14} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-zinc-800" />}</div>
                              <span className={`text-[11px] font-bold uppercase tracking-widest ${isSelected ? 'text-gold' : 'text-zinc-500'}`}>{ex.name}</span>
                           </div>
                        </button>
                      );
                    })}
                 </div>
                 <button disabled={recoverySelection.length === 0} onClick={handleFinalizePlan} className="w-full py-6 rounded-[32px] gold-metallic active:scale-95 transition-all shadow-2xl disabled:opacity-30 disabled:grayscale">Finalize Selection ({recoverySelection.length})</button>
              </Card>
           </div>
        </div>
      )}

      {showManualPicker && (
        <div className="fixed inset-0 z-[502] bg-black flex flex-col animate-in fade-in slide-in-from-bottom duration-500">
           <header className="p-8 border-b border-white/5 flex items-center gap-5 bg-black/50 backdrop-blur-xl pt-16">
              <button onClick={() => { setShowManualPicker(false); setShowRecoveryLab(true); }} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all hover:bg-white/10"><ArrowLeft size={20} /></button>
              <div>
                 <p className="text-[10px] text-gold font-bold uppercase tracking-[0.4em]">Protocol Library</p>
                 <h2 className="text-2xl font-light tracking-tight uppercase">Custom Loadout</h2>
              </div>
           </header>
           <div className="p-8 flex-1 overflow-y-auto space-y-8 no-scrollbar pb-40">
              <div className="space-y-6">
                <div className="relative">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                   <input placeholder="SEARCH ARCHIVES" className="w-full bg-zinc-900/50 border border-white/5 rounded-3xl p-6 pl-16 text-xs tracking-widest outline-none focus:border-gold-solid text-white uppercase transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                   <button onClick={() => setSelectedCategory(null)} className={`flex-none px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${!selectedCategory ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-transparent border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 hover:border-white/40'}`}>All</button>
                   {categories.map(cat => (
                     <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-none px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-transparent border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 hover:border-white/40'}`}>{cat}</button>
                   ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {mergedDirectory.filter(ex => 
                   (ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || ex.primaryMuscle.toLowerCase().includes(searchTerm.toLowerCase())) && 
                   (!selectedCategory || ex.category === selectedCategory)
                 ).map(ex => {
                   const isSelected = recoverySelection.find(i => i.id === ex.id);
                   return (
                     <Card key={ex.id} onClick={() => toggleRecoverySelection(ex)} className={`border-white/5 p-6 flex justify-between items-center transition-all ${isSelected ? 'bg-gold/10 border-gold-solid' : 'bg-zinc-900/20 hover:bg-white/[0.04] hover:border-gold/40'}`}>
                       <div className="flex gap-5 items-center">
                          <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden border border-white/5"><img src={ex.animationUrl} className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`} alt={ex.name} /></div>
                          <div className="text-left"><h4 className={`font-bold uppercase tracking-tight text-sm ${isSelected ? 'text-gold' : 'text-white'}`}>{ex.name}</h4><p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-1">{ex.category}</p></div>
                       </div>
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/5 text-zinc-800 group-hover:text-gold group-hover:bg-white/10 group-hover:border-gold/30'}`}>{isSelected ? <Check size={18} /> : <Plus size={18} />}</div>
                     </Card>
                   );
                 })}
              </div>
           </div>
           <footer className="fixed bottom-0 left-0 right-0 p-8 bg-black/90 backdrop-blur-md border-t border-white/5 flex gap-4 z-[600] animate-in slide-in-from-bottom duration-500">
              <button onClick={handleFinalizePlan} disabled={recoverySelection.length === 0} className="flex-1 py-7 rounded-[32px] gold-metallic active:scale-95 transition-all shadow-2xl">Finalize Selection ({recoverySelection.length})</button>
           </footer>
        </div>
      )}

      <section className="w-full space-y-6"><div className="flex justify-between items-center px-2"><h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.5em]">Temporal Adherence</h3><CalendarIcon size={14} className="text-zinc-500" /></div><Card className="p-10 border-white/5 bg-[#080809] rounded-[48px] hover:border-gold/20 transition-all">{renderMonthCalendar()}</Card></section>
      
      <section className="w-full space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.5em]">Split Architecture</h3>
          <button onClick={onEditSplit} className="text-[9px] font-bold gold-text uppercase tracking-widest border-b border-gold pb-0.5 hover:text-white hover:border-white transition-all">Edit System</button>
        </div>
        <div className="space-y-4">
          {state.workoutPlan?.slice(0, 3).map((plan) => (
            <Card key={plan.id} className="flex items-center justify-between p-8 border-white/5 bg-zinc-900/10 hover:bg-white/[0.04] hover:border-gold/40 transition-all">
              <div className="flex items-center gap-6">
                <span className="text-[12px] font-bold text-zinc-500 tabular-nums">{plan.dayName.substring(0,3)}</span>
                <div>
                  <h4 className={`font-bold text-lg tracking-tight uppercase ${plan.exercises.length === 0 ? 'text-zinc-700' : 'text-white/90'}`}>{plan.focus}</h4>
                  <p className="text-[9px] text-zinc-600 uppercase font-semibold tracking-[0.2em] mt-1">{plan.exercises.length} Specialized Modules</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      
      {renderDailyRecord()}
      {showBioScan && <BiologicalScan onClose={() => setShowBioScan(false)} />}
    </div>
  );
};
