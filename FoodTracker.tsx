
import React, { useState } from 'react';
import { Meal, UserProfile } from './types.ts';
import { AIService } from './src/services/aiService.ts';
import { Card } from './components/Card';
import { Plus, Trash2, Check, X, Target, ArrowLeft, Leaf, Edit3, CheckCircle2, ChevronRight, Sparkles, RefreshCw, ChefHat, Info } from 'lucide-react';
import { Type } from "@google/genai";

interface FoodTrackerProps {
  meals: Meal[];
  profile: UserProfile;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (meal: Omit<Meal, 'id' | 'checked'>, isPermanent: boolean) => void;
  onUpdateMeal?: (meal: Meal) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  onRegenerateDiet?: (newMeals: Meal[]) => void;
  onBack: () => void;
}

type MacroType = 'calories' | 'protein' | 'carbs' | 'fats' | 'fiber';

export const FoodTracker: React.FC<FoodTrackerProps> = ({ meals, profile, onToggle, onDelete, onAdd, onUpdateMeal, onUpdateProfile, onRegenerateDiet, onBack }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [showTargetEdit, setShowTargetEdit] = useState<MacroType | null>(null);
  const [newTargetValue, setNewTargetValue] = useState(0);
  const [mealData, setMealData] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, cookingInstructions: '' });
  const [showPermanentConfirm, setShowPermanentConfirm] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showInstructions, setShowInstructions] = useState<Meal | null>(null);

  const consumed = meals.reduce((acc, m) => m.checked ? {
    cal: acc.cal + m.calories,
    p: acc.p + m.protein,
    c: acc.c + m.carbs,
    f: acc.f + m.fats,
    fiber: acc.fiber + m.fiber
  } : acc, { cal: 0, p: 0, c: 0, f: 0, fiber: 0 });

  const maintenance = profile.maintenanceCalories;
  const progress = Math.min((consumed.cal / maintenance) * 100, 100);

  const triggerHaptic = (intensity: number = 10) => {
    if ('vibrate' in navigator) navigator.vibrate(intensity);
  };

  const isMealValid = mealData.name.trim() !== '' && mealData.calories > 0;

  const handleSaveMeal = () => {
    if (!isMealValid) {
      triggerHaptic(50);
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 500);
      return;
    }
    triggerHaptic();
    if (editingMeal && onUpdateMeal) {
      onUpdateMeal({ ...editingMeal, ...mealData });
      setEditingMeal(null);
      setShowModal(false);
      setMealData({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, cookingInstructions: '' });
    } else {
      setShowPermanentConfirm(true);
    }
  };

  const confirmAddMeal = (isPermanent: boolean) => {
    onAdd(mealData, isPermanent);
    setShowPermanentConfirm(false);
    setShowModal(false);
    setMealData({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, cookingInstructions: '' });
  };

  const handleEditMeal = (meal: Meal) => {
    triggerHaptic();
    setEditingMeal(meal);
    setMealData({ name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats, fiber: meal.fiber || 0, cookingInstructions: meal.cookingInstructions || '' });
    setShowModal(true);
  };

  const handleRegenerate = async () => {
    if (!onRegenerateDiet) return;
    triggerHaptic();
    setIsRegenerating(true);
    try {
      const responseText = await AIService.generateContent({
        prompt: `Generate a daily diet plan for a user with the following profile:
        Goal: ${profile.goal}
        Weight: ${profile.weight}kg
        Height: ${profile.height}cm
        Age: ${profile.age}
        Gender: ${profile.gender}
        Body Type: ${profile.bodyType}
        Cuisine Preference: ${profile.cuisinePreference}
        Maintenance Calories: ${profile.maintenanceCalories}
        Target Protein: ${profile.targetProtein}g
        Target Carbs: ${profile.targetCarbs}g
        Target Fats: ${profile.targetFats}g
        Target Fiber: ${profile.targetFiber}g

        Provide 3-5 meals that strictly follow these macro targets.
        For each meal, include detailed cooking instructions.`,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
              fiber: { type: Type.NUMBER },
              cookingInstructions: { type: Type.STRING }
            },
            required: ["name", "calories", "protein", "carbs", "fats", "fiber", "cookingInstructions"]
          }
        }
      });

      const newMeals: Meal[] = JSON.parse(responseText || "[]").map((m: any) => ({
        ...m,
        id: Math.random().toString(36).substr(2, 9),
        checked: false
      }));

      onRegenerateDiet(newMeals);
    } catch (err) {
      console.error("Diet generation failed:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const openTargetEdit = (type: MacroType) => {
    triggerHaptic();
    let currentVal = 0;
    switch(type) {
      case 'calories': currentVal = profile.maintenanceCalories; break;
      case 'protein': currentVal = profile.targetProtein || 180; break;
      case 'carbs': currentVal = profile.targetCarbs || 250; break;
      case 'fats': currentVal = profile.targetFats || 70; break;
      case 'fiber': currentVal = profile.targetFiber || 35; break;
    }
    setNewTargetValue(currentVal);
    setShowTargetEdit(type);
  };

  const saveTargetOverride = () => {
    if (!onUpdateProfile) return;
    triggerHaptic();
    const updated = { ...profile };
    switch(showTargetEdit) {
      case 'calories': updated.maintenanceCalories = newTargetValue; break;
      case 'protein': updated.targetProtein = newTargetValue; break;
      case 'carbs': updated.targetCarbs = newTargetValue; break;
      case 'fats': updated.targetFats = newTargetValue; break;
      case 'fiber': updated.targetFiber = newTargetValue; break;
    }
    onUpdateProfile(updated);
    setShowTargetEdit(null);
  };

  return (
    <div className="w-full space-y-10 px-6 pt-12 reveal overflow-y-auto no-scrollbar pb-32">
      <header className="flex justify-between items-center reveal stagger-1">
        <div className="flex items-center gap-6">
          <button onClick={() => { triggerHaptic(); onBack(); }} className="p-4 rounded-full posh-card text-zinc-500 hover:text-gold-solid transition-all hover:bg-white/10 active:scale-95"><ArrowLeft size={20} /></button>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-1">Metabolic Inventory</p>
            <h1 className="text-4xl font-light tracking-tighter uppercase">Fuel Log</h1>
          </div>
        </div>
        <button onClick={() => { triggerHaptic(); setEditingMeal(null); setMealData({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, cookingInstructions: '' }); setShowModal(true); }} className="w-16 h-16 gold-bg text-black rounded-3xl flex items-center justify-center shadow-2xl active:scale-90 transition-all hover:bg-gold/90"><Plus size={28} strokeWidth={3} /></button>
      </header>

      <Card className="p-10 relative overflow-hidden bg-zinc-950/50 reveal stagger-2 group hover:border-gold/30">
        <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700"><Leaf size={180} /></div>
        <div className="relative z-10 space-y-10">
          <div>
            <div className="flex justify-between items-center mb-4">
               <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.6em]">Daily Allocation</p>
               <button onClick={() => openTargetEdit('calories')} className="text-[8px] gold-text font-black uppercase tracking-widest border-b border-gold/30 hover:border-white hover:text-white transition-all">Override Ceiling</button>
            </div>
            <div className="flex items-baseline gap-4">
              <h2 className="text-6xl font-black gold-text tracking-tighter tabular-nums">{consumed.cal}</h2>
              <span className="text-zinc-500 text-xl font-black tracking-widest uppercase">/ {maintenance}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full gold-bg shadow-[0_0_20px_rgba(212,175,55,0.7)] transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'protein' as MacroType, l: 'PRO', v: consumed.p, t: profile.targetProtein || 180 },
              { id: 'carbs' as MacroType, l: 'CHO', v: consumed.c, t: profile.targetCarbs || 250 },
              { id: 'fats' as MacroType, l: 'FAT', v: consumed.f, t: profile.targetFats || 70 },
              { id: 'fiber' as MacroType, l: 'FBR', v: consumed.fiber, t: profile.targetFiber || 35 }
            ].map(m => (
              <button key={m.l} onClick={() => openTargetEdit(m.id)} className="group p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:border-gold/60 hover:bg-white/[0.04] transition-all tap-feedback">
                 <div className="flex justify-between items-center mb-1">
                    <p className="text-[8px] font-black text-zinc-600 tracking-[0.2em] uppercase">{m.l}</p>
                    <Edit3 size={10} className="text-zinc-800 group-hover:text-gold transition-colors" />
                 </div>
                 <p className={`text-lg font-black gold-text`}>
                    {m.v}<span className="text-[10px] text-zinc-600 font-bold tracking-tight lowercase mx-1">/</span>{m.t}<span className="text-[8px] text-zinc-700 ml-0.5">G</span>
                 </p>
                 <div className="w-full h-1 bg-zinc-900 rounded-full mt-3 overflow-hidden">
                    <div className={`h-full bg-gold transition-all duration-700`} style={{ width: `${Math.min((m.v/m.t)*100, 100)}%` }} />
                 </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-6 reveal">
        <div className="flex justify-between items-center px-2 stagger-3">
          <h3 className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.6em]">Nutritional Manifest</h3>
          {onRegenerateDiet && (
            <button 
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-xl text-[9px] font-black text-gold uppercase tracking-widest hover:bg-gold/20 transition-all disabled:opacity-50"
            >
              {isRegenerating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {isRegenerating ? 'Synthesizing...' : 'Regenerate Plan'}
            </button>
          )}
        </div>
        {meals.map((meal, idx) => (
          <div key={meal.id} className={`group p-8 rounded-[32px] border flex flex-col transition-all duration-300 stagger-${Math.min(idx+1, 4)} ${meal.checked ? 'bg-gold/5 border-gold-solid' : 'bg-transparent border-white/5 hover:border-gold-solid/60 hover:bg-white/[0.02]'}`}>
            <div className="flex items-start justify-between mb-8">
              <div onClick={() => handleEditMeal(meal)} className="cursor-pointer group-hover:opacity-90 flex-1">
                <div className="flex items-center gap-3">
                  <h4 className={`text-xl font-black uppercase tracking-tight ${meal.checked ? 'gold-text' : 'text-zinc-500 group-hover:text-zinc-200'}`}>{meal.name}</h4>
                  {meal.cookingInstructions && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowInstructions(meal); }}
                      className="p-2 bg-white/5 rounded-lg text-zinc-600 hover:text-gold transition-all"
                    >
                      <ChefHat size={14} />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-zinc-600 font-black uppercase mt-2 tracking-widest">
                  {meal.calories} KCAL | P:{meal.protein} C:{meal.carbs} F:{meal.fats} FBR:{meal.fiber || 0}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditMeal(meal)} className="p-3 text-zinc-500 hover:text-gold active:scale-90 transition-all"><Edit3 size={18} /></button>
                <button onClick={() => { triggerHaptic(20); onDelete(meal.id); }} className="p-3 text-zinc-800 hover:text-zinc-400 active:scale-90 transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
            <button 
               onClick={() => { triggerHaptic(); onToggle(meal.id); }} 
               className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] tracking-[0.5em] uppercase transition-all active:scale-[0.98] ${meal.checked ? 'gold-bg text-black shadow-lg shadow-gold/20 hover:bg-gold/90' : 'bg-white/5 text-zinc-500 border border-white/10 hover:bg-white/10 hover:border-white/30 hover:text-zinc-200'}`}
            >
              {meal.checked ? <Check size={20} strokeWidth={3} /> : <CheckCircle2 size={20} />}
              {meal.checked ? 'VERIFIED' : 'LOG ENTRY'}
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[505] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
           <div className={`w-full max-w-sm space-y-8 transition-all ${errorVisible ? 'animate-shake' : ''}`}>
              <header className="text-center space-y-2">
                 <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">{editingMeal ? 'Update Manifest' : 'Inventory Entry'}</p>
                 <h2 className="text-3xl font-light tracking-tight uppercase">Nutrient Matrix</h2>
              </header>
              <div className="space-y-4">
                 <input className={`w-full p-6 bg-zinc-900 border ${errorVisible && !mealData.name.trim() ? 'border-gold/30' : 'border-white/5'} rounded-2xl text-xs outline-none focus:border-gold-solid text-white uppercase tracking-widest transition-all hover:bg-zinc-800`} placeholder="ENTRY IDENTITY" value={mealData.name} onChange={e => setMealData({...mealData, name: e.target.value.toUpperCase()})} />
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[8px] text-zinc-600 font-bold ml-2">ENERGY (KCAL)</label><input type="number" className={`w-full p-6 bg-zinc-900 border ${errorVisible && mealData.calories === 0 ? 'border-gold/30' : 'border-white/5'} rounded-2xl text-xs outline-none text-gold font-bold transition-all hover:bg-zinc-800`} value={mealData.calories} onChange={e => setMealData({...mealData, calories: Number(e.target.value)})} /></div>
                    <div className="space-y-1"><label className="text-[8px] text-zinc-600 font-bold ml-2">PROTEIN (G)</label><input type="number" className="w-full p-6 bg-zinc-900 border border-white/5 rounded-2xl text-xs outline-none text-white font-bold hover:bg-zinc-800" value={mealData.protein} onChange={e => setMealData({...mealData, protein: Number(e.target.value)})} /></div>
                    <div className="space-y-1"><label className="text-[8px] text-zinc-600 font-bold ml-2">CARBS (G)</label><input type="number" className="w-full p-6 bg-zinc-900 border border-white/5 rounded-2xl text-xs outline-none text-white font-bold hover:bg-zinc-800" value={mealData.carbs} onChange={e => setMealData({...mealData, carbs: Number(e.target.value)})} /></div>
                    <div className="space-y-1"><label className="text-[8px] text-zinc-600 font-bold ml-2">FATS (G)</label><input type="number" className="w-full p-6 bg-zinc-900 border border-white/5 rounded-2xl text-xs outline-none text-white font-bold hover:bg-zinc-800" value={mealData.fats} onChange={e => setMealData({...mealData, fats: Number(e.target.value)})} /></div>
                    <div className="space-y-1 col-span-2"><label className="text-[8px] text-zinc-600 font-bold ml-2 uppercase">Fiber (G)</label><input type="number" className="w-full p-6 bg-zinc-900 border border-white/5 rounded-2xl text-xs outline-none text-gold font-bold hover:bg-zinc-800" value={mealData.fiber} onChange={e => setMealData({...mealData, fiber: Number(e.target.value)})} /></div>
                    <div className="space-y-1 col-span-2"><label className="text-[8px] text-zinc-600 font-bold ml-2 uppercase">Cooking Instructions</label><textarea className="w-full p-6 bg-zinc-900 border border-white/5 rounded-2xl text-xs outline-none text-white font-medium hover:bg-zinc-800 min-h-[100px] resize-none" placeholder="OPTIONAL PREPARATION STEPS..." value={mealData.cookingInstructions} onChange={e => setMealData({...mealData, cookingInstructions: e.target.value})} /></div>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => { triggerHaptic(); setShowModal(false); }} className="flex-1 p-6 bg-white/5 rounded-[32px] text-zinc-500 font-bold uppercase tracking-widest text-[10px] active:scale-95 hover:bg-white/10 hover:text-white transition-all">Abort</button>
                 <button onClick={handleSaveMeal} className={`flex-1 p-6 rounded-[32px] font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isMealValid ? 'gold-bg text-black hover:bg-gold/90' : 'bg-zinc-800 text-zinc-600'}`}>Deploy</button>
              </div>
           </div>
        </div>
      )}

      {showTargetEdit && (
        <div className="fixed inset-0 z-[506] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="w-full max-w-xs text-center space-y-12">
              <div className="space-y-4">
                 <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">System Override</p>
                 <h2 className="text-3xl font-light tracking-tight uppercase">{showTargetEdit} Ceiling</h2>
              </div>
              <div className="relative inline-block">
                <input type="number" value={newTargetValue} onChange={(e) => setNewTargetValue(Number(e.target.value))} className="w-full bg-transparent text-7xl font-light text-center outline-none gold-text tabular-nums hover:opacity-80 transition-opacity" autoFocus />
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-zinc-800 tracking-[0.4em] uppercase">{showTargetEdit === 'calories' ? 'KCAL' : 'GRAMS'}</span>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowTargetEdit(null)} className="flex-1 p-6 bg-white/5 rounded-[32px] text-zinc-500 active:scale-95 hover:bg-white/10 hover:text-white transition-all"><X size={24} className="mx-auto" /></button>
                 <button onClick={saveTargetOverride} className="flex-1 gold-bg p-6 rounded-[32px] text-black shadow-2xl shadow-gold/20 active:scale-95 hover:bg-gold/90 transition-all"><Check size={24} className="mx-auto" strokeWidth={3} /></button>
              </div>
           </div>
        </div>
      )}

      {showPermanentConfirm && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300">
           <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[48px] p-10 space-y-8 text-center">
              <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20">
                 <Target size={32} className="text-gold" />
              </div>
              <div className="space-y-2">
                 <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">Persistence Protocol</p>
                 <h2 className="text-2xl font-light tracking-tight uppercase">Commitment Level</h2>
                 <p className="text-[11px] text-zinc-500 font-light leading-relaxed">Should this entry be integrated into your daily baseline blueprint, or is it a one-off metabolic event?</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 <button 
                   onClick={() => confirmAddMeal(true)}
                   className="w-full py-5 gold-bg text-black rounded-2xl font-black text-[11px] tracking-[0.5em] uppercase shadow-lg shadow-gold/20 active:scale-95 transition-all"
                 >
                   Permanent Blueprint
                 </button>
                 <button 
                   onClick={() => confirmAddMeal(false)}
                   className="w-full py-5 bg-white/5 text-zinc-400 border border-white/10 rounded-2xl font-black text-[11px] tracking-[0.5em] uppercase hover:bg-white/10 transition-all active:scale-95"
                 >
                   One-Off Entry
                 </button>
              </div>
              <button 
                onClick={() => setShowPermanentConfirm(false)}
                className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest hover:text-zinc-400 transition-colors"
              >
                Cancel & Edit
              </button>
           </div>
        </div>
      )}

      {showInstructions && (
        <div className="fixed inset-0 z-[510] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[48px] p-10 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03]"><ChefHat size={120} /></div>
              <header className="space-y-2 relative z-10">
                 <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">Culinary Protocol</p>
                 <h2 className="text-2xl font-light tracking-tight uppercase">{showInstructions.name}</h2>
              </header>
              <div className="space-y-4 relative z-10">
                 <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Info size={16} className="text-gold mt-1 shrink-0" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                       {showInstructions.cookingInstructions}
                    </p>
                 </div>
              </div>
              <button 
                onClick={() => setShowInstructions(null)}
                className="w-full py-5 gold-bg text-black rounded-2xl font-black text-[11px] tracking-[0.5em] uppercase shadow-lg shadow-gold/20 active:scale-95 transition-all"
              >
                Close Protocol
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
