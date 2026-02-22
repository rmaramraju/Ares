
import React, { useState, useMemo } from 'react';
import { AppState, DailyMetric, MuscleGroup, ExerciseLog, Goal, UnitSystem } from './types.ts';
import { Card } from './components/Card.tsx';
import { EXERCISE_DIRECTORY } from './exerciseDirectory.ts';
import { HapticService } from './hapticService.ts';
import { 
  ArrowLeft, 
  Layers, 
  Dumbbell, 
  Utensils, 
  Target, 
  TrendingUp, 
  Scale, 
  Moon, 
  Battery, 
  Zap, 
  Clock,
  CalendarDays,
  Activity,
  ArrowRight,
  TrendingDown,
  ChevronRight,
  Info,
  Timer,
  LayoutGrid,
  Calendar,
  X,
  Lock,
  Cpu,
  RefreshCw,
  Search,
  CheckCircle,
  BarChart3,
  Flame,
  Dices,
  Sparkles,
  Telescope,
  Orbit,
  Milestone,
  Gauge,
  TimerReset,
  Check
} from 'lucide-react';

interface AnalyticsProps {
  state: AppState;
  onTogglePin: (metricId: string) => void;
  onBack: () => void;
}

type RangeType = '7D' | '30D' | '90D' | 'ALL' | 'CUSTOM';

const CATEGORIES = [
  { id: 'Overview', icon: Layers },
  { id: 'Muscles', icon: Target },
  { id: 'Training', icon: Dumbbell },
  { id: 'Weight', icon: Scale },
  { id: 'Nutrition', icon: Utensils },
  { id: 'Rest', icon: Moon }
];

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Glutes'];

