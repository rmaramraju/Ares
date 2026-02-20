
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
  persona: AIPersona;
}

export type ViewType = 'workouts' | 'food' | 'stats' | 'edit_plan' | 'confirm_plan' | 'analytics' | 'profile';

export interface ExerciseLog {
  weight: string;
  reps: string;
  rir: string;
  completed: boolean;
  type: SetType;
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
  zpi: number;
  weight?: number;
  hrv?: number;
  readiness?: number;
  sleepHours?: number;
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
  dailyMeals: Meal[];
  activeWorkout: WorkoutDay | null;
  workoutStartTime: number | null;
  workoutHistory: WorkoutHistoryItem[];
  activityLog: Record<string, DayStatus>;
  rescheduledWorkouts: Record<string, WorkoutDay>;
  pinnedMetrics: string[];
  dailyMetricsHistory: DailyMetric[];
  weightHistory: WeightRecord[];
  connectedWearables: string[];
  persona: AIPersona | null;
  userExercises: ExerciseMetadata[];
}
