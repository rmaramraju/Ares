import React, { useState, useMemo } from 'react';
import { WorkoutDay, Meal } from './types';
import { Card } from './components/Card';
import { Check, Edit3, Crown, Zap, Dumbbell, Calendar, Utensils, Target } from 'lucide-react';

import { AppTheme } from './theme.ts';

interface PlanConfirmationProps {
  workoutPlan: WorkoutDay[];
  dietPlan: Meal[];
  onAccept: (duration: number) => void;
  onRefine: () => void;
  theme: AppTheme;
}

export const PlanConfirmation: React.FC<PlanConfirmationProps> = ({ workoutPlan, dietPlan, onAccept, onRefine, theme }) => {
  const [duration, setDuration] = useState(3);

  const dailyTotals = useMemo(() => {
    return dietPlan.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [dietPlan]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center p-8 text-white pb-40 reveal overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md space-y-12 mt-12">
        <div className="text-center space-y-4">
          <Crown className="text-gold mx-auto mb-6" size={48} strokeWidth={1.5} />
          <h1 className="text-3xl font-light tracking-[0.3em] gold-text uppercase">Protocol Defined</h1>
          <p className="text-zinc-600 text-[10px] font-bold tracking-[0.5em] uppercase">Blueprint Synthesis Complete</p>
        </div>

        {/* Nutritional Strategy Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <Utensils size={14} className="text-gold" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">Nutritional Strategy</h2>
          </div>
          <Card className="p-8 border-gold/10 bg-gold/5 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-[0.03] rotate-12">
               <Target size={120} />
            </div>
            <div className="relative z-10 space-y-8">
               <div>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.6em] mb-2">Daily Caloric Ceiling</p>
                  <p className="text-5xl font-black gold-text tracking-tighter tabular-nums">{dailyTotals.calories}</p>
               </div>
               <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-zinc-600 tracking-[0.3em] uppercase">PRO</p>
                     <p className="text-xl font-bold">{dailyTotals.protein}<span className="text-[10px] text-zinc-700 ml-1">G</span></p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-zinc-600 tracking-[0.3em] uppercase">CHO</p>
                     <p className="text-xl font-bold">{dailyTotals.carbs}<span className="text-[10px] text-zinc-700 ml-1">G</span></p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-zinc-600 tracking-[0.3em] uppercase">FAT</p>
                     <p className="text-xl font-bold">{dailyTotals.fats}<span className="text-[10px] text-zinc-700 ml-1">G</span></p>
                  </div>
               </div>
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <Zap size={14} className="text-gold" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">Proposed Deployment</h2>
          </div>
          <div className="space-y-4">
            {workoutPlan.map((day) => (
              <Card key={day.id} className="border-white/5 bg-zinc-900/40">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[9px] text-gold font-bold uppercase tracking-widest">{day.dayName}</p>
                    <h3 className="font-semibold text-xl tracking-tight uppercase">{day.focus}</h3>
                    <p className="text-[10px] text-zinc-600 uppercase font-semibold tracking-widest mt-2">{day.exercises.length} Specialized Mods</p>
                  </div>
                  <Dumbbell className="text-zinc-800" size={32} />
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6 pt-6">
          <div className="flex items-center gap-3 ml-2">
            <Calendar size={14} className="text-gold" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">Protocol Validity</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[3, 6, 12].map((m) => (
              <button 
                key={m}
                onClick={() => setDuration(m)}
                className={`py-6 rounded-2xl border transition-all flex flex-col items-center gap-2 ${duration === m ? 'bg-gold/10 border-gold text-gold' : 'bg-transparent border-white/5 text-zinc-600'}`}
              >
                <span className="text-lg font-bold">{m}</span>
                <span className="text-[8px] font-black uppercase tracking-widest">Months</span>
              </button>
            ))}
          </div>
          <p className="text-[9px] text-center text-zinc-600 uppercase tracking-widest leading-relaxed">
            *This selection unlocks the operational calendar for the specified duration.
          </p>
        </section>

        <section className="space-y-4 pt-4">
           <div className="p-8 rounded-[40px] bg-gold/5 border border-gold/20 flex items-start gap-6">
              <div className="p-3 bg-gold/10 rounded-xl"><Crown size={18} className="text-gold" /></div>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-[0.2em]">
                AI optimized for hypertrophy and peak structural stress based on your biological commitment and nutritional goals.
              </p>
           </div>
        </section>

        <div className="space-y-6">
          <button 
            onClick={() => onAccept(duration)}
            className="w-full gold-bg text-black font-bold h-20 rounded-[32px] flex items-center justify-center gap-4 shadow-2xl shadow-gold/30 active:scale-95 transition-all"
          >
            <Check size={22} strokeWidth={3} />
            <span className="text-[12px] tracking-[0.5em] uppercase">ACTIVATE PROTOCOL</span>
          </button>
          
          <button 
            onClick={onRefine}
            className="w-full bg-zinc-900 border border-white/10 text-white font-bold h-20 rounded-[32px] flex items-center justify-center gap-4 hover:bg-zinc-800 active:scale-95 transition-all"
          >
            <Edit3 size={20} className="text-gold" />
            <span className="text-[12px] tracking-[0.5em] uppercase">REFINE ARCHITECTURE</span>
          </button>
        </div>
      </div>
    </div>
  );
};