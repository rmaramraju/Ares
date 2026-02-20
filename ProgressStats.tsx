import React, { useState } from 'react';
import { AppState, WorkoutHistoryItem, ExerciseLog } from './types';
import { Card } from './components/Card';
import { Award, Zap, History, ChevronDown, ChevronUp, Clock, Flame, ArrowLeft } from 'lucide-react';

interface ProgressStatsProps {
  state: AppState;
  onBack: () => void;
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({ state, onBack }) => {
  const [expandedWorkout, setExpandedWorkout] = useState<number | null>(null);

  return (
    <div className="p-6 space-y-10 max-w-md mx-auto animate-in fade-in duration-700">
      <header className="mt-12 px-2 flex items-center gap-6">
        <button onClick={onBack} className="p-4 bg-white/5 rounded-full text-zinc-500 hover:text-gold hover:bg-gold/5 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em] mb-1">Performance</p>
          <h1 className="text-4xl font-light tracking-tight">INSIGHTS</h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-5">
        <Card className="bg-gradient-to-br from-[#0A0A0B] to-[#121214] border-gold/5 p-8">
          <Award className="text-gold mb-6" size={24} />
          <p className="text-5xl font-light tracking-tight gold-text">{state.workoutHistory.length}</p>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-3">Sessions Logged</p>
        </Card>
        <Card className="bg-gradient-to-br from-[#0A0A0B] to-[#121214] border-gold/5 p-8">
          <Zap className="text-gold mb-6" size={24} />
          <p className="text-5xl font-light tracking-tight gold-text">12</p>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-3">Current Streak</p>
        </Card>
      </div>

      <div className="space-y-6 pb-12">
        <h3 className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em] ml-2">Protocol Archive</h3>
        {state.workoutHistory.length === 0 ? (
          <div className="text-center py-20 text-zinc-700 uppercase tracking-[0.4em] text-[10px] border border-dashed border-white/5 rounded-[40px]">No historical data</div>
        ) : (
          state.workoutHistory.slice().reverse().map((h, i) => (
            <div key={i} className="flex flex-col bg-[#0A0A0B] rounded-[32px] border border-white/[0.03] overflow-hidden transition-all duration-500 hover:border-gold/20">
              <div 
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors"
                onClick={() => setExpandedWorkout(expandedWorkout === i ? null : i)}
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5"><History size={20} className="text-gold opacity-50" /></div>
                  <div>
                    <h4 className="font-semibold tracking-tight text-base">{h.focus}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{h.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center justify-end text-gold gap-1 mb-0.5">
                        <Flame size={12} />
                        <p className="font-bold text-sm tracking-tight">{h.calories}</p>
                    </div>
                  </div>
                  {expandedWorkout === i ? <ChevronUp size={18} className="text-zinc-500" /> : <ChevronDown size={18} className="text-zinc-500" />}
                </div>
              </div>

              {expandedWorkout === i && (
                <div className="px-8 pb-8 border-t border-white/[0.03] animate-in slide-in-from-top-2 duration-500">
                  <div className="pt-8 space-y-8">
                    {(Object.entries(h.logs || {}) as [string, ExerciseLog[]][]).map(([exerciseName, sets]) => (
                      <div key={exerciseName}>
                        <h5 className="text-[10px] text-gold font-bold uppercase tracking-[0.25em] mb-4">{exerciseName}</h5>
                        <div className="space-y-3">
                          {sets.map((set, sIdx) => (
                            <div key={sIdx} className="flex justify-between items-center text-xs py-3 border-b border-white/[0.03] last:border-0">
                              <span className="text-zinc-600 font-bold uppercase text-[9px]">Set {sIdx + 1}</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-white font-medium text-sm">{set.weight || '0'} <span className="text-[10px] text-zinc-500">KG</span></span>
                                <span className="text-zinc-700">×</span>
                                <span className="text-white font-medium text-sm">{set.reps || '0'} <span className="text-[10px] text-zinc-500">REPS</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};