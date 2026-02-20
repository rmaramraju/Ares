
import React, { useState } from 'react';
import { BodyType, Goal, Gender, UserProfile, UnitSystem } from './types.ts';
import { generateFitnessPlan } from './geminiService.ts';
import { Card } from './components/Card.tsx';
import { HapticService } from './hapticService.ts';
import { ChevronRight, Crown, Dumbbell, Scale, Ruler, HelpCircle, X, Info, Globe } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile, plans: any) => void;
}

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [showBodyFatHelp, setShowBodyFatHelp] = useState(false);
  const [showBodyTypeHelp, setShowBodyTypeHelp] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: 25,
    weight: 75,
    height: 180,
    currentBodyFat: 18,
    gender: Gender.MALE,
    bodyType: BodyType.MESOMORPH,
    unitSystem: UnitSystem.METRIC,
    selectedDays: [1, 2, 4, 5], 
    gymDaysPerWeek: 4,
    goal: Goal.BULK,
    cardioPreference: [],
    cuisinePreference: 'Clean Modern',
  });

  const calculateMaintenance = () => {
    // Basic TDEE formula (Metric)
    const weight = formData.unitSystem === UnitSystem.IMPERIAL ? (formData.weight || 165) / 2.20462 : (formData.weight || 75);
    const height = formData.unitSystem === UnitSystem.IMPERIAL ? (formData.height || 70) * 2.54 : (formData.height || 180);
    
    const bmr = formData.gender === Gender.MALE 
      ? 10 * weight + 6.25 * height - 5 * (formData.age || 25) + 5
      : 10 * weight + 6.25 * height - 5 * (formData.age || 25) - 161;
    
    const activityMultipliers = [1.2, 1.375, 1.55, 1.725, 1.9];
    const multiplier = activityMultipliers[Math.min(Math.max((formData.gymDaysPerWeek || 3) - 1, 0), 4)];
    return Math.round(bmr * multiplier);
  };

  const toggleDay = (day: number) => {
    HapticService.selection();
    const current = formData.selectedDays || [];
    const next = current.includes(day) 
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    setFormData({ ...formData, selectedDays: next, gymDaysPerWeek: next.length });
  };

  const validateStep = () => {
    if (step === 1) {
      return formData.name?.trim() !== '' && (formData.weight || 0) > 0 && (formData.height || 0) > 0 && (formData.age || 0) > 0;
    }
    if (step === 3) {
      return (formData.selectedDays?.length || 0) > 0;
    }
    if (step === 4) {
      return formData.cuisinePreference?.trim() !== '';
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      HapticService.notificationError();
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 500);
      return;
    }

    HapticService.impactLight();
    if (step < 4) {
      setStep(step + 1);
    } else {
      setLoading(true);
      const maintenance = calculateMaintenance();
      const profile = { 
        ...formData, 
        maintenanceCalories: maintenance,
        joinDate: new Date().toISOString().split('T')[0]
      } as UserProfile;
      try {
        const plans = await generateFitnessPlan(profile);
        onComplete({ 
          ...profile, 
          goalWeight: plans.goalWeight, 
          targetBodyFat: plans.targetBodyFat 
        }, plans);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center p-8 text-white reveal overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md flex flex-col h-full space-y-12 pb-20">
        
        <header className="mt-16 text-center space-y-4 reveal stagger-1">
          <Crown className="text-[#C5A059] mx-auto opacity-70" size={32} strokeWidth={1.5} />
          <div className="space-y-1">
            <h1 className="text-2xl font-light tracking-[0.3em] text-white uppercase">Ares Protocol</h1>
            <p className="text-zinc-600 text-[10px] font-bold tracking-[0.5em] uppercase">Sequence Phase {step} / 4</p>
          </div>
        </header>

        <div className={`flex-1 space-y-8 transition-all ${errorVisible ? 'animate-shake' : ''}`}>
          {step === 1 && (
            <div className="space-y-10 reveal">
              <div className="space-y-4 stagger-1">
                <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Athlete Designation</label>
                <input 
                  className={`w-full p-6 bg-zinc-900 border ${errorVisible && !formData.name?.trim() ? 'border-gold/30' : 'border-white/5'} rounded-2xl text-sm tracking-widest outline-none text-[#C5A059] placeholder:text-zinc-800 uppercase focus:border-gold-solid transition-all`}
                  placeholder="SUBJECT_NAME"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-4 stagger-1.5">
                <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">System Units</label>
                <div className="grid grid-cols-2 gap-4">
                   {[UnitSystem.METRIC, UnitSystem.IMPERIAL].map(u => (
                     <button key={u} onClick={() => { HapticService.impactMedium(); setFormData({...formData, unitSystem: u}); }} className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.unitSystem === u ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-transparent border-white/5 text-zinc-600'}`}>
                        {u}
                     </button>
                   ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 stagger-2">
                 <div className="space-y-4">
                    <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Weight ({formData.unitSystem === UnitSystem.METRIC ? 'KG' : 'LB'})</label>
                    <div className="relative">
                      <Scale className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
                      <input type="number" className="w-full p-6 pl-14 bg-zinc-900 border border-white/5 rounded-2xl text-sm outline-none text-white focus:border-gold-solid" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Height ({formData.unitSystem === UnitSystem.METRIC ? 'CM' : 'IN'})</label>
                    <div className="relative">
                      <Ruler className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
                      <input type="number" className="w-full p-6 pl-14 bg-zinc-900 border border-white/5 rounded-2xl text-sm outline-none text-white focus:border-gold-solid" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} />
                    </div>
                 </div>
              </div>

              <div className="space-y-4 stagger-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Body Fat Composition (%)</label>
                  <button onClick={() => { HapticService.selection(); setShowBodyFatHelp(true); }} className="text-gold-solid hover:scale-110 transition-transform"><HelpCircle size={16} /></button>
                </div>
                <input 
                  type="number" 
                  className="w-full p-6 bg-zinc-900 border border-white/5 rounded-2xl text-sm outline-none text-[#C5A059] focus:border-gold-solid"
                  value={formData.currentBodyFat}
                  onChange={e => setFormData({...formData, currentBodyFat: Number(e.target.value)})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6 stagger-4">
                <div className="space-y-4">
                   <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Cycle Count (Age)</label>
                    <input type="number" className="w-full p-6 bg-zinc-900 border border-white/5 rounded-2xl text-sm outline-none text-white focus:border-gold-solid" value={formData.age} onChange={e => setFormData({...formData, age: Number(e.target.value)})} />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Gender</label>
                  <select className="w-full p-6 bg-zinc-900 border border-white/5 rounded-2xl text-sm outline-none text-white appearance-none focus:border-gold-solid" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}>
                    {Object.values(Gender).map(g => <option key={g} value={g} className="bg-zinc-900">{g.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 reveal">
              <div className="flex items-center justify-center gap-3 stagger-1">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.5em]">Biological Archetype</p>
                <button onClick={() => { HapticService.selection(); setShowBodyTypeHelp(true); }} className="text-[#C5A059] hover:scale-110 transition-transform">
                  <HelpCircle size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {Object.values(BodyType).map((bt, i) => (
                  <button 
                    key={bt}
                    onClick={() => { HapticService.impactMedium(); setFormData({...formData, bodyType: bt}); }}
                    className={`p-7 rounded-[28px] border transition-all duration-300 text-left flex justify-between items-center stagger-${Math.min(i+1, 4)} ${formData.bodyType === bt ? 'bg-[#C5A059] border-[#C5A059] text-black shadow-lg scale-[1.02]' : 'bg-transparent border-white/5 text-zinc-600 hover:border-white/20'}`}
                  >
                    <span className="text-xs font-bold tracking-[0.3em] uppercase">{bt}</span>
                    {formData.bodyType === bt && <ChevronRight size={16} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-12 reveal">
              <div className="space-y-8 stagger-1">
                <h3 className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.5em] text-center">Operational Windows</h3>
                <div className="grid grid-cols-4 gap-2">
                  {DAY_LABELS.map((label, index) => (
                    <button 
                      key={label} 
                      onClick={() => toggleDay(index)} 
                      className={`py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${formData.selectedDays?.includes(index) ? 'bg-[#C5A059] text-black scale-105 shadow-md font-bold' : 'bg-zinc-900 border border-white/5 text-zinc-600'}`}
                    >
                      <span className="text-[10px] tracking-tighter">{label}</span>
                      {formData.selectedDays?.includes(index) && <div className="w-1 h-1 bg-black rounded-full" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 stagger-2">
                {Object.values(Goal).map(g => (
                  <button key={g} onClick={() => { HapticService.impactMedium(); setFormData({...formData, goal: g}); }} className={`py-5 px-2 rounded-2xl border transition-all text-center ${formData.goal === g ? 'bg-white text-black font-bold' : 'bg-transparent border-white/5 text-zinc-700 hover:text-white'}`}>
                    <p className="text-[9px] tracking-[0.1em] uppercase font-bold">{g}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-12 reveal">
              <div className="space-y-4 stagger-1">
                <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Nutritional Preferences</label>
                <input className={`w-full p-6 bg-zinc-900 border ${errorVisible && !formData.cuisinePreference?.trim() ? 'border-gold/30' : 'border-white/5'} rounded-2xl text-sm outline-none text-white placeholder:text-zinc-800 uppercase focus:border-gold-solid transition-all`} placeholder="E.G. CLEAN MODERN" value={formData.cuisinePreference} onChange={e => setFormData({...formData, cuisinePreference: e.target.value})} />
              </div>
              <div className="p-8 rounded-[40px] border border-white/5 bg-zinc-900 flex items-start gap-6 stagger-2">
                <Dumbbell className="text-[#C5A059] opacity-40 mt-1" size={24} strokeWidth={1.5} />
                <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold uppercase tracking-widest">
                  Deploying Ares Protocol for high-density hypertrophy. Biological and neural optimization ready.
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          disabled={loading}
          onClick={handleNext}
          className={`font-bold h-16 rounded-[32px] flex items-center justify-center space-x-4 shadow-xl active:scale-95 transition-all mt-auto reveal stagger-4 ${!validateStep() ? 'bg-zinc-800 text-zinc-600 opacity-50' : 'bg-white text-black'}`}
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] tracking-widest uppercase">Synthesizing...</span>
            </div>
          ) : (
            <>
              <span className="text-[11px] tracking-[0.5em] uppercase">{step === 4 ? "ACTIVATE SYSTEM" : "CONTINUE"}</span>
              <ChevronRight size={16} strokeWidth={3} />
            </>
          )}
        </button>
      </div>

      {showBodyTypeHelp && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="w-full max-w-sm space-y-8 bg-zinc-900 p-10 rounded-[48px] border border-white/10 shadow-2xl">
              <header className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Info className="text-[#C5A059]" size={20} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Somatic Models</h3>
                 </div>
                 <button onClick={() => setShowBodyTypeHelp(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
              </header>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <p className="text-[10px] text-[#C5A059] font-bold uppercase tracking-widest">Ectomorph</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">Lean, high metabolism, hard gainer.</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] text-[#C5A059] font-bold uppercase tracking-widest">Mesomorph</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">Natural athlete, responsive muscle tissue.</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] text-[#C5A059] font-bold uppercase tracking-widest">Endomorph</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">Robust build, prone to energy storage.</p>
                 </div>
              </div>
              <button onClick={() => setShowBodyTypeHelp(false)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-500">Acknowledged</button>
           </div>
        </div>
      )}

      {showBodyFatHelp && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="w-full max-w-sm space-y-8 bg-zinc-900 p-10 rounded-[48px] border border-white/10 shadow-2xl">
              <header className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Info className="text-gold-solid" size={20} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Measurement Logic</h3>
                 </div>
                 <button onClick={() => setShowBodyFatHelp(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
              </header>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <p className="text-[10px] text-gold-solid font-bold uppercase tracking-widest">Visual Analysis</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">Most common. Compare with verified reference images.</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] text-gold-solid font-bold uppercase tracking-widest">Bio-Impedance</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">Digital calculation via smart hardware.</p>
                 </div>
              </div>
              <button onClick={() => setShowBodyFatHelp(false)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-500">Acknowledged</button>
           </div>
        </div>
      )}
    </div>
  );
};
