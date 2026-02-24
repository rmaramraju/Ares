
export enum ExperienceLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export enum BodyType {
  ECTOMORPH = 'Ectomorph',
  ENDOMORPH = 'Endomorph',
  MESOMORPH = 'Mesomorph'
}

export enum Goal {
  BULK = 'Bulking',
  CUT = 'Cutting',
  MAINTAIN = 'Maintenance',
  RECOMP = 'Recomposition'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

export enum UnitSystem {
  METRIC = 'Metric',
  IMPERIAL = 'Imperial'
}

export enum AIPersona {
  ARES = 'Ares',
  ATHENA = 'Athena'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

export enum SetType {
  NORMAL = 'Normal',
  DROPSET = 'Dropset',
  SUPERSET = 'Superset',
  FAILURE = 'Failure'
}

export type MuscleGroup = 'Chest' | 'Back' | 'Quads' | 'Hamstrings' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Core' | 'Calves' | 'Glutes';

export type DayStatus = 'full' | 'workout_only' | 'food_only' | 'missed' | 'rest' | 'sick';

export interface ExerciseMetadata {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  animationUrl: string;
  youtubeId?: string;
  category: string;
  isCardio?: boolean;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  instructions: string;
  category: string;
  targetWeight?: string;
  metadata?: ExerciseMetadata;
  setConfigs?: SetType[];
  supersetPartner?: Exercise;
}

export interface WorkoutDay {
  id: string;
  dayName: string;
  focus: string;
  exercises: Exercise[];
}

export interface Routine {
  id: string;
  name: string;
  creator: 'Ares' | 'Athena' | 'User' | string;
  days: WorkoutDay[];
  description?: string;
  isOfficial?: boolean;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  checked: boolean;
  cookingInstructions?: string;
}

export interface WeightRecord {
  date: string;
  weight: number;
}

export interface UserProfile {
  name: string;
  email?: string;
  profilePic?: string;
  age: number;
  weight: number; 
  height: number;
  gender: Gender;
  bodyType: BodyType;
  unitSystem: UnitSystem;
  selectedDays: number[];
  gymDaysPerWeek: number;
  goal: Goal;
  goalWeight: number;
  currentBodyFat: number;
  targetBodyFat: number;
  cardioPreference: string[];
  cuisinePreference: string;
  maintenanceCalories: number;
  targetProtein: number; 
  targetCarbs: number;   
  targetFats: number;    
  targetFiber: number;   
  joinDate: string;
  planDurationMonths: number;
  restTimerDuration: number;
  workoutPreference?: string;
  detailedGoals?: string;
  experienceLevel?: ExperienceLevel;
  yearsLifting?: number;
  athleticBackground?: boolean;
  persona: AIPersona;
}

export type ViewType = 'workouts' | 'food' | 'stats' | 'edit_plan' | 'confirm_plan' | 'analytics' | 'profile';

export interface ExerciseLog {
  weight: string;
  reps: string;
  rir: string;
  completed: boolean;
  type: SetType;
  supersetWeight?: string;
  supersetReps?: string;
}

export interface WorkoutHistoryItem {
  date: string;
  focus: string;
  duration: number;
  calories: number;
  logs: Record<string, ExerciseLog[]>;
}

export interface DailyMetric {
  date: string;
  duration: number;
  volume: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  zpi: number;
  weight?: number;
  waist?: number;
  hrv?: number;
  readiness?: number;
  sleepHours?: number;
  timeInBed?: number;
  sleepEfficiency?: number;
  rhr?: number;
  sleepStages?: { light: number; deep: number; rem: number; awake: number };
  bedtime?: string;
  wakeTime?: string;
}

export interface DietHistoryRecord {
  date: string;
  meals: Meal[];
  profile: UserProfile;
}

export interface AppState {
  isAuthenticated: boolean;
  rememberMe: boolean;
  isOnboarded: boolean;
  currentView: ViewType;
  profile: UserProfile | null;
  routines: Routine[];
  activeRoutineId: string | null;
  workoutPlan: WorkoutDay[] | null; 
  splitStartDate: string | null;
  dietStartDate: string | null;
  dietHistory: DietHistoryRecord[];
  baseDiet: Meal[];
  dailyMeals: Meal[];
  mealHistory: Record<string, Meal[]>;
  activeWorkout: WorkoutDay | null;
  workoutStartTime: number | null;
  workoutHistory: WorkoutHistoryItem[];
  activityLog: Record<string, DayStatus>;
  rescheduledWorkouts: Record<string, WorkoutDay>;
  pinnedMetrics: string[];
  dailyMetricsHistory: DailyMetric[];
  weightHistory: WeightRecord[];
  waistHistory: { date: string; value: number }[];
  lastResetDate: string | null;
  connectedWearables: string[];
  persona: AIPersona | null;
  userExercises: ExerciseMetadata[];
  theme: Theme;
}
