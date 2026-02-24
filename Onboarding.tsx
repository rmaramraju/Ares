
import React, { useState } from 'react';
import { BodyType, Goal, Gender, UserProfile, UnitSystem, ExperienceLevel, AIPersona } from './types.ts';
import { generateFitnessPlan } from './geminiService.ts';
import { Card } from './components/Card.tsx';
import { HapticService } from './hapticService.ts';
import { ChevronRight, Crown, Dumbbell, Scale, Ruler, HelpCircle, X, Info, Globe, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile, plans: any) => void;
}

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [showBodyFatHelp, setShowBodyFatHelp] = useState(false);
  const [showBodyTypeHelp, setShowBodyTypeHelp] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<any>(null);
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
    workoutPreference: 'Strength + Cardio',
    detailedGoals: '',
    experienceLevel: ExperienceLevel.BEGINNER,
    yearsLifting: 0,
    athleticBackground: false,
    persona: AIPersona.ARES,
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
    if (step === 0) {
      return !!formData.persona;
    }
    if (step === 1) {
      return formData.name?.trim() !== '' && (formData.weight || 0) > 0 && (formData.height || 0) > 0 && (formData.age || 0) > 0;
    }
    if (step === 3) {
      return (formData.selectedDays?.length || 0) > 0;
    }
    if (step === 4) {
      return formData.cuisinePreference?.trim() !== '';
    }
    if (step === 5) {
      return formData.detailedGoals?.trim() !== '' && formData.workoutPreference?.trim() !== '';
    }
    return true;
  };

  const handleManual = () => {
    HapticService.impactHeavy();
    const maintenance = calculateMaintenance();
    const now = new Date();
    const joinDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const profile = { 
      ...formData, 
      maintenanceCalories: maintenance,
      joinDate: joinDate,
      goalWeight: formData.weight,
      targetBodyFat: formData.currentBodyFat
    } as UserProfile;
    
    const emptyPlans = {
      workoutPlan: (formData.selectedDays || []).map((day) => ({
        dayName: DAY_LABELS[day],
        focus: 'New Module',
        exercises: []
      })),
      dietPlan: [
        { name: 'Meal 1', calories: Math.round(maintenance * 0.3), protein: 30, carbs: 40, fats: 10, fiber: 5 },
        { name: 'Meal 2', calories: Math.round(maintenance * 0.4), protein: 40, carbs: 50, fats: 15, fiber: 10 },
        { name: 'Meal 3', calories: Math.round(maintenance * 0.3), protein: 30, carbs: 40, fats: 10, fiber: 5 },
      ],
      goalWeight: formData.weight,
      targetBodyFat: formData.currentBodyFat,
      cardioRecommendation: 'Moderate activity recommended.'
    };
    
    onComplete(profile, emptyPlans);
  };

  const handleNext = async () => {
    if (!validateStep()) {
      HapticService.notificationError();
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 500);
      return;
    }

    HapticService.impactLight();
    if (step < 5) {
      // Apply theme immediately if persona selected
      if (step === 0) {
        const root = document.documentElement;
        if (formData.persona === AIPersona.ATHENA) {
          root.classList.add('theme-athena');
        } else {
          root.classList.remove('theme-athena');
        }
      }
      setStep(step + 1);
    } else if (step === 5) {
      setLoading(true);
      const maintenance = calculateMaintenance();
      const now = new Date();
      const joinDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const profile = { 
        ...formData, 
        maintenanceCalories: maintenance,
        joinDate: joinDate
      } as UserProfile;
      try {
        setError(null);
        const plans = await generateFitnessPlan(profile);
        setGeneratedPlans(plans);
        setStep(6);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Protocol Synthesis Failed. Please check your connection and try again.");
        setLoading(false);
      }
    } else if (step === 6) {
      const maintenance = calculateMaintenance();
      const now = new Date();
      const joinDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const profile = { 
        ...formData, 
        maintenanceCalories: maintenance,
        joinDate: joinDate,
        goalWeight: generatedPlans.goalWeight, 
        targetBodyFat: generatedPlans.targetBodyFat 
      } as UserProfile;
      onComplete(profile, generatedPlans);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center p-8 text-white reveal overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md flex flex-col h-full space-y-12 pb-20">
        
        <header className="mt-16 text-center space-y-4 reveal stagger-1">
          <Crown className="text-gold mx-auto opacity-70" size={32} strokeWidth={1.5} />
          <div className="space-y-1">
            <h1 className="text-2xl font-light tracking-[0.3em] text-white uppercase">{formData.persona || 'Ares'} Protocol</h1>
            <p className="text-zinc-600 text-[10px] font-bold tracking-[0.5em] uppercase">Sequence Phase {step} / 6</p>
          </div>
        </header>

        <div className={`flex-1 space-y-8 transition-all ${errorVisible ? 'animate-shake' : ''}`}>
          {step === 0 && (
            <div className="space-y-10 reveal">
              <div className="text-center space-y-2">
                <h3 className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.5em]">Select Your Trainer</h3>
                <p className="text-[8px] text-zinc-800 uppercase tracking-widest">Choose your biological optimization architect</p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {[
                  { id: AIPersona.ARES, desc: 'High-density hypertrophy & mechanical load specialist.', color: 'border-gold/30', active: 'bg-gold text-black border-gold shadow-gold/20' },
                  { id: AIPersona.ATHENA, desc: 'Neural efficiency & structural symmetry architect.', color: 'border-zinc-500/30', active: 'bg-zinc-300 text-black border-zinc-300 shadow-white/10' }
                ].map((p, i) => (
                  <button 
                    key={p.id}
                    onClick={() => { HapticService.impactHeavy(); setFormData({...formData, persona: p.id}); }}
                    className={`p-8 rounded-[32px] border text-left space-y-3 transition-all duration-500 stagger-${i+1} ${formData.persona === p.id ? p.active + ' scale-[1.02] shadow-2xl' : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-black uppercase tracking-widest">{p.id}</span>
                      {formData.persona === p.id && <Sparkles size={18} />}
                    </div>
                    <p className={`text-[10px] leading-relaxed uppercase tracking-widest font-bold ${formData.persona === p.id ? 'text-black/60' : 'text-zinc-700'}`}>
                      {p.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                <Dumbbell className="text-gold opacity-40 mt-1" size={24} strokeWidth={1.5} />
                <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold uppercase tracking-widest">
                  Deploying {formData.persona} Protocol for high-density hypertrophy. Biological and neural optimization ready.
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-10 reveal">
              <div className="grid grid-cols-2 gap-4 stagger-1">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Experience</label>
                  <select 
                    className="w-full p-5 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-bold text-white outline-none focus:border-gold uppercase appearance-none"
                    value={formData.experienceLevel}
                    onChange={e => setFormData({...formData, experienceLevel: e.target.value as ExperienceLevel})}
                  >
                    {Object.values(ExperienceLevel).map(lvl => <option key={lvl} value={lvl}>{lvl.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Years Lifting</label>
                  <input 
                    type="number"
                    className="w-full p-5 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-bold text-white outline-none focus:border-gold uppercase"
                    value={formData.yearsLifting}
                    onChange={e => setFormData({...formData, yearsLifting: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-zinc-900 border border-white/5 rounded-2xl stagger-1.5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Athletic Background</p>
                  <p className="text-[8px] text-zinc-600 uppercase">Competitive sports history?</p>
                </div>
                <button 
                  onClick={() => { HapticService.selection(); setFormData({...formData, athleticBackground: !formData.athleticBackground}); }}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.athleticBackground ? 'bg-gold' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.athleticBackground ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="space-y-4 stagger-2">
                <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Detailed Objectives</label>
                <textarea 
                  className={`w-full p-6 bg-zinc-900 border ${errorVisible && !formData.detailedGoals?.trim() ? 'border-gold/30' : 'border-white/5'} rounded-2xl text-sm tracking-widest outline-none text-white placeholder:text-zinc-800 uppercase focus:border-gold-solid transition-all min-h-[100px] resize-none`}
                  placeholder="E.G. INCREASE BENCH PRESS, LOSE 5KG FAT"
                  value={formData.detailedGoals}
                  onChange={e => setFormData({...formData, detailedGoals: e.target.value})}
                />
              </div>
              <div className="space-y-4 stagger-2.5">
                <label className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Workout Modality</label>
                <input 
                  className={`w-full p-6 bg-zinc-900 border ${errorVisible && !formData.workoutPreference?.trim() ? 'border-gold/30' : 'border-white/5'} rounded-2xl text-sm tracking-widest outline-none text-white placeholder:text-zinc-800 uppercase focus:border-gold-solid transition-all`}
                  placeholder="E.G. CARDIO + STRENGTH, HIIT"
                  value={formData.workoutPreference}
                  onChange={e => setFormData({...formData, workoutPreference: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 6 && generatedPlans && (
            <div className="space-y-8 reveal">
              <div className="text-center space-y-2 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-gold">Protocol Review</h3>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Verify AI-Architected Targets</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 bg-zinc-900/40 border-white/5 space-y-2">
                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Target Weight</p>
                  <p className="text-xl font-light tracking-tight">{generatedPlans.goalWeight} <span className="text-[10px] text-zinc-500 uppercase">{formData.unitSystem === UnitSystem.METRIC ? 'KG' : 'LB'}</span></p>
                </Card>
                <Card className="p-6 bg-zinc-900/40 border-white/5 space-y-2">
                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Target Body Fat</p>
                  <p className="text-xl font-light tracking-tight">{generatedPlans.targetBodyFat}%</p>
                </Card>
              </div>

              <Card className="p-6 bg-zinc-900/40 border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Daily Calorie Target</p>
                  <p className="text-sm font-bold text-gold">{generatedPlans.dietPlan.reduce((acc: number, m: any) => acc + m.calories, 0)} KCAL</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Workout Split</p>
                  <div className="space-y-1">
                    {generatedPlans.workoutPlan.map((d: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{d.dayName}</span>
                        <span className="text-[9px] font-bold text-white uppercase tracking-widest">{d.focus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="p-6 rounded-[32px] border border-gold/20 bg-gold/5 space-y-3">
                <div className="flex items-center gap-3">
                  <Globe className="text-gold" size={16} />
                  <p className="text-[9px] font-black text-gold uppercase tracking-widest">Cardio Strategy</p>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed uppercase tracking-widest font-medium">
                  {generatedPlans.cardioRecommendation}
                </p>
              </div>
            </div>
          )}
        </div>

        {step === 5 ? (
          <div className="flex flex-col gap-4 mt-auto reveal stagger-4">
            <button
              disabled={loading}
              onClick={handleNext}
              className={`font-bold h-16 rounded-[32px] flex items-center justify-center space-x-4 shadow-xl active:scale-95 transition-all ${!validateStep() ? 'bg-zinc-800 text-zinc-600 opacity-50' : 'bg-gold text-black'}`}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] tracking-widest uppercase">Synthesizing...</span>
                </div>
              ) : (
                <>
                  <Sparkles size={16} className="text-black" />
                  <span className="text-[11px] tracking-[0.3em] uppercase">Build with {formData.persona} AI</span>
                  <ChevronRight size={16} strokeWidth={3} />
                </>
              )}
            </button>
            <button
              disabled={loading}
              onClick={handleManual}
              className="font-bold h-16 rounded-[32px] flex items-center justify-center space-x-4 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-all active:scale-95"
            >
              <span className="text-[11px] tracking-[0.3em] uppercase">Edit & Create Manually</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleNext}
            className={`font-bold h-16 rounded-[32px] flex items-center justify-center space-x-4 shadow-xl active:scale-95 transition-all mt-auto reveal stagger-4 ${!validateStep() ? 'bg-zinc-800 text-zinc-600 opacity-50' : 'bg-white text-black'}`}
          >
            <span className="text-[11px] tracking-[0.5em] uppercase">{step === 6 ? 'DEPLOY PROTOCOL' : 'CONTINUE'}</span>
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center animate-in fade-in slide-in-from-bottom-2">
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}
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
