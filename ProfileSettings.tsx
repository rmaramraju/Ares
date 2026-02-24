import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, UserProfile, Goal, AIPersona, Gender, UnitSystem, MuscleGroup, ExerciseMetadata, Theme } from './types.ts';
import { Card } from './components/Card.tsx';
import { HapticService } from './hapticService.ts';
import { EXERCISE_DIRECTORY } from './exerciseDirectory.ts';
import { 
  User, 
  LogOut, 
  Scale, 
  Target, 
  Edit3, 
  X, 
  Check, 
  Watch, 
  ShieldCheck, 
  Zap,
  Camera,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Cpu,
  SmartphoneNfc,
  Activity,
  Lock,
  AlertTriangle,
  Power,
  Timer,
  Bell,
  Settings2,
  AlertCircle,
  Mail,
  Globe,
  Settings,
  EyeOff,
  Database,
  History,
  HardDrive,
  BookOpen,
  Search,
  ArrowLeft,
  Info,
  Plus,
  Youtube,
  Save,
  Trash2,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

interface ProfileSettingsProps {
  state: AppState;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout: () => void;
  onLogWeight: (weight: number) => void;
  onLogWaist: (waist: number) => void;
  onToggleWearable: (id: string) => void;
  onAddCustomExercise: (ex: ExerciseMetadata) => void;
  onUpdateExercise: (ex: ExerciseMetadata) => void;
  onDeleteExercise: (id: string) => void;
  onUpdateTheme: (theme: Theme) => void;
  onToggleNav?: (visible: boolean) => void;
}

const INTEGRATION_PROVIDERS = [
  { id: 'apple', name: 'Apple Health', icon: Watch, color: 'text-white' },
  { id: 'garmin', name: 'Garmin Connect', icon: Cpu, color: 'text-zinc-400' },
  { id: 'whoop', name: 'Whoop', icon: ShieldCheck, color: 'text-zinc-400' },
  { id: 'oura', name: 'Oura Ring', icon: SmartphoneNfc, color: 'text-zinc-400' },
  { id: 'ultrahuman', name: 'Ultrahuman', icon: Zap, color: 'text-gold' }
];

const MUSCLE_LIST: MuscleGroup[] = ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Glutes'];

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ state, onUpdateProfile, onLogout, onLogWeight, onLogWaist, onToggleWearable, onAddCustomExercise, onUpdateExercise, onDeleteExercise, onUpdateTheme, onToggleNav }) => {
  const profile = state.profile;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showEditMetric, setShowEditMetric] = useState<'weight' | 'goalWeight' | 'waist' | 'currentFat' | 'targetFat' | 'restTimer' | null>(null);
  const [metricValue, setMetricValue] = useState(0);
  const [showIdentityEditor, setShowIdentityEditor] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showTerminationConfirm, setShowTerminationConfirm] = useState(false);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<Partial<ExerciseMetadata> | null>(null);
  const [showWeightInfo, setShowWeightInfo] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [customExercise, setCustomExercise] = useState<Partial<ExerciseMetadata>>({
    name: '',
    primaryMuscle: 'Chest',
    category: 'Compound',
    youtubeId: ''
  });
  const [ytUrl, setYtUrl] = useState('');

  const mergedDirectory = useMemo(() => {
    const userIds = new Set(state.userExercises.map(ex => ex.id));
    const baseExercises = EXERCISE_DIRECTORY.filter(ex => !userIds.has(ex.id));
    return [...baseExercises, ...state.userExercises];
  }, [state.userExercises]);

  const [cameraStatus, setCameraStatus] = useState<PermissionState>('prompt');
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');

  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email || 'operator@ares.protocol',
        age: profile.age,
        height: profile.height,
        gender: profile.gender,
        goal: profile.goal,
        persona: profile.persona,
        unitSystem: profile.unitSystem || UnitSystem.METRIC,
        selectedDays: profile.selectedDays || []
      });
    }
  }, [profile, showIdentityEditor]);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (onToggleNav) {
      onToggleNav(!(showIdentityEditor || showEncyclopedia || showAddCustom || !!showEditMetric || showTerminationConfirm));
    }
  }, [showIdentityEditor, showEncyclopedia, showAddCustom, showEditMetric, showTerminationConfirm, onToggleNav]);

  const categories = useMemo(() => {
    const cats = new Set(mergedDirectory.map(ex => ex.category));
    return Array.from(cats).sort();
  }, [mergedDirectory]);

  const filteredExercises = useMemo(() => {
    return mergedDirectory.filter(ex => 
      (ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || ex.primaryMuscle.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!selectedCategory || ex.category === selectedCategory)
    );
  }, [searchTerm, selectedCategory, mergedDirectory]);

  const checkPermissions = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const cam = await navigator.permissions.query({ name: 'camera' as any });
          setCameraStatus(cam.state);
          cam.onchange = () => setCameraStatus(cam.state);
        } catch (e) {
          console.warn("ARES_CORE: Camera permission query not supported in this browser.");
        }
      }
      if ('Notification' in window) {
        setNotificationStatus(Notification.permission);
      }
    } catch (e) {
      console.warn("ARES_CORE: Permission check bypassed.", e);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      checkPermissions();
      HapticService.notificationSuccess();
    } catch (e) {
      HapticService.notificationError();
      checkPermissions();
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') HapticService.notificationSuccess();
      else HapticService.notificationError();
    }
  };

  const handleProfilePicClick = () => {
    HapticService.selection();
    fileInputRef.current?.click();
  };

  const toggleDay = (day: number) => {
    setFormData(prev => {
      const current = prev.selectedDays || [];
      const next = current.includes(day) 
        ? current.filter(d => d !== day)
        : [...current, day].sort();
      return { ...prev, selectedDays: next };
    });
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        HapticService.notificationSuccess();
        onUpdateProfile({ ...profile, profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveIdentity = () => {
    if (profile && formData) {
      HapticService.notificationSuccess();
      onUpdateProfile({ ...profile, ...formData } as UserProfile);
      setShowIdentityEditor(false);
    }
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : '';
  };

  const handleSaveCustomExercise = () => {
    if (!customExercise.name || !customExercise.primaryMuscle) {
      HapticService.notificationError();
      return;
    }

    const videoId = ytUrl ? extractYoutubeId(ytUrl) : '';
    const newEx: ExerciseMetadata = {
      id: 'custom-' + Date.now(),
      name: customExercise.name.toUpperCase(),
      primaryMuscle: customExercise.primaryMuscle as MuscleGroup,
      category: customExercise.category || 'Compound',
      youtubeId: videoId,
      animationUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
    };

    onAddCustomExercise(newEx);
    setCustomExercise({ name: '', primaryMuscle: 'Chest', category: 'Compound' });
    setYtUrl('');
    setShowAddCustom(false);
    HapticService.notificationSuccess();
  };

  const handleUpdateExerciseInternal = () => {
    if (!editingExercise || !editingExercise.id) return;
    onUpdateExercise(editingExercise as ExerciseMetadata);
    setExpandedExerciseId(null);
    setEditingExercise(null);
    HapticService.notificationSuccess();
  };

  if (!profile) return null;

  const handleMetricSubmit = () => {
    HapticService.notificationSuccess();
    if (showEditMetric === 'weight') onLogWeight(metricValue);
    else if (showEditMetric === 'waist') onLogWaist(metricValue);
    else if (showEditMetric === 'goalWeight') onUpdateProfile({ ...profile, goalWeight: metricValue });
    else if (showEditMetric === 'currentFat') onUpdateProfile({ ...profile, currentBodyFat: metricValue });
    else if (showEditMetric === 'targetFat') onUpdateProfile({ ...profile, targetBodyFat: metricValue });
    else if (showEditMetric === 'restTimer') onUpdateProfile({ ...profile, restTimerDuration: metricValue });
    setShowEditMetric(null);
  };

  const isMetric = (profile.unitSystem || UnitSystem.METRIC) === UnitSystem.METRIC;

  return (
    <div className="flex flex-col items-center w-full px-6 pt-16 space-y-12 reveal pb-40">
      <header className="w-full text-center space-y-6">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        
        <div className="relative inline-block cursor-pointer group" onClick={handleProfilePicClick}>
          <div className="w-32 h-32 rounded-full gold-bg flex items-center justify-center p-1 shadow-[0_20px_60px_rgba(191,149,63,0.3)] transition-transform group-hover:scale-105 active:scale-95">
             <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white overflow-hidden relative border-4 border-black">
               {profile.profilePic ? (
                 <img src={profile.profilePic} className="w-full h-full object-cover" alt="Profile" />
               ) : (
                 <User size={56} className="gold-text opacity-40" />
               )}
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera size={24} className="text-white" />
               </div>
             </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-black border-2 border-gold rounded-full flex items-center justify-center shadow-lg">
            <Camera size={14} className="text-gold" />
          </div>
        </div>
        
        <div className="space-y-1">
          <h2 className="text-3xl font-bold uppercase tracking-tight">{profile.name}</h2>
          <div className="flex items-center justify-center gap-3">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em]">RANK: {profile.persona.toUpperCase()}</p>
            <div className="w-1 h-1 rounded-full bg-gold/40" />
            <button 
              onClick={() => { HapticService.impactHeavy(); setShowIdentityEditor(true); }}
              className="text-[10px] text-gold font-bold uppercase tracking-widest border-b border-gold/30 hover:border-gold transition-all"
            >
              Configure Identity
            </button>
          </div>
        </div>
      </header>

      {/* Biometric Benchmarks */}
      <section className="w-full space-y-6">
        <div className="flex justify-between items-center px-2">
           <div className="flex items-center gap-2">
             <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.5em]">Biometric Benchmarks</h3>
             <button onClick={() => setShowWeightInfo(!showWeightInfo)} className="text-zinc-700 hover:text-gold transition-colors">
               <Info size={12} />
             </button>
           </div>
           <Activity size={14} className="text-gold opacity-50" />
        </div>

        {showWeightInfo && (
          <div className="px-2 py-4 bg-gold/5 border border-gold/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[8px] text-gold font-bold uppercase tracking-widest leading-relaxed">
              Log your weight daily, every 3 days, or weekly. This telemetry powers the weight metrics in your analytics suite to track progress over time.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card onClick={() => { HapticService.selection(); setMetricValue(profile.weight); setShowEditMetric('weight'); }} className="p-8 flex flex-col items-center gap-4 border-white/5 bg-zinc-900/20 group hover:border-gold/40 transition-all tap-feedback">
             <Scale size={20} className="text-zinc-500 group-hover:text-gold transition-colors" />
             <div className="text-center space-y-1">
                <p className="text-2xl font-bold group-hover:gold-text transition-colors tabular-nums">{profile.weight} <span className="text-[10px] text-zinc-500 font-black">{isMetric ? 'KG' : 'LB'}</span></p>
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Current Mass</p>
             </div>
          </Card>
          <Card onClick={() => { HapticService.selection(); setMetricValue(state.waistHistory.length > 0 ? state.waistHistory[state.waistHistory.length - 1].value : 0); setShowEditMetric('waist'); }} className="p-8 flex flex-col items-center gap-4 border-white/5 bg-zinc-900/20 group hover:border-gold/40 transition-all tap-feedback">
             <Activity size={20} className="text-zinc-500 group-hover:text-gold transition-colors" />
             <div className="text-center space-y-1">
                <p className="text-2xl font-bold group-hover:gold-text transition-colors tabular-nums">{state.waistHistory.length > 0 ? state.waistHistory[state.waistHistory.length - 1].value : '--'} <span className="text-[10px] text-zinc-500 font-black">{isMetric ? 'CM' : 'IN'}</span></p>
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Waist Circum.</p>
             </div>
          </Card>
          <Card onClick={() => { HapticService.selection(); setMetricValue(profile.goalWeight); setShowEditMetric('goalWeight'); }} className="p-8 flex flex-col items-center gap-4 border-gold/20 bg-gold/5 group hover:bg-gold/10 transition-all tap-feedback">
             <Target size={20} className="text-gold" />
             <div className="text-center space-y-1">
                <p className="text-2xl font-bold gold-text tabular-nums">{profile.goalWeight} <span className="text-[10px] text-zinc-500 font-black">{isMetric ? 'KG' : 'LB'}</span></p>
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Target Mass</p>
             </div>
          </Card>
          <Card onClick={() => { HapticService.selection(); setMetricValue(profile.restTimerDuration); setShowEditMetric('restTimer'); }} className="p-8 flex flex-col items-center gap-4 border-white/5 bg-zinc-900/20 group hover:border-gold/40 transition-all tap-feedback">
             <Timer size={20} className="text-zinc-500 group-hover:text-gold transition-colors" />
             <div className="text-center space-y-1">
                <p className="text-2xl font-bold group-hover:gold-text transition-colors tabular-nums">{profile.restTimerDuration} <span className="text-[10px] text-zinc-500 font-black">SEC</span></p>
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Rest Interval</p>
             </div>
          </Card>
        </div>
      </section>

      {/* Exercise Archives Section */}
      <section className="w-full space-y-6">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.5em]">Module Archives</h3>
           <BookOpen size={14} className="text-gold opacity-50" />
        </div>
        <Card onClick={() => { HapticService.selection(); setShowEncyclopedia(true); }} className="p-8 border-gold/20 bg-zinc-950 flex items-center justify-between hover:border-gold/60 transition-all group tap-feedback">
           <div className="flex items-center gap-6">
              <div className="p-3 bg-gold/10 rounded-xl group-hover:bg-gold/20 transition-colors">
                 <BookOpen size={20} className="text-gold" />
              </div>
              <div>
                 <h4 className="text-sm font-black uppercase tracking-widest group-hover:gold-text transition-colors">Exercise Encyclopedia</h4>
                 <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Browse Full Movement Library</p>
              </div>
           </div>
           <ChevronRight className="text-zinc-800 group-hover:text-gold" size={20} />
        </Card>
      </section>

      {/* Hardware Hub Section */}
      <section className="w-full space-y-6">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.5em]">System Permissions</h3>
           <ShieldCheck size={14} className="text-gold opacity-50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card onClick={requestCameraPermission} className="p-6 bg-zinc-900/20 border-white/5 flex flex-col items-center gap-3 hover:border-gold/40 transition-all tap-feedback">
            <Camera size={18} className={cameraStatus === 'granted' ? 'text-gold' : 'text-zinc-500'} />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest">{cameraStatus === 'granted' ? 'AUTHORIZED' : 'CAMERA'}</p>
              <p className="text-[7px] text-zinc-600 font-bold uppercase mt-1">{cameraStatus === 'granted' ? 'Active' : 'Request Access'}</p>
            </div>
          </Card>
          <Card onClick={requestNotificationPermission} className="p-6 bg-zinc-900/20 border-white/5 flex flex-col items-center gap-3 hover:border-gold/40 transition-all tap-feedback">
            <Bell size={18} className={notificationStatus === 'granted' ? 'text-gold' : 'text-zinc-500'} />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest">{notificationStatus === 'granted' ? 'AUTHORIZED' : 'NOTIFICATIONS'}</p>
              <p className="text-[7px] text-zinc-600 font-bold uppercase mt-1">{notificationStatus === 'granted' ? 'Active' : 'Request Access'}</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Hardware Hub Section */}
      <section className="w-full space-y-4">
         <button onClick={() => { HapticService.selection(); setShowIntegrations(!showIntegrations); }} className="w-full flex justify-between items-center px-4 py-2 hover:bg-white/5 rounded-xl transition-all tap-feedback">
            <div className="flex items-center gap-4">
               <Cpu size={16} className="text-gold" />
               <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.5em]">Hardware Hub</h3>
            </div>
            {showIntegrations ? <ChevronUp size={16} className="text-zinc-600" /> : <ChevronDown size={16} className="text-zinc-600" />}
         </button>
         
         {showIntegrations && (
           <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
             {INTEGRATION_PROVIDERS.map(prov => (
                <Card key={prov.id} className="p-6 bg-zinc-900/40 border-white/5 flex items-center justify-between hover:border-gold/20 transition-all group tap-feedback">
                   <div className="flex items-center gap-4">
                      <prov.icon size={20} className={`${prov.color}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{prov.name}</span>
                   </div>
                   <button onClick={() => onToggleWearable(prov.id)} className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${state.connectedWearables.includes(prov.id) ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/5 text-zinc-600 border border-white/5'}`}>
                      {state.connectedWearables.includes(prov.id) ? 'Linked' : 'Link'}
                   </button>
                </Card>
             ))}
           </div>
         )}
      </section>

      {/* System Authority Section */}
      <section className="w-full space-y-6">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.5em]">System Authority</h3>
           <Lock size={14} className="text-zinc-700" />
        </div>
        <Card onClick={() => { HapticService.impactHeavy(); setShowTerminationConfirm(true); }} className="p-8 border-white/10 bg-zinc-900/40 flex items-center justify-between group hover:bg-zinc-800 hover:border-gold/40 transition-all duration-500 tap-feedback">
           <div className="flex items-center gap-6">
              <div className="p-3 bg-zinc-800 text-gold rounded-2xl shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                 <Power size={20} />
              </div>
              <div>
                 <h4 className="text-sm font-black uppercase tracking-widest text-zinc-400 group-hover:text-gold transition-colors">TERMINATE SESSION</h4>
                 <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Protocol Shutdown</p>
              </div>
           </div>
           <LogOut size={16} className="text-zinc-700 group-hover:text-gold transition-colors" />
        </Card>
      </section>

      {/* Identity Editor Modal */}
      {showIdentityEditor && (
        <div className="fixed inset-0 z-[1000] bg-zinc-950 flex flex-col p-8 animate-in slide-in-from-bottom duration-500 overflow-y-auto no-scrollbar pt-16">
          <header className="flex justify-between items-center mb-12 mt-8">
            <div className="space-y-1">
               <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">Identity Module</p>
               <h3 className="text-2xl font-light tracking-tight uppercase">Core Configuration</h3>
            </div>
            <button onClick={() => { HapticService.impactMedium(); setShowIdentityEditor(false); }} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all"><X size={24} /></button>
          </header>

          <div className="space-y-8 flex-1">
            <div className="space-y-4">
               <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Subject Name</label>
               <div className="relative">
                  <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700" />
                  <input className="w-full bg-zinc-900 border border-white/5 p-5 pl-14 rounded-2xl text-xs font-bold text-white outline-none focus:border-gold-solid uppercase tracking-widest" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
               </div>
            </div>
            <div className="space-y-4">
               <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Secure Email</label>
               <div className="relative">
                  <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700" />
                  <input className="w-full bg-zinc-900 border border-white/5 p-5 pl-14 rounded-2xl text-xs font-bold text-zinc-500 outline-none focus:border-gold-solid tracking-widest" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-4">
                  <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Gender</label>
                  <select className="w-full bg-zinc-900 border border-white/5 p-5 rounded-2xl text-xs font-bold text-white outline-none focus:border-gold-solid uppercase appearance-none" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}>
                    {Object.values(Gender).map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                  </select>
               </div>
               <div className="space-y-4">
                  <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Goal Protocol</label>
                  <select className="w-full bg-zinc-900 border border-white/5 p-5 rounded-2xl text-xs font-bold text-gold outline-none focus:border-gold-solid uppercase appearance-none" value={formData.goal} onChange={(e) => setFormData({ ...formData, goal: e.target.value as Goal })}>
                    {Object.values(Goal).map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                  </select>
               </div>
            </div>

            <div className="space-y-6">
               <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Operational Schedule</label>
               <div className="grid grid-cols-7 gap-2">
                  {['S','M','T','W','T','F','S'].map((day, i) => {
                    const isSelected = formData.selectedDays?.includes(i);
                    return (
                      <button 
                        key={i}
                        onClick={() => toggleDay(i)}
                        className={`h-12 rounded-xl border text-[10px] font-black transition-all ${isSelected ? 'bg-gold border-gold text-black shadow-lg shadow-gold/20' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
                      >
                        {day}
                      </button>
                    );
                  })}
               </div>
               <p className="text-[7px] text-zinc-700 uppercase tracking-widest text-center">Select active deployment windows. Past data remains immutable.</p>
            </div>
          </div>

          <footer className="py-8 space-y-4 bg-zinc-950 sticky bottom-0 border-t border-white/5 pt-6">
            <button onClick={saveIdentity} className="w-full h-16 rounded-[24px] gold-metallic text-black font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl active:scale-95 transition-all">Commit Changes</button>
          </footer>
        </div>
      )}

      {/* Exercise Encyclopedia Modal */}
      {showEncyclopedia && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in slide-in-from-bottom duration-500 pt-16">
           <header className="p-8 border-b border-white/5 flex items-center justify-between bg-black/50 backdrop-blur-xl">
              <div className="flex items-center gap-5">
                <button onClick={() => { HapticService.impactLight(); setShowEncyclopedia(false); }} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
                <div>
                   <p className="text-[10px] text-gold font-bold uppercase tracking-[0.4em]">Movement Library</p>
                   <h2 className="text-2xl font-light tracking-tight uppercase">Encyclopedia</h2>
                </div>
              </div>
              <button 
                onClick={() => { HapticService.impactMedium(); setShowAddCustom(true); }}
                className="w-12 h-12 gold-bg rounded-2xl flex items-center justify-center text-black shadow-lg shadow-gold/20 active:scale-90 transition-all group"
                title="Forge New Movement"
              >
                 <Plus size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
              </button>
           </header>
           
           <div className="p-8 border-b border-white/5 bg-zinc-950/50 space-y-6">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                <input placeholder="SEARCH ARCHIVES" className="w-full bg-zinc-900/50 border border-white/5 rounded-[28px] p-6 pl-16 text-xs tracking-widest outline-none focus:border-gold-solid text-white uppercase transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                 <button onClick={() => setSelectedCategory(null)} className={`flex-none px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${!selectedCategory ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-transparent border-white/10 text-zinc-500 hover:text-zinc-300'}`}>All</button>
                 {categories.map(cat => (
                   <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-none px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-transparent border-white/10 text-zinc-500 hover:text-zinc-300'}`}>{cat}</button>
                 ))}
              </div>
           </div>

            <div className="p-8 flex-1 overflow-y-auto space-y-4 no-scrollbar pb-32">
              {filteredExercises.length > 0 ? filteredExercises.map(ex => {
                const isExpanded = expandedExerciseId === ex.id;
                const isCustom = ex.id.startsWith('custom-');
                
                return (
                  <Card key={ex.id} className={`bg-zinc-900/20 border-white/5 transition-all overflow-hidden ${isExpanded ? 'ring-1 ring-gold/30' : 'hover:border-gold/20'}`}>
                    <div 
                      onClick={() => {
                        HapticService.selection();
                        if (isExpanded) {
                          setExpandedExerciseId(null);
                          setEditingExercise(null);
                        } else {
                          setExpandedExerciseId(ex.id);
                          setEditingExercise(ex);
                        }
                      }}
                      className="p-6 flex justify-between items-center cursor-pointer group"
                    >
                      <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-700 overflow-hidden relative">
                          {ex.youtubeId ? (
                            <img src={ex.animationUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={ex.name} />
                          ) : (
                            <Youtube size={24} className="text-zinc-800 opacity-20" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm uppercase tracking-tight group-hover:gold-text transition-colors">{ex.name}</h5>
                          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-1">{ex.primaryMuscle} | {ex.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {isCustom && <span className="px-2 py-0.5 bg-gold/10 text-gold text-[6px] font-black rounded border border-gold/20 uppercase">USER</span>}
                        {!isCustom && state.userExercises.some(ux => ux.id === ex.id) && <span className="px-2 py-0.5 bg-gold/10 text-gold text-[6px] font-black rounded border border-gold/20 uppercase">MODIFIED</span>}
                        {isExpanded ? <ChevronUp className="text-gold" size={16} /> : <ChevronDown className="text-zinc-800 group-hover:text-gold" size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 space-y-6 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Name</label>
                            <input 
                              disabled={!isCustom}
                              className="w-full bg-zinc-950 border border-white/5 p-4 rounded-xl text-[10px] font-bold text-white outline-none focus:border-gold uppercase tracking-widest disabled:opacity-50"
                              value={editingExercise?.name}
                              onChange={e => setEditingExercise(prev => prev ? {...prev, name: e.target.value} : null)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Muscle</label>
                              <select 
                                disabled={!isCustom}
                                className="w-full bg-zinc-950 border border-white/5 p-4 rounded-xl text-[10px] font-bold text-white outline-none focus:border-gold uppercase disabled:opacity-50"
                                value={editingExercise?.primaryMuscle}
                                onChange={e => setEditingExercise(prev => prev ? {...prev, primaryMuscle: e.target.value as MuscleGroup} : null)}
                              >
                                {MUSCLE_LIST.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Class</label>
                              <select 
                                disabled={!isCustom}
                                className="w-full bg-zinc-950 border border-white/5 p-4 rounded-xl text-[10px] font-bold text-white outline-none focus:border-gold uppercase disabled:opacity-50"
                                value={editingExercise?.category}
                                onChange={e => setEditingExercise(prev => prev ? {...prev, category: e.target.value} : null)}
                              >
                                <option value="Compound">COMPOUND</option>
                                <option value="Isolation">ISOLATION</option>
                                <option value="Cardio">CARDIO</option>
                                <option value="HIIT">HIIT</option>
                                <option value="Recovery">RECOVERY</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest ml-1">YouTube Link</label>
                            <div className="relative">
                              <Youtube size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                              <input 
                                className="w-full bg-zinc-950 border border-white/5 p-4 pl-12 rounded-xl text-[10px] font-bold text-zinc-400 outline-none focus:border-gold tracking-widest"
                                placeholder="HTTPS://YOUTU.BE/..."
                                value={editingExercise?.youtubeId ? `https://youtu.be/${editingExercise.youtubeId}` : ''}
                                onChange={e => {
                                  const id = extractYoutubeId(e.target.value);
                                  setEditingExercise(prev => prev ? {...prev, youtubeId: id, animationUrl: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''} : null);
                                }}
                              />
                            </div>
                            {editingExercise?.youtubeId && (
                              <div className="mt-2 relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-zinc-950">
                                <img 
                                  src={`https://img.youtube.com/vi/${editingExercise.youtubeId}/mqdefault.jpg`} 
                                  className="w-full h-full object-cover opacity-60"
                                  alt="Preview"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Youtube size={24} className="text-gold opacity-50" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {isCustom ? (
                            <button 
                              onClick={() => { HapticService.impactHeavy(); onDeleteExercise(ex.id); setExpandedExerciseId(null); }}
                              className="flex-1 py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Trash2 size={12} /> Delete Module
                            </button>
                          ) : state.userExercises.some(ux => ux.id === ex.id) ? (
                            <button 
                              onClick={() => { HapticService.impactHeavy(); onDeleteExercise(ex.id); setExpandedExerciseId(null); }}
                              className="flex-1 py-4 bg-zinc-900 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-all flex items-center justify-center gap-2"
                            >
                              <History size={12} /> Reset to System
                            </button>
                          ) : null}
                          
                          <button 
                            onClick={handleUpdateExerciseInternal}
                            className="flex-1 py-4 gold-metallic rounded-xl text-[8px] font-black uppercase tracking-widest text-black shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                          >
                            <Save size={12} /> Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-800 gap-4">
                   <Search size={40} className="opacity-10" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Results in Archive</p>
                </div>
             )}
           </div>
        </div>
      )}

      {/* Forge New Module Modal */}
      {showAddCustom && (
        <div className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500">
           <div className="w-full max-w-sm space-y-10">
              <header className="text-center space-y-4">
                 <div className="w-20 h-20 bg-gold/10 rounded-[32px] flex items-center justify-center mx-auto border border-gold/20 shadow-[0_0_40px_rgba(212,175,55,0.1)]">
                    <Plus size={32} className="text-gold" strokeWidth={3} />
                 </div>
                 <div>
                    <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">Inventory Synthesis</p>
                    <h3 className="text-2xl font-light tracking-tight uppercase">Forge New Module</h3>
                 </div>
              </header>

              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Module Identity</label>
                   <input 
                    className="w-full bg-zinc-900 border border-white/5 p-5 rounded-2xl text-xs font-bold text-white outline-none focus:border-gold-solid uppercase tracking-widest placeholder:text-zinc-800" 
                    placeholder="E.G. BARBELL OVERHEAD PRESS" 
                    value={customExercise.name} 
                    onChange={e => setCustomExercise({...customExercise, name: e.target.value})} 
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Muscle Node</label>
                     <select 
                      className="w-full bg-zinc-900 border border-white/5 p-5 rounded-2xl text-[10px] font-bold text-white outline-none focus:border-gold uppercase appearance-none" 
                      value={customExercise.primaryMuscle} 
                      onChange={e => setCustomExercise({...customExercise, primaryMuscle: e.target.value as MuscleGroup})}
                     >
                        {MUSCLE_LIST.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Movement Class</label>
                     <select 
                      className="w-full bg-zinc-900 border border-white/5 p-5 rounded-2xl text-[10px] font-bold text-white outline-none focus:border-gold uppercase appearance-none" 
                      value={customExercise.category} 
                      onChange={e => setCustomExercise({...customExercise, category: e.target.value})}
                     >
                        <option value="Compound">COMPOUND</option>
                        <option value="Isolation">ISOLATION</option>
                        <option value="Cardio">CARDIO</option>
                        <option value="HIIT">HIIT</option>
                        <option value="Recovery">RECOVERY</option>
                     </select>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">Visual Archive (YouTube URL)</label>
                   <div className="relative">
                      <Youtube size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700" />
                      <input 
                        className={`w-full bg-zinc-900 border p-5 pl-14 rounded-2xl text-[10px] font-bold outline-none tracking-widest placeholder:text-zinc-800 transition-all ${ytUrl && !extractYoutubeId(ytUrl) ? 'border-red-500/50 text-red-400' : 'border-white/5 text-zinc-400 focus:border-gold-solid'}`} 
                        placeholder="HTTPS://WWW.YOUTUBE.COM/WATCH?V=..." 
                        value={ytUrl} 
                        onChange={e => setYtUrl(e.target.value)} 
                      />
                   </div>
                   {ytUrl && extractYoutubeId(ytUrl) && (
                     <div className="mt-4 relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 animate-in fade-in zoom-in-95 duration-300">
                        <img 
                          src={`https://img.youtube.com/vi/${extractYoutubeId(ytUrl)}/mqdefault.jpg`} 
                          className="w-full h-full object-cover opacity-60"
                          alt="Preview"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Youtube size={32} className="text-gold opacity-50" />
                        </div>
                     </div>
                   )}
                   {ytUrl && !extractYoutubeId(ytUrl) && (
                     <p className="text-[7px] text-red-500 uppercase tracking-widest mt-1">Invalid YouTube URL format</p>
                   )}
                   <p className="text-[7px] text-zinc-700 uppercase tracking-widest text-right mt-1">*Used for real-time video guidance</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowAddCustom(false)} className="flex-1 py-5 bg-white/5 rounded-[24px] text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:bg-white/10 transition-colors">Abort</button>
                 <button 
                  onClick={handleSaveCustomExercise} 
                  disabled={!customExercise.name}
                  className="flex-1 py-5 gold-metallic rounded-[24px] text-[9px] font-black uppercase tracking-widest shadow-2xl shadow-gold/20 flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale transition-all"
                 >
                   <Save size={14} /> Commit to Vault
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Termination Confirmation Overlay */}
      {showTerminationConfirm && (
        <div className="fixed inset-0 z-[1000] bg-zinc-950/95 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-sm space-y-12">
            <header className="text-center space-y-6">
               <div className="w-24 h-24 rounded-full border-2 border-gold/50 flex items-center justify-center mx-auto bg-gold/10">
                  <AlertTriangle size={48} className="text-gold animate-pulse" />
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">System Alert</p>
                  <h2 className="text-3xl font-light tracking-tight uppercase">Confirm Logout?</h2>
                  <p className="text-xs text-zinc-500 leading-relaxed uppercase tracking-tighter px-4 text-center">ARES PROTOCOL WILL DEAUTHORIZE ALL ACTIVE TELEMETRY. THE FORGE GROWS COLD.</p>
               </div>
            </header>
            <div className="space-y-4">
              <button onClick={onLogout} className="w-full py-7 rounded-[32px] bg-zinc-900 border border-white/10 text-gold font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl active:scale-95 transition-all tap-feedback">Deauthorize</button>
              <button onClick={() => { HapticService.impactLight(); setShowTerminationConfirm(false); }} className="w-full py-5 text-zinc-600 font-bold uppercase tracking-widest text-[9px] hover:text-white transition-colors tap-feedback">Abort</button>
            </div>
          </div>
        </div>
      )}

      {/* Metric Editor Overlay */}
      {showEditMetric && (
        <div className="fixed inset-0 z-[610] bg-zinc-950 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
           <div className="w-full max-w-xs space-y-12 text-center">
              <div className="space-y-4">
                 <p className="text-[10px] text-gold font-bold uppercase tracking-[0.5em]">Metric Update</p>
                 <h2 className="text-4xl font-light tracking-tight uppercase">Enter Value</h2>
              </div>
              <div className="relative inline-block">
                <input type="number" value={metricValue} onChange={(e) => setMetricValue(parseFloat(e.target.value))} className="w-full bg-transparent text-8xl font-black text-center outline-none gold-text tabular-nums" autoFocus />
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-zinc-800 tracking-[0.4em] uppercase">
                  {showEditMetric === 'weight' || showEditMetric === 'goalWeight' ? (isMetric ? 'KG' : 'LB') : 
                   showEditMetric === 'waist' ? (isMetric ? 'CM' : 'IN') :
                   showEditMetric === 'restTimer' ? 'SEC' : '%'}
                </span>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => { HapticService.impactLight(); setShowEditMetric(null); }} className="flex-1 p-8 bg-white/5 rounded-[32px] text-zinc-600 hover:text-white tap-feedback"><X size={28} className="mx-auto" /></button>
                 <button onClick={handleMetricSubmit} className="flex-1 gold-bg p-8 rounded-[32px] text-black shadow-2xl shadow-gold/40 active:scale-95 transition-all tap-feedback"><Check size={28} className="mx-auto" strokeWidth={4} /></button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};