const SimpleLineChart = ({ data, color = "#D4AF37", target = null, labels = [] }: { data: number[], color?: string, target?: number | null, labels?: string[] }) => {
  if (data.length === 0) return <div className="h-full flex items-center justify-center text-[8px] text-zinc-800 uppercase tracking-widest p-10 border border-dashed border-white/5 rounded-3xl">Awaiting Telemetry...</div>;
  
  const displayData = data.length === 1 ? [data[0], data[0]] : data;
  const max = Math.max(...displayData, target || 0) * 1.1 || 1;
  const min = Math.min(...displayData, target || 0) * 0.9 || 0;
  const range = max - min || 1;
  const height = 100;
  const width = 300;
  
  const points = displayData.map((val, i) => {
    const x = (i / Math.max(1, displayData.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const targetLineY = target !== null ? height - ((target - min) / range) * height : null;

  return (
    <div className="w-full h-[140px] relative mt-4">
      <svg viewBox={`0 -10 ${width} ${height + 20}`} className="w-full h-full overflow-visible">
        {targetLineY !== null && <line x1="0" y1={targetLineY} x2={width} y2={targetLineY} stroke="rgba(212,175,55,0.2)" strokeWidth="1" strokeDasharray="4 2" />}
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" points={points} className="drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
        {displayData.map((val, i) => {
          const x = (i / Math.max(1, displayData.length - 1)) * width;
          const y = height - ((val - min) / range) * height;
          const isLabelVisible = labels.length <= 7 || i % Math.ceil(labels.length / 7) === 0;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3.5" fill={color} stroke="#000" strokeWidth="1" />
              {isLabelVisible && labels[i] && <text x={x} y={y - 8} fill="rgba(255,255,255,0.3)" fontSize="6" textAnchor="middle" className="font-bold uppercase tracking-tighter">{labels[i]}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const SimpleBarChart = ({ data, color = "#D4AF37", labels = [] }: { data: number[], color?: string, labels?: string[] }) => {
  if (data.length === 0) return <div className="h-full flex items-center justify-center text-[8px] text-zinc-800 uppercase tracking-widest p-10 border border-dashed border-white/5 rounded-3xl">Awaiting Telemetry...</div>;
  const max = Math.max(...data) * 1.1 || 1;
  const height = 100;
  const width = 300;
  const barWidth = (width / data.length) * 0.6;
  const gap = (width / data.length) * 0.4;

  return (
    <div className="w-full h-[140px] relative mt-4">
      <svg viewBox={`0 -10 ${width} ${height + 20}`} className="w-full h-full overflow-visible">
        {data.map((val, i) => {
          const x = i * (barWidth + gap);
          const barHeight = (val / max) * height;
          const y = height - barHeight;
          const isLabelVisible = labels.length <= 7 || i % Math.ceil(labels.length / 7) === 0;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx="2" className="opacity-80 hover:opacity-100 transition-opacity" />
              {isLabelVisible && labels[i] && <text x={x + barWidth/2} y={height + 12} fill="rgba(255,255,255,0.2)" fontSize="5" textAnchor="middle" className="font-bold uppercase tracking-widest">{labels[i]}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const RadarChart = ({ data }: { data: { name: string, percentage: number }[] }) => {
  const size = 300;
  const center = size / 2;
  const radius = center * 0.7;
  const angleStep = (Math.PI * 2) / Math.max(1, data.length);

  const points = data.map((d, i) => {
    const r = radius * (Math.min(100, Math.max(5, d.percentage)) / 100);
    const x = center + r * Math.cos(i * angleStep - Math.PI / 2);
    const y = center + r * Math.sin(i * angleStep - Math.PI / 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative flex items-center justify-center p-4">
      <svg width={size} height={size} className="overflow-visible">
        {[0.25, 0.5, 0.75, 1].map(lvl => (
          <polygon key={lvl} points={data.map((_, i) => {
            const r = radius * lvl;
            const x = center + r * Math.cos(i * angleStep - Math.PI / 2);
            const y = center + r * Math.sin(i * angleStep - Math.PI / 2);
            return `${x},${y}`;
          }).join(' ')} fill="none" stroke="rgba(212,175,55,0.05)" strokeWidth="1" />
        ))}
        {data.map((_, i) => (
          <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(i * angleStep - Math.PI / 2)} y2={center + radius * Math.sin(i * angleStep - Math.PI / 2)} stroke="rgba(212,175,55,0.05)" strokeWidth="1" />
        ))}
        <polygon points={points} fill="rgba(212,175,55,0.15)" stroke="#D4AF37" strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = center + (radius + 24) * Math.cos(i * angleStep - Math.PI / 2);
          const y = center + (radius + 24) * Math.sin(i * angleStep - Math.PI / 2);
          return <text key={i} x={x} y={y} fill="rgba(255,255,255,0.4)" fontSize="8" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" className="uppercase tracking-widest">{d.name.substring(0,3)}</text>;
        })}
      </svg>
    </div>
  );
};

export const Analytics: React.FC<AnalyticsProps> = ({ state, onTogglePin, onBack }) => {
  const getLocalDateString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [activeTab, setActiveTab] = useState('Overview');
  const [rangeType, setRangeType] = useState<RangeType>('7D');
  const [customRange, setCustomRange] = useState({ 
    start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), 
    end: getLocalDateString(new Date()) 
  });
  const [showRangeModal, setShowRangeModal] = useState(false);

  const isMetric = state.profile?.unitSystem === UnitSystem.METRIC;

  const filteredMetrics = useMemo(() => {
    if (rangeType === 'CUSTOM' && customRange.start && customRange.end) {
      return state.dailyMetricsHistory.filter(m => m.date >= customRange.start && m.date <= customRange.end).sort((a,b) => a.date.localeCompare(b.date));
    }
    const days = rangeType === '7D' ? 7 : rangeType === '30D' ? 30 : rangeType === '90D' ? 90 : 9999;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = getLocalDateString(cutoff);
    return state.dailyMetricsHistory.filter(m => m.date >= cutoffStr).sort((a,b) => a.date.localeCompare(b.date));
  }, [state.dailyMetricsHistory, rangeType, customRange]);

  const filteredHistory = useMemo(() => {
    if (rangeType === 'CUSTOM' && customRange.start && customRange.end) {
      return state.workoutHistory.filter(h => h.date >= customRange.start && h.date <= customRange.end).sort((a,b) => a.date.localeCompare(b.date));
    }
    const days = rangeType === '7D' ? 7 : rangeType === '30D' ? 30 : rangeType === '90D' ? 90 : 9999;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = getLocalDateString(cutoff);
    return state.workoutHistory.filter(h => h.date >= cutoffStr).sort((a,b) => a.date.localeCompare(b.date));
  }, [state.workoutHistory, rangeType, customRange]);

  const filteredWeight = useMemo(() => {
    if (rangeType === 'CUSTOM' && customRange.start && customRange.end) {
      return state.weightHistory.filter(w => w.date >= customRange.start && w.date <= customRange.end).sort((a,b) => a.date.localeCompare(b.date));
    }
    const days = rangeType === '7D' ? 7 : rangeType === '30D' ? 30 : rangeType === '90D' ? 90 : 9999;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = getLocalDateString(cutoff);
    return state.weightHistory.filter(w => w.date >= cutoffStr).sort((a,b) => a.date.localeCompare(b.date));
  }, [state.weightHistory, rangeType, customRange]);

  const trainingData = useMemo(() => {
    const volumeHistory = filteredMetrics.length > 0 
      ? filteredMetrics.map(m => m.volume) 
      : filteredHistory.map(h => {
          let vol = 0;
          Object.values(h.logs).forEach((sets: any) => {
            sets.forEach((s: any) => {
              vol += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
              if (s.supersetWeight && s.supersetReps) {
                vol += (parseFloat(s.supersetWeight) || 0) * (parseFloat(s.supersetReps) || 0);
              }
            });
          });
          return vol;
        });

    const intensityHistory = filteredHistory.map(h => {
      let rirSum = 0;
      let setCnt = 0;
      Object.values(h.logs).forEach((sets: any) => {
        sets.forEach((s: any) => {
          const rir = parseFloat(s.rir);
          if (!isNaN(rir)) { rirSum += rir; setCnt++; }
        });
      });
      return setCnt > 0 ? rirSum / setCnt : 0;
    });

    const setDensity = filteredHistory.map(h => {
      let cnt = 0;
      Object.values(h.logs).forEach((sets: any) => cnt += sets.length);
      return cnt;
    });

    const overloadVelocity = volumeHistory.map((vol, i, arr) => {
      if (i === 0) return 0;
      const prev = arr[i - 1] || 1;
      return ((vol - prev) / prev) * 100;
    });

    const dates = filteredHistory.map(h => h.date.split('-')[2]);

    return { volumeHistory, intensityHistory, setDensity, overloadVelocity, dates };
  }, [filteredMetrics, filteredHistory]);

  const weightData = useMemo(() => {
    const history = filteredWeight.map(w => w.weight);
    const dates = filteredWeight.map(w => w.date.split('-')[2]);
    const bf = state.profile?.currentBodyFat || 15;
    const leanMassHistory = filteredWeight.map(w => w.weight * (1 - bf/100));
    
    let velocity = 0;
    if (history.length > 1) {
      const diff = history[history.length - 1] - history[0];
      velocity = diff / Math.max(1, history.length / 7);
    }
    return { history, dates, leanMassHistory, velocity };
  }, [filteredWeight, state.profile]);

  const oracleData = useMemo(() => {
    const currentWeight = weightData.history[weightData.history.length - 1] || state.profile?.weight || 0;
    const targetWeight = state.profile?.goalWeight || 0;
    const vel = weightData.velocity; 
    
    let daysToGoal: number | null = null;
    let etaString = "Incalculable";
    let etaShiftLabel = "NEUTRAL";
    let etaShiftColor = "text-zinc-600";
    
    if (vel !== 0) {
      const diff = targetWeight - currentWeight;
      if ((diff > 0 && vel > 0) || (diff < 0 && vel < 0)) {
        const weeks = Math.abs(diff / vel);
        daysToGoal = Math.round(weeks * 7);
        const etaDate = new Date();
        etaDate.setDate(etaDate.getDate() + daysToGoal);
        etaString = etaDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        if (weightData.history.length > 7) {
           const lastWeekStart = weightData.history[weightData.history.length - 7];
           const lastWeekEnd = weightData.history[weightData.history.length - 1];
           const weekVelocity = (lastWeekEnd - lastWeekStart);
           const isAccelerating = (diff > 0 && weekVelocity > vel) || (diff < 0 && weekVelocity < vel);
           etaShiftLabel = isAccelerating ? "ACCELERATING" : "RECEDING";
           etaShiftColor = isAccelerating ? "text-gold" : "text-zinc-500";
        }
      } else {
        etaString = "Diverging Path";
        etaShiftLabel = "DIVERGING";
        etaShiftColor = "text-zinc-800";
      }
    }

    const currentVolAvg = trainingData.volumeHistory.length > 0 
      ? trainingData.volumeHistory.reduce((a, b) => a + b, 0) / trainingData.volumeHistory.length 
      : 0;
    const predictedVol = currentVolAvg * 1.05; 

    return { etaString, daysToGoal, predictedVol, currentWeight, targetWeight, etaShiftLabel, etaShiftColor };
  }, [weightData, state.profile, trainingData]);

  const latestZpi = filteredMetrics.length > 0 ? Math.round(filteredMetrics[filteredMetrics.length - 1].zpi) : 0;
  const currentRank = latestZpi >= 90 ? 'S' : latestZpi >= 80 ? 'A' : latestZpi >= 70 ? 'B' : latestZpi >= 60 ? 'C' : 'D';

  const muscleStats = useMemo(() => {
    const volumeMap: Record<string, number> = {};
    const frequencyMap: Record<string, number> = {};
    MUSCLE_GROUPS.forEach(m => {
      volumeMap[m] = 0;
      frequencyMap[m] = 0;
    });

    filteredHistory.forEach(h => {
      const hitMusclesThisSession = new Set<string>();
      Object.entries(h.logs).forEach(([exName, sets]) => {
        const exMeta = EXERCISE_DIRECTORY.find(e => e.name === exName);
        if (exMeta) {
          const primary = exMeta.primaryMuscle;
          hitMusclesThisSession.add(primary);
          const vol = (sets as ExerciseLog[]).reduce(
            (acc, s) => acc + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0),
            0
          );
          volumeMap[primary] = (volumeMap[primary] || 0) + vol;
        }
      });
      hitMusclesThisSession.forEach(m => frequencyMap[m]++);
    });

    const maxVol = Math.max(...Object.values(volumeMap), 1);
    const radarData = MUSCLE_GROUPS.map(m => ({
      name: m,
      percentage: (volumeMap[m] / maxVol) * 100,
    }));

    const pushVol = (volumeMap['Chest'] || 0) + (volumeMap['Shoulders'] || 0) + (volumeMap['Triceps'] || 0);
    const pullVol = (volumeMap['Back'] || 0) + (volumeMap['Biceps'] || 0);
    const legVol = (volumeMap['Quads'] || 0) + (volumeMap['Hamstrings'] || 0) + (volumeMap['Calves'] || 0) + (volumeMap['Glutes'] || 0);
    const totalStructuralVol = pushVol + pullVol + legVol || 1;

    return { 
      radarData, 
      frequencyMap: MUSCLE_GROUPS.map(m => frequencyMap[m]),
      symmetry: {
        push: (pushVol / totalStructuralVol) * 100,
        pull: (pullVol / totalStructuralVol) * 100,
        legs: (legVol / totalStructuralVol) * 100
      }
    };
  }, [filteredHistory]);

  const nutritionStats = useMemo(() => {
    const history = filteredMetrics.map(m => m.calories);
    const proteinHistory = filteredMetrics.map(m => m.protein);
    const carbsHistory = filteredMetrics.map(m => m.carbs || 0);
    const fatsHistory = filteredMetrics.map(m => m.fats || 0);
    const fiberHistory = filteredMetrics.map(m => m.fiber || 0);
    const dates = filteredMetrics.map(m => m.date.split('-')[2]);
    const lastMetric = filteredMetrics[filteredMetrics.length - 1];
    const totals = lastMetric ? {
      cal: lastMetric.calories,
      p: lastMetric.protein,
      c: lastMetric.carbs || 0, 
      f: lastMetric.fats || 0,
      fiber: lastMetric.fiber || 0
    } : { cal: 0, p: 0, c: 0, f: 0, fiber: 0 };
    return { history, proteinHistory, carbsHistory, fatsHistory, fiberHistory, dates, totals };
  }, [filteredMetrics]);

  const recoveryStats = useMemo(() => {
    const lastMetric = filteredMetrics[filteredMetrics.length - 1];
    const readiness = lastMetric?.readiness || 85;
    const sleepTrend = filteredMetrics.map(m => m.sleepHours || 7.5);
    const hrvTrend = filteredMetrics.map(m => m.hrv || 65);
    const rhrTrend = filteredMetrics.map(m => m.rhr || 52);
    const efficiencyTrend = filteredMetrics.map(m => m.sleepEfficiency || 92);
    
    const sleepStages = lastMetric?.sleepStages || { light: 240, deep: 90, rem: 110, awake: 20 };
    const timeInBed = lastMetric?.timeInBed || (lastMetric?.sleepHours ? lastMetric.sleepHours + 0.5 : 8.0);
    const efficiency = lastMetric?.sleepEfficiency || (lastMetric?.sleepHours && timeInBed ? (lastMetric.sleepHours / timeInBed) * 100 : 92);
    
    const bedtime = lastMetric?.bedtime || "22:45";
    const wakeTime = lastMetric?.wakeTime || "06:30";
    
    const dates = filteredMetrics.map(m => m.date.split('-')[2]);
    return { 
      readiness, 
      sleepTrend, 
      hrvTrend, 
      rhrTrend, 
      efficiencyTrend,
      sleepStages,
      timeInBed,
      efficiency,
      bedtime,
      wakeTime,
      dates 
    };
  }, [filteredMetrics]);

  const handleRangeSelect = (type: RangeType) => {
    HapticService.selection();
    setRangeType(type);
    if (type !== 'CUSTOM') {
      setShowRangeModal(false);
    }
  };

  const hasWearables = state.connectedWearables.length > 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <header className="sticky top-0 z-[100] bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.05] px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-white/5 rounded-full text-zinc-600 hover:text-white transition-all hover:bg-white/10"><ArrowLeft size={18} /></button>
          <h1 className="text-xl font-light tracking-[0.4em] uppercase">Intelligence</h1>
        </div>
        <button 
          onClick={() => { HapticService.impactLight(); setShowRangeModal(true); }}
          className="flex items-center gap-3 px-4 py-2 bg-zinc-900/50 rounded-xl border border-white/5 group hover:border-gold/60 hover:bg-white/5 transition-all"
        >
          <Calendar size={14} className="text-gold" />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {rangeType === 'CUSTOM' ? `${customRange.start} - ${customRange.end}` : rangeType}
          </span>
        </button>
      </header>

      <div className="w-full overflow-x-auto no-scrollbar border-b border-white/[0.03] bg-[#050505] sticky top-[92px] z-[90]">
        <div className="flex px-6 min-w-max">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`flex flex-col items-center gap-2 py-4 px-6 transition-all relative group ${activeTab === cat.id ? 'text-gold' : 'text-zinc-600 hover:text-white'}`}>
              <cat.icon size={18} strokeWidth={activeTab === cat.id ? 2.5 : 2} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">{cat.id.toUpperCase()}</span>
              {activeTab === cat.id && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto no-scrollbar pb-32">
        {activeTab === 'Overview' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header className="space-y-2 px-2">
                <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">Ares Oracle</h3>
                <p className="text-xs text-zinc-500 font-light">Biological projections and temporal goal estimation.</p>
             </header>

             <Card className="p-10 border-white/5 bg-[#080809] flex flex-col items-center gap-10 text-center relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700"><Orbit size={200} /></div>
                
                <div className="relative w-48 h-48 flex items-center justify-center">
                   <div className="absolute inset-0 gold-bg opacity-10 blur-3xl animate-pulse" />
                   <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#D4AF37" strokeWidth="6" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * (latestZpi) / 100)} className="transition-all duration-1000" />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black tabular-nums">{latestZpi}</span>
                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gold">RANK {currentRank}</span>
                   </div>
                </div>

                <div className="w-full grid grid-cols-1 gap-6">
                   <div className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-gold/30 hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-4 text-left">
                         <div className="p-3 bg-gold/10 rounded-xl group-hover:bg-gold/20 transition-colors"><Telescope size={18} className="text-gold" /></div>
                         <div>
                            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Goal Convergence ETA</p>
                            <h4 className="text-lg font-bold gold-text uppercase tracking-tight">{oracleData.etaString}</h4>
                         </div>
                      </div>
                      <Sparkles size={16} className="text-gold opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                   </div>

                   <div className="flex justify-between items-center p-6 bg-zinc-950 border border-gold/10 rounded-3xl hover:border-gold/40 hover:bg-white/[0.02] transition-all">
                      <div className="flex items-center gap-4 text-left">
                         <div className="p-3 bg-white/5 rounded-xl"><TimerReset size={18} className="text-white opacity-40" /></div>
                         <div>
                            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">ETA Shift</p>
                            <h4 className={`text-lg font-black uppercase tracking-tight ${oracleData.etaShiftColor}`}>{oracleData.etaShiftLabel}</h4>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest">Velocity Delta</p>
                         <p className="text-[10px] text-zinc-500 font-black">{(weightData.velocity * 7).toFixed(1)} {isMetric ? 'KG' : 'LB'}/WK</p>
                      </div>
                   </div>

                   <div className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-white/20 transition-all">
                      <div className="flex items-center gap-4 text-left">
                         <div className="p-3 bg-zinc-800 rounded-xl"><Milestone size={18} className="text-zinc-500" /></div>
                         <div>
                            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">30D Volume Forecast</p>
                            <h4 className="text-lg font-bold text-white uppercase tracking-tight">{(oracleData.predictedVol/1000).toFixed(1)}k <span className="text-[10px] text-zinc-600">KG·REPS</span></h4>
                         </div>
                      </div>
                      <TrendingUp size={16} className="text-gold opacity-40" />
                   </div>
                </div>
             </Card>

             <section className="space-y-6">
                <div className="flex justify-between items-center px-2">
                   <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Path to Ascension</h3>
                   <Activity size={14} className="text-gold opacity-40" />
                </div>
                <Card className="p-10 border-white/5 bg-zinc-950/50 space-y-8 hover:bg-zinc-950 transition-all">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Current Positioning</p>
                         <h5 className="text-xl font-black text-white">{oracleData.currentWeight} <span className="text-xs text-zinc-700">{isMetric ? 'KG' : 'LB'}</span></h5>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Target Ceiling</p>
                         <h5 className="text-xl font-black gold-text">{oracleData.targetWeight} <span className="text-xs text-zinc-700">{isMetric ? 'KG' : 'LB'}</span></h5>
                      </div>
                   </div>
                   <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden relative">
                      <div 
                         className="h-full gold-bg shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all duration-1000" 
                         style={{ width: `${Math.min(100, (oracleData.currentWeight / (oracleData.targetWeight || 1)) * 100)}%` }} 
                      />
                   </div>
                   <p className="text-[8px] text-zinc-700 font-light text-center uppercase tracking-widest">
                      Biological convergence rate: {weightData.velocity.toFixed(2)} {isMetric ? 'KG' : 'LB'} / WEEK
                   </p>
                </Card>
             </section>
          </div>
        )}

        {activeTab === 'Muscles' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header className="space-y-2 px-2">
                <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">Hypertrophy Map</h3>
                <p className="text-xs text-zinc-500 font-light">Structural stress distribution and module stimulation frequency.</p>
             </header>

             <Card className="p-0 border-white/5 bg-zinc-900/10 flex items-center justify-center rounded-[48px] hover:bg-white/[0.02] transition-all">
                <RadarChart data={muscleStats.radarData} />
             </Card>

             <section className="space-y-6">
                <div className="flex justify-between items-center px-2">
                   <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Symmetry Index</h3>
                   <BarChart3 size={14} className="text-gold opacity-40" />
                </div>
                <Card className="p-8 border-white/5 bg-zinc-950/50 space-y-6 hover:bg-zinc-950 transition-all">
                   {[
                     { l: 'Push (Anterior)', v: muscleStats.symmetry.push, c: 'bg-gold' },
                     { l: 'Pull (Posterior)', v: muscleStats.symmetry.pull, c: 'bg-zinc-500' },
                     { l: 'Legs (Structural)', v: muscleStats.symmetry.legs, c: 'bg-white' }
                   ].map(s => (
                     <div key={s.l} className="space-y-2">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                           <span className="text-zinc-600">{s.l}</span>
                           <span>{Math.round(s.v)}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                           <div className={`h-full ${s.c} transition-all duration-1000`} style={{ width: `${s.v}%` }} />
                        </div>
                     </div>
                   ))}
                </Card>
             </section>

             <section className="space-y-6">
                <div className="flex justify-between items-center px-2">
                   <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Neural Frequency</h3>
                   <Activity size={14} className="text-gold opacity-40" />
                </div>
                <Card className="p-10 border-white/5 bg-zinc-950/50 hover:bg-zinc-950 transition-all">
                   <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-4">Module Stimulation Count</p>
                   <SimpleBarChart data={muscleStats.frequencyMap} color="rgba(212, 175, 55, 0.5)" labels={MUSCLE_GROUPS.map(m => m.substring(0,3))} />
                </Card>
             </section>
          </div>
        )}

        {activeTab === 'Training' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header className="space-y-2 px-2">
                <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">Training Intelligence</h3>
                <p className="text-xs text-zinc-500 font-light">Mechanical load progression and progressive overload velocity.</p>
             </header>

             <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 bg-zinc-900/20 border-white/5 flex flex-col items-center gap-2 text-center hover:bg-white/[0.04] transition-all">
                   <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Load Velocity</p>
                   <p className={`text-xl font-bold ${trainingData.overloadVelocity[trainingData.overloadVelocity.length-1] > 0 ? 'text-gold' : 'text-zinc-400'}`}>
                      {trainingData.overloadVelocity[trainingData.overloadVelocity.length-1] > 0 ? '+' : ''}{trainingData.overloadVelocity[trainingData.overloadVelocity.length-1]?.toFixed(1) || '0'}%
                   </p>
                </Card>
                <Card className="p-6 bg-zinc-900/20 border-white/5 flex flex-col items-center gap-2 text-center hover:bg-white/[0.04] transition-all">
                   <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Avg Intensity</p>
                   <p className="text-xl font-bold text-gold">
                      {trainingData.intensityHistory.length > 0 ? (trainingData.intensityHistory.reduce((a,b)=>a+b,0)/trainingData.intensityHistory.length).toFixed(1) : '0'} <span className="text-[8px] text-zinc-700">RIR</span>
                   </p>
                </Card>
             </div>

             <section className="space-y-6">
                <div className="flex justify-between items-center px-2">
                   <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Progressive Overload Diagnostic</h3>
                   <Gauge size={14} className="text-gold opacity-40" />
                </div>
                <Card className="p-10 border-white/5 bg-[#080809] hover:bg-white/[0.02] transition-all">
                   <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-4">Overload Trajectory (%)</p>
                   <SimpleBarChart 
                      data={trainingData.overloadVelocity} 
                      color="rgba(197, 160, 89, 0.4)" 
                      labels={trainingData.dates} 
                   />
                </Card>
             </section>

             <section className="space-y-6">
                <div className="flex justify-between items-center px-2">
                   <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tonnage Trajectory</h3>
                   <TrendingUp size={14} className="text-gold opacity-40" />
                </div>
                <Card className="p-10 border-white/5 bg-[#080809] hover:bg-white/[0.02] transition-all">
                   <SimpleLineChart data={trainingData.volumeHistory} color="#D4AF37" labels={trainingData.dates} />
                </Card>
             </section>
          </div>
        )}

        {activeTab === 'Weight' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header className="space-y-2 px-2">
                <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">Mass Diagnostic</h3>
                <p className="text-xs text-zinc-500 font-light">Composition analysis and weight velocity trajectory.</p>
             </header>

             <div className="grid grid-cols-3 gap-4">
                <Card className="p-6 border-white/5 bg-zinc-900/40 text-center space-y-2 hover:bg-white/[0.04] transition-all">
                   <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Current</p>
                   <p className="text-lg font-bold gold-text">{weightData.history[weightData.history.length-1] || '0'}</p>
                </Card>
                <Card className="p-6 border-white/5 bg-zinc-900/40 text-center space-y-2 hover:bg-white/[0.04] transition-all">
                   <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Velocity</p>
                   <p className={`text-lg font-bold ${weightData.velocity > 0 ? 'text-gold' : 'text-zinc-500'}`}>
                      {weightData.velocity > 0 ? '+' : ''}{weightData.velocity.toFixed(2)}
                   </p>
                </Card>
                <Card className="p-6 border-white/5 bg-zinc-900/40 text-center space-y-2 hover:bg-white/[0.04] transition-all">
                   <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Goal</p>
                   <p className="text-lg font-bold text-zinc-500">{state.profile?.goalWeight}</p>
                </Card>
             </div>

             <Card className="p-10 border-white/5 bg-[#080809] hover:bg-white/[0.02] transition-all">
                <SimpleLineChart data={weightData.history} target={state.profile?.goalWeight} color="#D4AF37" labels={weightData.dates} />
             </Card>
          </div>
        )}

        {activeTab === 'Nutrition' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <header className="space-y-2 px-2">
                <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">Fuel Diagnostics</h3>
                <p className="text-xs text-zinc-500 font-light">Nutrient partition adherence and caloric history.</p>
             </header>
             <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 bg-zinc-900/40 border-white/5 text-center hover:bg-white/[0.04] transition-all">
                   <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Last Caloric Entry</p>
                   <p className="text-2xl font-black gold-text">{nutritionStats.totals.cal} <span className="text-[10px] text-zinc-700">KCAL</span></p>
                </Card>
                <Card className="p-6 bg-zinc-900/40 border-white/5 text-center hover:bg-white/[0.04] transition-all">
                   <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Last Protein Entry</p>
                   <p className="text-2xl font-black text-white">{nutritionStats.totals.p} <span className="text-[10px] text-zinc-700">G</span></p>
                </Card>
             </div>
             <Card className="p-10 border-white/5 bg-[#080809] hover:bg-white/[0.02] transition-all">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Caloric Intake History</p>
                <SimpleLineChart data={nutritionStats.history} target={state.profile?.maintenanceCalories} labels={nutritionStats.dates} />
             </Card>
             <Card className="p-10 border-white/5 bg-[#080809] hover:bg-white/[0.02] transition-all">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Protein Progression (G)</p>
                <SimpleBarChart data={nutritionStats.proteinHistory} color="#D4AF37" labels={nutritionStats.dates} />
             </Card>
             <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-zinc-900/40 border-white/5 text-center">
                   <p className="text-[7px] text-zinc-600 font-black uppercase mb-1">Carbs</p>
                   <p className="text-xs font-bold text-white">{nutritionStats.totals.c}G</p>
                </Card>
                <Card className="p-4 bg-zinc-900/40 border-white/5 text-center">
                   <p className="text-[7px] text-zinc-600 font-black uppercase mb-1">Fats</p>
                   <p className="text-xs font-bold text-white">{nutritionStats.totals.f}G</p>
                </Card>
                <Card className="p-4 bg-zinc-900/40 border-white/5 text-center">
                   <p className="text-[7px] text-zinc-600 font-black uppercase mb-1">Fiber</p>
                   <p className="text-xs font-bold text-gold">{nutritionStats.totals.fiber}G</p>
                </Card>
             </div>
          </div>
        )}

        {activeTab === 'Rest' && (
          <div className="space-y-12 animate-in fade-in duration-700 h-full">
             {!hasWearables ? (
               <div className="flex flex-col items-center justify-center space-y-8 pt-20 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-800">
                    <Lock size={40} />
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-xl font-bold uppercase tracking-widest">Neural Link Offline</h2>
                     <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed px-12">
                       Rest & Recovery diagnostics require bi-directional telemetry from linked hardware.
                     </p>
                  </div>
                  <button onClick={onBack} className="flex items-center gap-3 px-8 py-4 bg-gold text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-lg shadow-gold/20 active:scale-95 transition-all hover:bg-gold/90">
                    Link Device in Profile
                  </button>
               </div>
             ) : (
               <>
                 <header className="space-y-2 px-2">
                    <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">Recovery Diagnostic</h3>
                    <p className="text-xs text-zinc-500 font-light">Parasympathetic baseline and neural readiness architecture.</p>
                 </header>

                 {/* Readiness Score */}
                 <Card className="p-10 border-white/5 bg-[#080809] flex flex-col items-center gap-6 text-center hover:bg-white/[0.01] transition-all">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                       <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="8" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#D4AF37" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * (recoveryStats.readiness) / 100)} className="transition-all duration-1000" />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-5xl font-black tabular-nums">{recoveryStats.readiness}</span>
                          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gold">READY</span>
                       </div>
                    </div>
                 </Card>

                 {/* Primary Sleep Metrics */}
                 <div className="grid grid-cols-2 gap-4">
                    <Card className="p-6 bg-zinc-900/40 border-white/5 space-y-4">
                       <div className="flex items-center gap-3">
                          <Clock size={14} className="text-gold" />
                          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Total Sleep</p>
                       </div>
                       <p className="text-2xl font-black tabular-nums">{recoveryStats.sleepTrend[recoveryStats.sleepTrend.length-1]?.toFixed(1)} <span className="text-[10px] text-zinc-700">HRS</span></p>
                    </Card>
                    <Card className="p-6 bg-zinc-900/40 border-white/5 space-y-4">
                       <div className="flex items-center gap-3">
                          <Moon size={14} className="text-zinc-500" />
                          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Time in Bed</p>
                       </div>
                       <p className="text-2xl font-black tabular-nums">{recoveryStats.timeInBed.toFixed(1)} <span className="text-[10px] text-zinc-700">HRS</span></p>
                    </Card>
                 </div>

                 {/* Sleep Efficiency & Stages */}
                 <section className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                       <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sleep Architecture</h3>
                       <Layers size={14} className="text-gold opacity-40" />
                    </div>
                    <Card className="p-8 border-white/5 bg-zinc-950/50 space-y-8">
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Efficiency</p>
                             <h5 className="text-xl font-black text-white">{Math.round(recoveryStats.efficiency)}%</h5>
                          </div>
                          <div className="text-right">
                             <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Consistency</p>
                             <h5 className="text-xl font-black text-gold">HIGH</h5>
                          </div>
                       </div>
                       
                       {/* Stages Bar */}
                       <div className="space-y-4">
                          <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden flex">
                             <div className="h-full bg-gold" style={{ width: `${(recoveryStats.sleepStages.deep / (recoveryStats.timeInBed * 60)) * 100}%` }} />
                             <div className="h-full bg-zinc-400" style={{ width: `${(recoveryStats.sleepStages.rem / (recoveryStats.timeInBed * 60)) * 100}%` }} />
                             <div className="h-full bg-zinc-600" style={{ width: `${(recoveryStats.sleepStages.light / (recoveryStats.timeInBed * 60)) * 100}%` }} />
                             <div className="h-full bg-zinc-800" style={{ width: `${(recoveryStats.sleepStages.awake / (recoveryStats.timeInBed * 60)) * 100}%` }} />
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                             {[
                               { l: 'Deep', v: recoveryStats.sleepStages.deep, c: 'bg-gold' },
                               { l: 'REM', v: recoveryStats.sleepStages.rem, c: 'bg-zinc-400' },
                               { l: 'Light', v: recoveryStats.sleepStages.light, c: 'bg-zinc-600' },
                               { l: 'Awake', v: recoveryStats.sleepStages.awake, c: 'bg-zinc-800' }
                             ].map(s => (
                               <div key={s.l} className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5">
                                     <div className={`w-1.5 h-1.5 rounded-full ${s.c}`} />
                                     <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-tighter">{s.l}</span>
                                  </div>
                                  <span className="text-[9px] font-bold tabular-nums">{Math.floor(s.v / 60)}h {s.v % 60}m</span>
                               </div>
                             ))}
                          </div>
                       </div>
                    </Card>
                 </section>

                 {/* Physiological Markers */}
                 <section className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                       <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Physiological Markers</h3>
                       <Activity size={14} className="text-gold opacity-40" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <Card className="p-8 border-white/5 bg-zinc-900/40 space-y-4">
                          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">HRV (MS)</p>
                          <SimpleLineChart data={recoveryStats.hrvTrend} color="#D4AF37" labels={recoveryStats.dates} />
                          <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                             <span className="text-[8px] text-zinc-700 font-black uppercase">Latest</span>
                             <span className="text-xs font-bold text-gold">{recoveryStats.hrvTrend[recoveryStats.hrvTrend.length-1]} ms</span>
                          </div>
                       </Card>
                       <Card className="p-8 border-white/5 bg-zinc-900/40 space-y-4">
                          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">RHR (BPM)</p>
                          <SimpleLineChart data={recoveryStats.rhrTrend} color="#BF953F" labels={recoveryStats.dates} />
                          <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                             <span className="text-[8px] text-zinc-700 font-black uppercase">Latest</span>
                             <span className="text-xs font-bold text-zinc-300">{recoveryStats.rhrTrend[recoveryStats.rhrTrend.length-1]} bpm</span>
                          </div>
                       </Card>
                    </div>
                 </section>

                 {/* Sleep Timing */}
                 <section className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                       <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Circadian Stability</h3>
                       <Timer size={14} className="text-gold opacity-40" />
                    </div>
                    <Card className="p-8 border-white/5 bg-zinc-950/50 flex justify-between items-center">
                       <div className="space-y-2">
                          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Avg Bedtime</p>
                          <p className="text-xl font-black tabular-nums">{recoveryStats.bedtime}</p>
                       </div>
                       <div className="h-10 w-px bg-white/5" />
                       <div className="space-y-2 text-right">
                          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Avg Wake Time</p>
                          <p className="text-xl font-black tabular-nums">{recoveryStats.wakeTime}</p>
                       </div>
                    </Card>
                 </section>

                 {/* Efficiency Trend */}
                 <section className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                       <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Efficiency Trend</h3>
                       <TrendingUp size={14} className="text-gold opacity-40" />
                    </div>
                    <Card className="p-10 border-white/5 bg-[#080809] hover:bg-white/[0.02] transition-all">
                       <SimpleLineChart data={recoveryStats.efficiencyTrend} color="#D4AF37" labels={recoveryStats.dates} />
                    </Card>
                 </section>
               </>
             )}
          </div>
        )}
      </div>

      {showRangeModal && (
        <div className="fixed inset-0 z-[505] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="w-full max-w-sm space-y-10 bg-surface border border-white/10 p-10 rounded-[48px] shadow-2xl">
              <header className="flex justify-between items-center mb-4">
                 <div className="space-y-1">
                    <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">Temporal Window</p>
                    <h2 className="text-2xl font-light tracking-tight uppercase">Analysis Range</h2>
                 </div>
                 <button onClick={() => setShowRangeModal(false)} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all hover:bg-white/10"><X size={20} /></button>
              </header>

              <div className="grid grid-cols-2 gap-3">
                 {(['7D', '30D', '90D', 'ALL'] as RangeType[]).map(type => (
                    <button 
                      key={type} 
                      onClick={() => handleRangeSelect(type)}
                      className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${rangeType === type ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300'}`}
                    >
                       {type === '7D' ? 'Last Week' : type === '30D' ? 'Last Month' : type === '90D' ? 'Quarterly' : 'Full Archive'}
                    </button>
                 ))}
                 <button 
                    onClick={() => handleRangeSelect('CUSTOM')}
                    className={`col-span-2 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${rangeType === 'CUSTOM' ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300'}`}
                 >
                    Custom Range
                 </button>
              </div>

              {rangeType === 'CUSTOM' && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Anchor Start</label>
                         <input 
                            type="date" 
                            className="w-full bg-zinc-900 border border-white/5 p-4 rounded-xl text-[10px] font-bold text-white outline-none focus:border-gold-solid uppercase hover:border-white/20 transition-all"
                            value={customRange.start}
                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Terminal End</label>
                         <input 
                            type="date" 
                            className="w-full bg-zinc-900 border border-white/5 p-4 rounded-xl text-[10px] font-bold text-white outline-none focus:border-gold-solid uppercase hover:border-white/20 transition-all"
                            value={customRange.end}
                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                         />
                      </div>
                   </div>
                   <button 
                    onClick={() => { HapticService.notificationSuccess(); setShowRangeModal(false); }}
                    className="w-full h-14 gold-bg text-black font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all hover:bg-gold/90"
                   >
                     <Check size={16} strokeWidth={3} /> Commit Protocol
                   </button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
