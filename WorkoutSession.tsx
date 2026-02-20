
import React, { useState, useEffect } from 'react';
import { WorkoutDay, ExerciseLog, SetType } from './types';
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
  Zap
} from 'lucide-react';

interface WorkoutSessionProps {
  workout: WorkoutDay;
  onComplete: (duration: number, logs: Record<string, ExerciseLog[]>) => void;
  onCancel: () => void;
  restTimerDuration?: number;
  connected?: boolean;
}

const formatTime = (s: number) => {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const WorkoutSession: React.FC<WorkoutSessionProps> = ({ workout, onComplete, onCancel, restTimerDuration = 90 }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog[]>>({});
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [activeInfo, setActiveInfo] = useState<number | null>(null);
  const [showVideo, setShowVideo] = useState(true);
  
  const currentExercise = workout.exercises[currentIdx];
  const isCardio = !!currentExercise?.metadata?.isCardio;

  // Initialize session state
  useEffect(() => {
    const initialLogs: Record<string, ExerciseLog[]> = {};
    workout.exercises.forEach(ex => {
      initialLogs[ex.name] = Array.from({ length: ex.sets || 3 }, (_, i) => ({
        weight: '',
        reps: '',
        rir: '',
        completed: false,
        type: (ex.setConfigs && ex.setConfigs[i]) || SetType.NORMAL
      }));
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
      mute: '1',
      controls: '0',
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
                  <h2 className={`text-4xl font-light tracking-tight text-white uppercase leading-tight ${isCardio ? 'text-white' : ''}`}>{currentExercise.name}</h2>
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

          <div className={`space-y-4 transition-opacity duration-300 ${isResting ? 'opacity-80' : 'opacity-100'}`}>
            {logs.map((log, idx) => {
              const rowDisabled = isResting && !log.completed;
              return (
                <div key={idx} className={`grid grid-cols-6 gap-3 items-center p-4 rounded-[28px] border transition-all duration-500 ${log.completed ? 'bg-gold/5 border-gold-solid' : 'bg-white/[0.02] border-white/5'} ${rowDisabled ? 'grayscale-[0.5]' : ''}`}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1">
                        <span className="text-[7px] text-zinc-700 font-bold uppercase">{isCardio ? 'B' : 'S'} {idx+1}</span>
                        <button 
                          onMouseEnter={() => setActiveInfo(idx)}
                          onMouseLeave={() => setActiveInfo(null)}
                          onClick={() => setActiveInfo(activeInfo === idx ? null : idx)}
                          className="text-zinc-800 hover:text-gold transition-colors"
                        >
                          <HelpCircle size={10} />
                        </button>
                    </div>
                    <div className="relative">
                        <select 
                          disabled={isResting}
                          value={log.type}
                          onChange={(e) => updateLog(idx, 'type', e.target.value as SetType)}
                          className={`bg-zinc-900 text-[10px] font-black border rounded-lg px-2 py-1.5 outline-none transition-all appearance-none text-center ${log.type !== SetType.NORMAL ? 'border-gold/40 text-gold' : 'border-white/5 text-zinc-500'} ${isResting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <option value={SetType.NORMAL}>N</option>
                          <option value={SetType.DROPSET}>D</option>
                          <option value={SetType.SUPERSET}>S</option>
                          <option value={SetType.FAILURE}>F</option>
                        </select>
                        {activeInfo === idx && (
                          <div className="absolute z-50 bottom-full left-0 w-36 mb-2 p-3 bg-zinc-900 border border-white/10 rounded-xl text-[8px] text-zinc-400 leading-tight shadow-2xl animate-in fade-in slide-in-from-bottom-1 pointer-events-none">
                            <p className="font-bold gold-text mb-1 uppercase tracking-widest">{log.type}</p>
                            {SET_TYPE_DESCRIPTIONS[log.type]}
                          </div>
                        )}
                    </div>
                  </div>

                  <input 
                    disabled={isResting} 
                    type="text" 
                    placeholder={isCardio ? "KM/M" : "KG"} 
                    value={log.weight} 
                    onChange={(e) => updateLog(idx, 'weight', e.target.value)} 
                    className={`col-span-1 w-full bg-black/40 border-none rounded-xl p-3 text-[11px] text-center font-medium text-white outline-none focus:ring-1 focus:ring-gold/30 ${isResting ? 'opacity-30' : ''}`} 
                  />
                  <input 
                    disabled={isResting} 
                    type="text" 
                    placeholder={isCardio ? "TIME" : "RPS"} 
                    value={log.reps} 
                    onChange={(e) => updateLog(idx, 'reps', e.target.value)} 
                    className={`col-span-1 w-full bg-black/40 border-none rounded-xl p-3 text-[11px] text-center font-medium text-white outline-none focus:ring-1 focus:ring-gold/30 ${isResting ? 'opacity-30' : ''}`} 
                  />
                  <input 
                    disabled={isResting} 
                    type="text" 
                    placeholder={isCardio ? "RPE" : "RIR"} 
                    value={log.rir} 
                    onChange={(e) => updateLog(idx, 'rir', e.target.value)} 
                    className={`col-span-1 w-full bg-black/40 border-none rounded-xl p-3 text-[11px] text-center font-bold text-gold outline-none focus:ring-1 focus:ring-gold/30 ${isResting ? 'opacity-30' : ''}`} 
                  />
                  
                  <div className="col-span-2 flex justify-end">
                    <button 
                      disabled={rowDisabled}
                      onClick={() => updateLog(idx, 'completed', !log.completed)} 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${log.completed ? 'gold-bg text-black shadow-lg shadow-gold/20 scale-110' : 'bg-zinc-900 text-zinc-700 border border-white/5'} ${rowDisabled ? 'opacity-20 cursor-not-allowed' : ''}`}
                    >
                      {rowDisabled ? <Lock size={14} /> : <Check size={16} strokeWidth={3} />}
                    </button>
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
              onClick={() => onComplete(sessionTimer, exerciseLogs)} 
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
