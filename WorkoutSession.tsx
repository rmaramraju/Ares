
import React, { useState, useEffect } from 'react';
import { WorkoutDay, ExerciseLog, SetType, WarmUpExercise, WarmUpSubCategory } from './types';
import { SET_TYPE_DESCRIPTIONS } from './exerciseDirectory';
import { Card } from './components/Card';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Check, 
  Clock, 
  Timer, 
  HelpCircle,
  Lock,
  Play as PlayIcon,
  VideoOff,
  Wind,
  Zap,
  SkipForward,
  Info,
  Flame,
  Dumbbell,
  RefreshCcw
} from 'lucide-react';
import { HapticService } from './hapticService';

interface WorkoutSessionProps {
  workout: WorkoutDay;
  warmupSequence: WarmUpExercise[];
  onComplete: (duration: number, logs: Record<string, ExerciseLog[]>, warmupLogs?: Record<string, boolean>, warmupSkipped?: boolean) => void;
  onCancel: () => void;
  restTimerDuration?: number;
  connected?: boolean;
}

const formatTime = (s: number) => {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const WorkoutSession: React.FC<WorkoutSessionProps> = ({ workout, warmupSequence, onComplete, onCancel, restTimerDuration = 90 }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog[]>>({});
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [activeInfo, setActiveInfo] = useState<number | null>(null);
  const [showVideo, setShowVideo] = useState(true);
  
  // Warmup State
  const [isWarmupPhase, setIsWarmupPhase] = useState(warmupSequence.length > 0);
  const [warmupLogs, setWarmupLogs] = useState<Record<string, boolean>>({});
  const [currentWarmupIdx, setCurrentWarmupIdx] = useState(0);
  const [warmupSkipped, setWarmupSkipped] = useState(false);
  
  const currentExercise = workout.exercises[currentIdx];
  const isCardio = !!currentExercise?.metadata?.isCardio;

  // Initialize session state
  useEffect(() => {
    const initialLogs: Record<string, ExerciseLog[]> = {};
    workout.exercises.forEach((ex) => {
      initialLogs[ex.name] = Array.from({ length: ex.sets || 3 }, (_, i) => {
        let type = SetType.NORMAL;
        if (ex.setConfigs && ex.setConfigs[i]) {
          type = ex.setConfigs[i];
        }

        return {
          weight: '',
          reps: '',
          rir: '',
          completed: false,
          type,
          supersetWeight: ex.supersetPartner ? '' : undefined,
          supersetReps: ex.supersetPartner ? '' : undefined
        };
      });
    });
    setExerciseLogs(initialLogs);
  }, [workout.id]);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => setSessionTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Rest timer
  useEffect(() => {
    if (restRemaining !== null && restRemaining > 0) {
      const timer = setInterval(() => setRestRemaining(r => r ? r - 1 : 0), 1000);
      return () => clearInterval(timer);
    } else if (restRemaining === 0) {
      setRestRemaining(null);
    }
  }, [restRemaining]);

  const updateLog = (setIdx: number, field: keyof ExerciseLog, value: any) => {
    if (!currentExercise || !exerciseLogs[currentExercise.name]) return;
    setExerciseLogs(prev => {
      const currentLogs = [...(prev[currentExercise.name] || [])];
      if (!currentLogs[setIdx]) return prev;
      
      const wasCompleted = currentLogs[setIdx].completed;
      currentLogs[setIdx] = { ...currentLogs[setIdx], [field]: value };
      
      // Trigger rest timer on completion, reset if unchecked
      if (field === 'completed') {
        if (value === true && !wasCompleted) {
          setRestRemaining(restTimerDuration);
        } else if (value === false && wasCompleted) {
          setRestRemaining(null);
        }
      }
      return { ...prev, [currentExercise.name]: currentLogs };
    });
  };

  const handleComplete = () => {
    onComplete(sessionTimer, exerciseLogs, warmupLogs, warmupSkipped);
  };

  if (isWarmupPhase && warmupSequence.length > 0) {
    const currentWarmup = warmupSequence[currentWarmupIdx];
    if (!currentWarmup) {
      setIsWarmupPhase(false);
      return null;
    }
    const progress = ((currentWarmupIdx + 1) / warmupSequence.length) * 100;

    return (
      <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center">
        <div className="w-full max-w-md h-full flex flex-col">
          <header className="px-8 py-8 flex justify-between items-center bg-[#050505] border-b border-white/[0.03]">
            <button onClick={onCancel} className="p-3 bg-white/5 rounded-full text-zinc-600 hover:text-white transition-all"><X size={18} /></button>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame size={12} className="text-gold animate-pulse" />
                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-[0.4em]">Preparation Phase</p>
              </div>
              <h1 className="text-lg font-medium tracking-tight uppercase text-white/90">Neural & Joint Prep</h1>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-bold text-gold">
              {currentWarmupIdx + 1}/{warmupSequence.length}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-10 space-y-8 no-scrollbar">
            <div className="text-center space-y-6">
                <div className="w-full aspect-video rounded-[32px] overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl relative">
                   {currentWarmup.youtubeId ? (
                      <iframe 
                        className="w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${currentWarmup.youtubeId}?autoplay=0&controls=1`}
                        title={currentWarmup.name}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                      ></iframe>
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-zinc-900/50">
                        <VideoOff className="text-zinc-800" size={48} />
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Visual Archive Unavailable</p>
                      </div>
                   )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-gold/10 text-gold text-[8px] font-black uppercase tracking-widest border border-gold/20">
                      {currentWarmup.subCategory}
                    </span>
                  </div>
                  <h2 className="text-4xl font-light tracking-tight text-white uppercase leading-tight text-center">
                    {currentWarmup.name}
                  </h2>
                  <div className="flex items-center justify-center gap-8">
                      {currentWarmup.reps && (
                        <div className="text-center">
                          <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.2em] mb-1">GOAL</p>
                          <p className="text-sm font-medium text-gold tracking-widest uppercase">{currentWarmup.reps}</p>
                        </div>
                      )}
                      {currentWarmup.durationSeconds && (
                        <>
                          {currentWarmup.reps && <div className="w-px h-6 bg-white/[0.05]" />}
                          <div className="text-center">
                            <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.2em] mb-1">DURATION</p>
                            <p className="text-sm font-medium text-gold tracking-widest uppercase">{currentWarmup.durationSeconds}S</p>
                          </div>
                        </>
                      )}
                  </div>
                </div>
            </div>

            <Card className="p-8 bg-white/[0.02] border-white/5 space-y-4">
              <div className="flex items-start gap-4 text-zinc-400">
                <Info size={16} className="text-gold shrink-0 mt-1" />
                <p className="text-xs leading-relaxed">{currentWarmup.instructions}</p>
              </div>
            </Card>

            <div className="relative h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gold transition-all duration-700 shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <footer className="p-8 border-t border-white/[0.03] bg-[#050505] flex items-center gap-4">
            <button 
              onClick={() => {
                setWarmupSkipped(true);
                setIsWarmupPhase(false);
                HapticService.impactMedium();
              }}
              className="flex-1 h-16 rounded-[24px] bg-white/5 text-zinc-500 flex items-center justify-center gap-2 hover:text-white transition-all border border-white/5"
            >
              <SkipForward size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Skip Prep</span>
            </button>

            <button 
              onClick={() => {
                setWarmupLogs(prev => ({ ...prev, [currentWarmup.name]: true }));
                if (currentWarmupIdx < warmupSequence.length - 1) {
                  setCurrentWarmupIdx(prev => prev + 1);
                  HapticService.impactHeavy();
                } else {
                  setIsWarmupPhase(false);
                  HapticService.notificationSuccess();
                }
              }}
              className="flex-[2] h-16 rounded-[24px] gold-bg text-black flex items-center justify-center gap-2 font-black uppercase tracking-widest shadow-lg shadow-gold/20"
            >
              <Check size={18} strokeWidth={3} />
              <span>Complete Drill</span>
            </button>
          </footer>
        </div>
      </div>
    );
  }

  if (!currentExercise || !exerciseLogs[currentExercise.name]) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center space-y-6">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] gold-text font-bold uppercase tracking-[0.5em] animate-pulse">Initializing Deployment...</p>
      </div>
    );
  }

  const logs = exerciseLogs[currentExercise.name];
  const isResting = restRemaining !== null;
  const allSetsCompleted = logs.every(log => log.completed);
  const isNextLocked = isResting || !allSetsCompleted;

  const getYouTubeUrl = (id: string) => {
    const baseUrl = `https://www.youtube-nocookie.com/embed/${id}`;
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '0',
      controls: '1',
      loop: '1',
      playlist: id,
      rel: '0',
      modestbranding: '1',
      enablejsapi: '0',
      iv_load_policy: '3'
    });
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center">
      <div className="w-full max-w-md h-full flex flex-col">
        <header className="px-8 py-8 flex justify-between items-center bg-[#050505] border-b border-white/[0.03]">
          <button onClick={onCancel} className="p-3 bg-white/5 rounded-full text-zinc-600 hover:text-white transition-all"><X size={18} /></button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock size={12} className="text-gold" />
              <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-[0.4em] tabular-nums">{formatTime(sessionTimer)}</p>
            </div>
            <h1 className="text-lg font-medium tracking-tight uppercase text-white/90">{workout.focus}</h1>
          </div>
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-bold text-gold">
            {currentIdx + 1}/{workout.exercises.length}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-10 space-y-8 no-scrollbar">
          <div className="text-center space-y-6">
              <div className={`w-full aspect-video rounded-[32px] overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl relative ${isCardio ? 'ring-1 ring-gold/20' : ''}`}>
                 {currentExercise.metadata?.youtubeId && showVideo ? (
                    <iframe 
                      className="w-full h-full"
                      src={getYouTubeUrl(currentExercise.metadata.youtubeId)}
                      title={currentExercise.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    ></iframe>
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-zinc-900/50">
                       {currentExercise.metadata?.youtubeId ? (
                         <>
                            <PlayIcon className="text-zinc-800" size={48} />
                            <button onClick={() => setShowVideo(true)} className="text-[10px] font-bold gold-text uppercase tracking-widest">Restore Tutorial</button>
                         </>
                       ) : (
                         <>
                            {isCardio ? <Wind className="text-zinc-800" size={48} /> : <VideoOff className="text-zinc-800" size={48} />}
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Visual Archive Unavailable</p>
                         </>
                       )}
                    </div>
                 )}
                 {currentExercise.metadata?.youtubeId && (
                   <button 
                    onClick={() => setShowVideo(!showVideo)}
                    className="absolute bottom-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-lg text-zinc-400 hover:text-white transition-all border border-white/10"
                   >
                     {showVideo ? <X size={12} /> : <PlayIcon size={12} />}
                   </button>
                 )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  {isCardio && <Wind className="text-gold" size={16} />}
                  <h2 className={`text-4xl font-light tracking-tight text-white uppercase leading-tight text-center ${isCardio ? 'text-white' : ''}`}>
                    {currentExercise.name}
                    {currentExercise.supersetPartner && (
                      <>
                        <span className="block text-gold text-lg font-black my-2">&</span>
                        <span className="block text-2xl opacity-80">{currentExercise.supersetPartner.name}</span>
                      </>
                    )}
                  </h2>
                </div>
                <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.2em] mb-1">
                        {isCardio ? 'GOAL' : 'INTENSITY'}
                      </p>
                      <p className="text-sm font-medium text-gold tracking-widest uppercase">
                        {isCardio ? (currentExercise.reps.includes(':') ? currentExercise.reps : `${currentExercise.reps} KM`) : `${currentExercise.reps} REPS`}
                      </p>
                    </div>
                    <div className="w-px h-6 bg-white/[0.05]" />
                    <div className="text-center">
                      <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.2em] mb-1">
                        {isCardio ? 'INTERVALS' : 'VOLUME'}
                      </p>
                      <p className="text-sm font-medium text-gold tracking-widest uppercase">{currentExercise.sets} {isCardio ? 'BOUTS' : 'SETS'}</p>
                    </div>
                </div>
              </div>
          </div>

          {isResting && (
            <Card className="bg-gold/5 border-gold/30 p-8 flex items-center justify-between animate-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-full border border-gold/40 flex items-center justify-center text-gold"><Timer size={18} /></div>
                <div>
                  <p className="text-[9px] text-gold font-bold uppercase tracking-widest">Neural Recovery Window</p>
                  <p className="text-xl font-light tabular-nums">{formatTime(restRemaining)}</p>
                </div>
              </div>
              <button onClick={() => setRestRemaining(null)} className="px-4 py-2 bg-white/5 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:text-white transition-colors">Skip</button>
            </Card>
          )}

          <div className={`space-y-6 transition-opacity duration-300 ${isResting ? 'opacity-80' : 'opacity-100'}`}>
            {logs.map((log, idx) => {
              const rowDisabled = isResting && !log.completed;
              const isSuperset = !!currentExercise.supersetPartner;

              return (
                <div key={idx} className={`flex flex-col gap-6 p-6 rounded-[32px] border transition-all duration-500 ${log.completed ? 'bg-gold/5 border-gold-solid shadow-[0_0_20px_rgba(212,175,55,0.05)]' : 'bg-white/[0.02] border-white/5'} ${rowDisabled ? 'grayscale-[0.5]' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${log.type === SetType.WARMUP ? 'text-gold' : 'text-zinc-700'}`}>
                        {log.type === SetType.WARMUP ? 'Warmup' : isCardio ? 'Bout' : 'Set'} {idx+1}
                      </span>
                      {!isSuperset && (
                        <div className="relative">
                          <select 
                            disabled={isResting}
                            value={log.type}
                            onChange={(e) => updateLog(idx, 'type', e.target.value as SetType)}
                            className={`bg-zinc-900 text-[10px] font-black border rounded-lg px-2 py-1.5 outline-none transition-all appearance-none text-center ${log.type !== SetType.NORMAL ? 'border-gold/40 text-gold' : 'border-white/5 text-zinc-500'}`}
                          >
                            <option value={SetType.NORMAL}>NORMAL</option>
                            <option value={SetType.DROPSET}>DROPSET</option>
                            <option value={SetType.FAILURE}>FAILURE</option>
                          </select>
                        </div>
                      )}
                      {isSuperset && (
                        <span className="text-[8px] bg-gold/10 text-gold px-2 py-1 rounded font-black tracking-widest uppercase">Superset</span>
                      )}
                    </div>
                    <button 
                      disabled={rowDisabled}
                      onClick={() => updateLog(idx, 'completed', !log.completed)} 
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${log.completed ? 'gold-bg text-black shadow-lg shadow-gold/20 scale-110' : 'bg-zinc-900 text-zinc-700 border border-white/5'}`}
                    >
                      {log.completed ? <Check size={20} strokeWidth={3} /> : <Check size={20} strokeWidth={3} className="opacity-20" />}
                    </button>
                  </div>

                  <div className="space-y-6">
                    {isSuperset ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest ml-1 truncate">{currentExercise.name} KG</p>
                            <input 
                              disabled={isResting} 
                              type="text" 
                              placeholder="KG" 
                              value={log.weight} 
                              onChange={(e) => updateLog(idx, 'weight', e.target.value)} 
                              className="w-full bg-black/40 border-none rounded-2xl p-4 text-xs text-center font-medium text-white outline-none focus:ring-1 focus:ring-gold/30" 
                            />
                          </div>
                          <div className="space-y-2">
                            <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest ml-1 truncate">{currentExercise.supersetPartner?.name} KG</p>
                            <input 
                              disabled={isResting} 
                              type="text" 
                              placeholder="KG" 
                              value={log.supersetWeight || ''} 
                              onChange={(e) => updateLog(idx, 'supersetWeight', e.target.value)} 
                              className="w-full bg-gold/5 border border-gold/10 rounded-2xl p-4 text-xs text-center font-medium text-white outline-none focus:ring-1 focus:ring-gold/30" 
                            />
                          </div>
                        </div>
                        <div className={`grid ${log.type === SetType.WARMUP ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                          <div className="space-y-2">
                            <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest ml-1">REPS</p>
                            <input 
                              disabled={isResting} 
                              type="text" 
                              placeholder="REPS" 
                              value={log.reps} 
                              onChange={(e) => updateLog(idx, 'reps', e.target.value)} 
                              className="w-full bg-black/40 border-none rounded-2xl p-4 text-xs text-center font-medium text-white outline-none focus:ring-1 focus:ring-gold/30" 
                            />
                          </div>
                          {log.type !== SetType.WARMUP && (
                            <div className="space-y-2">
                              <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest ml-1">RIR</p>
                              <input 
                                disabled={isResting} 
                                type="text" 
                                placeholder="RIR" 
                                value={log.rir} 
                                onChange={(e) => updateLog(idx, 'rir', e.target.value)} 
                                className="w-full bg-black/40 border-none rounded-2xl p-4 text-xs text-center font-bold text-gold outline-none focus:ring-1 focus:ring-gold/30" 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={`grid ${log.type === SetType.WARMUP ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                        <div className="col-span-1 space-y-2">
                          <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest ml-1">{isCardio ? 'KM/M' : 'KG'}</p>
                          <input 
                            disabled={isResting} 
                            type="text" 
                            placeholder={isCardio ? "KM/M" : "KG"} 
                            value={log.weight} 
                            onChange={(e) => updateLog(idx, 'weight', e.target.value)} 
                            className="w-full bg-black/40 border-none rounded-2xl p-4 text-xs text-center font-medium text-white outline-none focus:ring-1 focus:ring-gold/30" 
                          />
                        </div>
                        <div className="col-span-1 space-y-2">
                          <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest ml-1">{isCardio ? 'TIME' : 'REPS'}</p>
                          <input 
                            disabled={isResting} 
                            type="text" 
                            placeholder={isCardio ? "TIME" : "REPS"} 
                            value={log.reps} 
                            onChange={(e) => updateLog(idx, 'reps', e.target.value)} 
                            className="w-full bg-black/40 border-none rounded-2xl p-4 text-xs text-center font-medium text-white outline-none focus:ring-1 focus:ring-gold/30" 
                          />
                        </div>
                        {log.type !== SetType.WARMUP && (
                          <div className="col-span-1 space-y-2">
                            <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest ml-1">{isCardio ? 'RPE' : 'RIR'}</p>
                            <input 
                              disabled={isResting} 
                              type="text" 
                              placeholder={isCardio ? "RPE" : "RIR"} 
                              value={log.rir} 
                              onChange={(e) => updateLog(idx, 'rir', e.target.value)} 
                              className="w-full bg-black/40 border-none rounded-2xl p-4 text-xs text-center font-bold text-gold outline-none focus:ring-1 focus:ring-gold/30" 
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="p-8 border-t border-white/[0.03] bg-[#050505] flex items-center gap-6">
          <button disabled={currentIdx === 0 || isResting} onClick={() => setCurrentIdx(i => i - 1)} className={`p-5 rounded-[28px] border border-white/5 transition-all active:scale-90 ${isResting ? 'opacity-10' : 'bg-zinc-900/40 text-zinc-700'}`}><ChevronLeft size={24} /></button>
          
          {currentIdx === workout.exercises.length - 1 ? (
            <button 
              disabled={isNextLocked}
              onClick={handleComplete} 
              className={`flex-1 font-bold h-16 rounded-[32px] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${isNextLocked ? 'bg-zinc-900 text-zinc-700 border border-white/5 opacity-50 cursor-not-allowed' : 'gold-bg text-black shadow-gold/30'}`}
            >
              {isNextLocked ? <Lock size={18} /> : <CheckCircle2 size={18} strokeWidth={2.5} />}
              <span className="tracking-[0.3em] text-[10px] uppercase">
                {!allSetsCompleted ? 'Sets Incomplete' : isResting ? 'Recovering' : 'Finalize'}
              </span>
            </button>
          ) : (
            <button 
              disabled={isNextLocked}
              onClick={() => setCurrentIdx(i => i + 1)} 
              className={`flex-1 font-bold h-16 rounded-[32px] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${isNextLocked ? 'bg-zinc-900 text-zinc-700 border border-white/5 opacity-50 cursor-not-allowed' : 'bg-white text-black'}`}
            >
              <span className="tracking-[0.3em] text-[10px] uppercase">
                 {!allSetsCompleted ? 'Complete Sets' : isResting ? 'Recovering' : 'Next Module'}
              </span>
              {isNextLocked ? <Lock size={18} /> : <ChevronRight size={18} strokeWidth={2.5} />}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
