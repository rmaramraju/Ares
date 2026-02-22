
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, UserProfile, WorkoutDay, Meal, ViewType, ExerciseLog, WorkoutHistoryItem, Gender, BodyType, Goal, Routine, SetType, AIPersona, UnitSystem, DailyMetric, ExerciseMetadata, DayStatus, Theme } from './types.ts';
import { AresSyncEngine } from './syncService.ts';
import { Auth } from './Auth.tsx';
import { Onboarding } from './Onboarding.tsx';
import { PlanConfirmation } from './PlanConfirmation.tsx';
import { Dashboard } from './Dashboard.tsx';
import { WorkoutSession } from './WorkoutSession.tsx';
import { FoodTracker } from './FoodTracker.tsx';
import { Analytics } from './Analytics.tsx';
import { WorkoutEditor } from './WorkoutEditor.tsx';
import { ProfileSettings } from './ProfileSettings.tsx';
import { LayoutGrid, Utensils, BarChart3, PenTool, UserCircle2, CloudLightning } from 'lucide-react';
import { EXERCISE_DIRECTORY } from './exerciseDirectory.ts';
import { WearableService } from './wearableService.ts';
import { HapticService } from './hapticService.ts';

const App: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    rememberMe: false,
    isOnboarded: false,
    currentView: 'workouts',
    profile: null,
    routines: [],
    activeRoutineId: null,
    workoutPlan: null,
    splitStartDate: null,
    dailyMeals: [],
    mealHistory: {},
    activeWorkout: null,
    workoutStartTime: null,
    workoutHistory: [],
    activityLog: {},
    rescheduledWorkouts: {},
    pinnedMetrics: ['zpi-trend', 'volume-progression'],
    dailyMetricsHistory: [],
    weightHistory: [],
    lastResetDate: null,
    connectedWearables: [],
    persona: AIPersona.ARES,
    userExercises: [],
    theme: Theme.DARK
  });

  // Initial Load
  useEffect(() => {
    const init = async () => {
      const restored = await AresSyncEngine.loadState();
      if (restored) setState(restored);
    };
    init();
  }, []);

  // Continuous Auto-Sync Logic
  useEffect(() => {
    if (!state.isAuthenticated) return;
    
    const sync = async () => {
      setIsSyncing(true);
      await AresSyncEngine.saveState(state);
      setTimeout(() => setIsSyncing(false), 800);
    };

    const debounce = setTimeout(sync, 1500);
    return () => clearTimeout(debounce);
  }, [state]);

  // Daily Reset Logic
  useEffect(() => {
    if (!state.isOnboarded) return;

    const today = getLocalDateString(new Date());
    if (state.lastResetDate !== today) {
      setState(prev => {
        const lastDate = prev.lastResetDate;
        const newMealHistory = lastDate ? { ...prev.mealHistory, [lastDate]: prev.dailyMeals } : prev.mealHistory;
        
        return {
          ...prev,
          lastResetDate: today,
          mealHistory: newMealHistory,
          dailyMeals: prev.dailyMeals.map(m => ({ ...m, checked: false })),
          activeWorkout: prev.activeWorkout ? (prev.activeWorkout.id.startsWith('custom-') ? null : prev.activeWorkout) : null
        };
      });
    }
  }, [state.isOnboarded, state.lastResetDate]);

  const getLocalDateString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const updateDailyMetrics = async () => {
    const today = getLocalDateString(new Date());
    const todaysWorkouts = state.workoutHistory.filter(h => h.date === today);
    const todaysMeals = state.dailyMeals.filter(m => m.checked);
    
    const totalVolume = todaysWorkouts.reduce((acc, w) => {
      let vol = 0;
      (Object.values(w.logs) as ExerciseLog[][]).forEach(sets => {
        sets.forEach(s => {
          vol += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
          if (s.supersetWeight && s.supersetReps) {
            vol += (parseFloat(s.supersetWeight) || 0) * (parseFloat(s.supersetReps) || 0);
          }
        });
      });
      return acc + vol;
    }, 0);

    const totalProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);
    const totalCals = todaysMeals.reduce((acc, m) => acc + m.calories, 0);
    const totalCarbs = todaysMeals.reduce((acc, m) => acc + m.carbs, 0);
    const totalFats = todaysMeals.reduce((acc, m) => acc + m.fats, 0);
    const totalFiber = todaysMeals.reduce((acc, m) => acc + m.fiber, 0);

    const volumeTarget = 5000; 
    const proteinTarget = state.profile?.targetProtein || 180;
    const vScore = Math.min(50, (totalVolume / volumeTarget) * 50);
    const pScore = Math.min(50, (totalProtein / proteinTarget) * 50);

    let recoveryData = { 
      hrv: undefined as number | undefined, 
      readiness: undefined as number | undefined, 
      sleepHours: undefined as number | undefined,
      timeInBed: undefined as number | undefined,
      sleepEfficiency: undefined as number | undefined,
      rhr: undefined as number | undefined,
      sleepStages: undefined as { light: number; deep: number; rem: number; awake: number } | undefined,
      bedtime: undefined as string | undefined,
      wakeTime: undefined as string | undefined
    };
    if (state.connectedWearables.length > 0) {
      const telemetry = await WearableService.fetchFromProvider(state.connectedWearables[0]);
      if (telemetry) {
        recoveryData = {
          hrv: telemetry.hrv,
          readiness: telemetry.readiness,
          sleepHours: telemetry.sleepHours,
          timeInBed: telemetry.timeInBed,
          sleepEfficiency: telemetry.sleepEfficiency,
          rhr: telemetry.rhr,
          sleepStages: telemetry.sleepStages,
          bedtime: telemetry.bedtime,
          wakeTime: telemetry.wakeTime
        };
      }
    }

    const isWorkoutDone = todaysWorkouts.length > 0;
    const isFoodDone = state.dailyMeals.length > 0 && todaysMeals.length >= state.dailyMeals.length;
    
    let currentStatus: DayStatus | undefined = state.activityLog[today];
    if (currentStatus !== 'rest' && currentStatus !== 'sick') {
      if (isWorkoutDone && isFoodDone) currentStatus = 'full';
      else if (isWorkoutDone) currentStatus = 'workout_only';
      else if (isFoodDone) currentStatus = 'food_only';
      else currentStatus = undefined;
    }

    const newMetric: DailyMetric = {
      date: today,
      duration: todaysWorkouts.reduce((acc, w) => acc + w.duration, 0),
      volume: totalVolume,
      calories: totalCals,
      protein: totalProtein,
      carbs: totalCarbs,
      fats: totalFats,
      fiber: totalFiber,
      zpi: Math.round(vScore + pScore),
      weight: state.profile?.weight,
      ...recoveryData
    };

    setState(prev => {
      const filteredHistory = prev.dailyMetricsHistory.filter(m => m.date !== today);
      return {
        ...prev,
        dailyMetricsHistory: [...filteredHistory, newMetric],
        activityLog: currentStatus ? { ...prev.activityLog, [today]: currentStatus } : prev.activityLog
      };
    });
  };

  const handleOnboardingComplete = (profile: UserProfile, plans: any) => {
    HapticService.notificationSuccess();
    const workoutPlanWithMetadata = plans.workoutPlan.map((d: any) => ({
      ...d,
      id: Math.random().toString(36).substr(2, 9),
      exercises: d.exercises.map((ex: any) => {
        const match = [...EXERCISE_DIRECTORY, ...state.userExercises].find(m => 
          m.name.toLowerCase().includes(ex.name.toLowerCase()) || 
          ex.name.toLowerCase().includes(m.name.toLowerCase())
        );
        return {
          ...ex,
          metadata: match || undefined,
          setConfigs: Array.from({ length: ex.sets || 3 }, () => SetType.NORMAL)
        };
      })
    }));

    const todayStr = getLocalDateString(new Date());
    const initialRoutine: Routine = {
      id: 'initial-' + Date.now(),
      name: `ARES OFFICIAL PROTOCOL`,
      creator: 'Ares',
      days: workoutPlanWithMetadata
    };

    const totalCals = profile.maintenanceCalories;
    let p = 200, c = 250, f = 70, fib = 35;
    
    if (profile.goal === Goal.CUT) {
      p = profile.weight * 2.2;
      f = profile.weight * 0.7;
      c = (totalCals - (p * 4) - (f * 9)) / 4;
    } else if (profile.goal === Goal.BULK) {
      p = profile.weight * 2.0;
      f = profile.weight * 0.9;
      c = (totalCals - (p * 4) - (f * 9)) / 4;
    }

    setState(prev => ({
      ...prev,
      profile: { 
        ...profile, 
        unitSystem: UnitSystem.METRIC,
        restTimerDuration: 90,
        targetProtein: Math.round(p),
        targetCarbs: Math.round(c),
        targetFats: Math.round(f),
        targetFiber: Math.round(fib),
        persona: AIPersona.ARES
      },
      routines: [initialRoutine],
      activeRoutineId: initialRoutine.id,
      workoutPlan: workoutPlanWithMetadata,
      splitStartDate: todayStr,
      dailyMeals: plans.dietPlan.map((m: any) => ({ ...m, id: Math.random().toString(36).substr(2, 9), checked: false })),
      weightHistory: [{ date: todayStr, weight: profile.weight }],
      isOnboarded: true,
      currentView: 'workouts',
      persona: AIPersona.ARES
    }));
  };

  const handleWorkoutComplete = (durationSecs: number, logs: Record<string, ExerciseLog[]>) => {
    HapticService.protocolComplete();
    const todayStr = getLocalDateString(new Date());
    const historyEntry: WorkoutHistoryItem = {
      date: todayStr,
      focus: state.activeWorkout?.focus || 'Movement',
      duration: Math.floor(durationSecs / 60),
      calories: Math.floor(durationSecs * 0.12),
      logs: logs
    };

    setState(p => ({
      ...p,
      activeWorkout: null,
      workoutHistory: [...p.workoutHistory, historyEntry],
      activityLog: { ...p.activityLog, [todayStr]: 'full' },
      rescheduledWorkouts: { ...p.rescheduledWorkouts, [todayStr]: undefined as any }
    }));

    setTimeout(updateDailyMetrics, 500);
  };

  const handleRescheduleWorkout = (missedDate: string, targetDate: string, workout: WorkoutDay) => {
    HapticService.impactMedium();
    setState(prev => ({
      ...prev,
      rescheduledWorkouts: {
        ...prev.rescheduledWorkouts,
        [targetDate]: workout
      },
      activityLog: {
        ...prev.activityLog,
        [missedDate]: 'missed' 
      }
    }));
  };

  const handleLogout = () => {
    HapticService.impactHeavy();
    localStorage.clear();
    setState({
      isAuthenticated: false,
      rememberMe: false,
      isOnboarded: false,
      currentView: 'workouts',
      profile: null,
      routines: [],
      activeRoutineId: null,
      workoutPlan: null,
      splitStartDate: null,
      dailyMeals: [],
      mealHistory: {},
      activeWorkout: null,
      workoutStartTime: null,
      workoutHistory: [],
      activityLog: {},
      rescheduledWorkouts: {},
      pinnedMetrics: ['zpi-trend', 'volume-progression'],
      dailyMetricsHistory: [],
      weightHistory: [],
      lastResetDate: null,
      connectedWearables: [],
      persona: AIPersona.ARES,
      userExercises: [],
      theme: Theme.DARK
    });
  };

  const handleSkipDemo = () => {
    HapticService.impactMedium();
    const todayStr = getLocalDateString(new Date());
    const mockProfile: UserProfile = {
      name: 'Julian Sterling', 
      age: 32, weight: 85, height: 188, gender: Gender.MALE, bodyType: BodyType.MESOMORPH,
      unitSystem: UnitSystem.METRIC, selectedDays: [1, 2, 4, 5], gymDaysPerWeek: 4, goal: Goal.MAINTAIN, goalWeight: 82, currentBodyFat: 15, targetBodyFat: 12,
      cardioPreference: ['LISS'], cuisinePreference: 'Clean Modern', maintenanceCalories: 2950,
      targetProtein: 180, targetCarbs: 350, targetFats: 75, targetFiber: 40, joinDate: todayStr,
      planDurationMonths: 6, restTimerDuration: 90, persona: AIPersona.ARES
    };
    
    const defaultEx = EXERCISE_DIRECTORY[0];
    const mockRoutine: Routine = {
      id: 'skip-demo',
      name: `ARES PRIME PROTOCOL`,
      creator: 'Ares',
      days: [{ 
        id: '1', dayName: 'NODE 01', focus: 'Precision Anterior', exercises: [{
          name: defaultEx.name, sets: 3, reps: '10-12', instructions: 'Focus on peak contraction.',
          category: defaultEx.category, metadata: defaultEx, setConfigs: [SetType.NORMAL, SetType.NORMAL, SetType.NORMAL]
        }] 
      }]
    };

    setState(prev => ({
      ...prev,
      isAuthenticated: true, 
      rememberMe: true,
      isOnboarded: true, 
      profile: mockProfile, routines: [mockRoutine], activeRoutineId: mockRoutine.id, workoutPlan: mockRoutine.days, splitStartDate: todayStr,
      dailyMeals: [
        { id: 'm1', name: 'Macro-Optimized Breakfast', calories: 650, protein: 45, carbs: 70, fats: 15, fiber: 12, checked: false },
        { id: 'm2', name: 'Synthesis Lunch', calories: 800, protein: 60, carbs: 85, fats: 20, fiber: 10, checked: false }
      ],
      weightHistory: [{ date: todayStr, weight: 85 }],
      currentView: 'workouts',
      persona: AIPersona.ARES
    }));
  };

  const handleWearableToggle = async (id: string) => {
    HapticService.selection();
    const isConnecting = !state.connectedWearables.includes(id);
    if (isConnecting) {
      setIsSyncing(true);
      const telemetry = await WearableService.fetchFromProvider(id);
      if (telemetry) {
        HapticService.notificationSuccess();
      }
      setIsSyncing(false);
    }
    
    setState(prev => ({
      ...prev,
      connectedWearables: isConnecting ? [...prev.connectedWearables, id] : prev.connectedWearables.filter(w => w !== id)
    }));
  };

  const handleAddCustomExercise = (ex: ExerciseMetadata) => {
    HapticService.notificationSuccess();
    setState(prev => ({
      ...prev,
      userExercises: [...prev.userExercises, ex]
    }));
  };

  const activeRoutine = useMemo(() => {
    return state.routines.find(r => r.id === state.activeRoutineId) || state.routines[0] || null;
  }, [state.routines, state.activeRoutineId]);

  if (!state.isAuthenticated) return <Auth onAuthorize={async (remember) => { HapticService.notificationSuccess(); setState(s => ({...s, isAuthenticated: true, rememberMe: remember})); }} onSkip={handleSkipDemo} />;
  if (!state.isOnboarded) return <Onboarding onComplete={handleOnboardingComplete} />;

  const shouldHideNav = !!state.activeWorkout || !isNavVisible;

  return (
    <div className="min-h-screen flex flex-col items-center w-full">
      <div className={`fixed top-4 right-4 z-[999] px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center gap-2 transition-all duration-500 ${isSyncing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <CloudLightning size={10} className="text-gold animate-pulse" />
        <span className="text-[8px] font-black text-gold uppercase tracking-widest">Protocol Synced</span>
      </div>

      <main className="w-full max-w-md">
        {state.currentView === 'workouts' && (
          <Dashboard 
            state={{ ...state, workoutPlan: activeRoutine?.days || null }} 
            onStartWorkout={(w) => { HapticService.impactHeavy(); setState(p => ({ ...p, activeWorkout: w })); }} 
            onEditSplit={() => { HapticService.impactMedium(); setState(s => ({ ...s, currentView: 'edit_plan' })); }} 
            onToggleRestDay={(d) => { HapticService.impactMedium(); setState(prev => ({ ...prev, activityLog: { ...prev.activityLog, [d]: prev.activityLog[d] === 'rest' ? undefined : 'rest' } })); }}
            onRescheduleWorkout={handleRescheduleWorkout}
            onToggleNav={setIsNavVisible}
          />
        )}
        {state.currentView === 'food' && (
          <FoodTracker 
            meals={state.dailyMeals} profile={state.profile!}
            onToggle={(id) => { 
              HapticService.selection(); 
              setState(prev => ({ ...prev, dailyMeals: prev.dailyMeals.map(m => m.id === id ? { ...m, checked: !m.checked } : m) }));
              setTimeout(updateDailyMetrics, 100);
            } }
            onDelete={(id) => { 
              HapticService.impactHeavy(); 
              setState(prev => ({ ...prev, dailyMeals: prev.dailyMeals.filter(m => m.id !== id) }));
              setTimeout(updateDailyMetrics, 100);
            } }
            onAdd={(m) => { 
              HapticService.notificationSuccess(); 
              setState(prev => ({ ...prev, dailyMeals: [...prev.dailyMeals, { ...m, id: Math.random().toString(36).substr(2, 9), checked: false }] }));
              setTimeout(updateDailyMetrics, 100);
            } }
            onUpdateMeal={(m) => { 
              HapticService.impactMedium(); 
              setState(prev => ({ ...prev, dailyMeals: prev.dailyMeals.map(x => x.id === m.id ? m : x) }));
              setTimeout(updateDailyMetrics, 100);
            } }
            onUpdateProfile={(p) => setState(prev => ({ ...prev, profile: p }))}
            onBack={() => { HapticService.impactLight(); setState(s => ({ ...s, currentView: 'workouts' })); }} 
          />
        )}
        {state.currentView === 'analytics' && <Analytics state={state} onTogglePin={() => {}} onBack={() => { HapticService.impactLight(); setState(s => ({ ...s, currentView: 'workouts' })); }} />}
        {state.currentView === 'edit_plan' && (
          <WorkoutEditor 
            routines={state.routines || []} activeRoutineId={state.activeRoutineId} startDate={state.splitStartDate || getLocalDateString(new Date())}
            userExercises={state.userExercises}
            onSave={(updatedRoutines, activeId, date, duration) => { 
              HapticService.notificationSuccess(); 
              setState(prev => ({ 
                ...prev, 
                routines: updatedRoutines, 
                activeRoutineId: activeId, 
                splitStartDate: date, 
                currentView: 'workouts',
                profile: prev.profile ? { ...prev.profile, planDurationMonths: duration || prev.profile.planDurationMonths } : null
              })); 
            }}
            onCancel={() => { HapticService.impactLight(); setState(s => ({ ...s, currentView: 'workouts' })); }}
          />
        )}
        {state.currentView === 'profile' && (
          <ProfileSettings 
            state={state} 
            onUpdateProfile={(p) => { HapticService.impactMedium(); setState(prev => ({ ...prev, profile: p })); }} 
            onLogout={handleLogout} 
            onLogWeight={(w) => {
              HapticService.notificationSuccess();
              const t = getLocalDateString(new Date());
              setState(prev => ({ ...prev, profile: prev.profile ? { ...prev.profile, weight: w } : null, weightHistory: [...(prev.weightHistory || []), { date: t, weight: w }] }));
              setTimeout(updateDailyMetrics, 100);
            }} 
            onToggleWearable={handleWearableToggle} 
            onAddCustomExercise={handleAddCustomExercise}
            onToggleNav={setIsNavVisible}
            onUpdateTheme={(t) => setState(prev => ({ ...prev, theme: t }))}
          />
        )}
        {state.currentView === 'confirm_plan' && (
           <PlanConfirmation 
           workoutPlan={activeRoutine?.days || []} dietPlan={state.dailyMeals}
           onAccept={(d) => { HapticService.protocolComplete(); setState(prev => ({ ...prev, profile: prev.profile ? { ...prev.profile, planDurationMonths: d } : null, currentView: 'workouts' })); }}
           onRefine={() => { HapticService.impactMedium(); setState(s => ({ ...s, currentView: 'edit_plan' })); }}
         />
        )}
      </main>

      {!shouldHideNav && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-20 z-[200] flex items-center justify-center animate-in fade-in slide-in-from-bottom duration-500">
          <nav className="w-full h-full posh-card rounded-[32px] flex justify-around items-center px-4 shadow-2xl border-white/10" style={{ backgroundColor: 'var(--surface)' }}>
            {[ 
              { id: 'workouts', icon: LayoutGrid, label: 'HUB' }, 
              { id: 'food', icon: Utensils, label: 'FUEL' }, 
              { id: 'analytics', icon: BarChart3, label: 'DATA' }, 
              { id: 'edit_plan', icon: PenTool, label: 'SPLIT' }, 
              { id: 'profile', icon: UserCircle2, label: 'USER' } 
            ].map(item => (
              <button 
                key={item.id} 
                onClick={() => { HapticService.impactLight(); setState(s => ({ ...s, currentView: item.id as ViewType })); }} 
                className={`flex flex-col items-center gap-1 transition-all tap-feedback ${state.currentView === item.id ? 'nav-item-active scale-110' : 'text-zinc-500 opacity-60'}`}
              >
                <item.icon size={22} strokeWidth={state.currentView === item.id ? 2.5 : 2} />
                <span className="text-[7px] font-black uppercase tracking-[0.2em]">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {state.activeWorkout && (
        <WorkoutSession 
          workout={state.activeWorkout} restTimerDuration={state.profile?.restTimerDuration}
          onComplete={handleWorkoutComplete}
          onCancel={() => { HapticService.impactHeavy(); setState(p => ({ ...p, activeWorkout: null })); }}
        />
      )}
    </div>
  );
};

export default App;
