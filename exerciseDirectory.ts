
import { ExerciseMetadata } from './types';

// Helper to generate thumbnail URL
const ytThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

export const EXERCISE_DIRECTORY: ExerciseMetadata[] = [
  // --- COMPOUND ---
  {
    id: 'comp_bench',
    name: 'Barbell Bench Press',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Triceps', 'Shoulders'],
    youtubeId: 'rT7DgBICCHw',
    animationUrl: ytThumb('rT7DgBICCHw'),
    category: 'Compound'
  },
  {
    id: 'comp_deadlift',
    name: 'Conventional Deadlift',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Quads', 'Hamstrings', 'Glutes'],
    youtubeId: 'ytGaGIn3SjE',
    animationUrl: ytThumb('ytGaGIn3SjE'),
    category: 'Compound'
  },
  {
    id: 'comp_squat',
    name: 'Barbell Back Squat',
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Core'],
    youtubeId: 'SW_C1A-rejs',
    animationUrl: ytThumb('SW_C1A-rejs'),
    category: 'Compound'
  },
  {
    id: 'chest1',
    name: 'Incline Dumbbell Press',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    youtubeId: '8iPEnX6B88A',
    animationUrl: ytThumb('8iPEnX6B88A'),
    category: 'Compound'
  },
  {
    id: 'back_tbar_row',
    name: 'Chest Supported T-Bar Row',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps'],
    youtubeId: 'j3mgp6_W9A4',
    animationUrl: ytThumb('j3mgp6_W9A4'),
    category: 'Compound'
  },

  // --- ISOLATION ---
  {
    id: 'iso_bicep_curl',
    name: 'Dumbbell Bicep Curls',
    primaryMuscle: 'Biceps',
    youtubeId: 'ykJmrZ5v0Oo',
    animationUrl: ytThumb('ykJmrZ5v0Oo'),
    category: 'Isolation'
  },
  {
    id: 'chest_pec_deck',
    name: 'Pec Deck Fly',
    primaryMuscle: 'Chest',
    youtubeId: 'O6_6t_A_X2c',
    animationUrl: ytThumb('O6_6t_A_X2c'),
    category: 'Isolation'
  },
  {
    id: 'legs_extensions',
    name: 'Leg Extensions',
    primaryMuscle: 'Quads',
    youtubeId: 'm0FOpMEgero',
    animationUrl: ytThumb('m0FOpMEgero'),
    category: 'Isolation'
  },
  {
    id: 'sh_lateral_raise',
    name: 'Seated DB Lateral Raises',
    primaryMuscle: 'Shoulders',
    youtubeId: 'PzsMitRIn_0',
    animationUrl: ytThumb('PzsMitRIn_0'),
    category: 'Isolation'
  },

  // --- CARDIO ---
  {
    id: 'cardio_running',
    name: 'Steady State Run',
    primaryMuscle: 'Quads',
    youtubeId: '_kGESn8IpEo',
    animationUrl: ytThumb('_kGESn8IpEo'),
    category: 'Cardio',
    isCardio: true
  },
  {
    id: 'cardio_cycling',
    name: 'Endurance Cycling',
    primaryMuscle: 'Quads',
    youtubeId: 'vS_XUa8_tYQ',
    animationUrl: ytThumb('vS_XUa8_tYQ'),
    category: 'Cardio',
    isCardio: true
  },
  {
    id: 'cardio_rowing',
    name: 'Concept2 Rowing',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Quads', 'Biceps'],
    youtubeId: 'zQ9H0Hl8N98',
    animationUrl: ytThumb('zQ9H0Hl8N98'),
    category: 'Cardio',
    isCardio: true
  },

  // --- CROSSFIT ---
  {
    id: 'cf_clean_jerk',
    name: 'Clean and Jerk',
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Shoulders', 'Back', 'Glutes'],
    youtubeId: '8miqQQJEsO0',
    animationUrl: ytThumb('8miqQQJEsO0'),
    category: 'CrossFit'
  },
  {
    id: 'cf_snatch',
    name: 'Olympic Snatch',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Shoulders', 'Quads'],
    youtubeId: '9xQp28aNliE',
    animationUrl: ytThumb('9xQp28aNliE'),
    category: 'CrossFit'
  },
  {
    id: 'cf_thruster',
    name: 'Thrusters',
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Shoulders'],
    youtubeId: 'L219ltL15zk',
    animationUrl: ytThumb('L219ltL15zk'),
    category: 'CrossFit'
  },
  {
    id: 'cf_muscle_up',
    name: 'Ring Muscle Ups',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Triceps', 'Chest'],
    youtubeId: '6T3A7E6fIio',
    animationUrl: ytThumb('6T3A7E6fIio'),
    category: 'CrossFit'
  },

  // --- HIIT ---
  {
    id: 'hiit_burpees',
    name: 'Target Burpees',
    primaryMuscle: 'Core',
    secondaryMuscles: ['Chest', 'Quads'],
    youtubeId: 'dZfeV_O5oCc',
    animationUrl: ytThumb('dZfeV_O5oCc'),
    category: 'HIIT'
  },
  {
    id: 'hiit_mountain_climbers',
    name: 'Mountain Climbers',
    primaryMuscle: 'Core',
    youtubeId: 'nmwgirgXLYM',
    animationUrl: ytThumb('nmwgirgXLYM'),
    category: 'HIIT'
  },
  {
    id: 'hiit_box_jumps',
    name: 'Plyometric Box Jumps',
    primaryMuscle: 'Quads',
    youtubeId: '52r_Ul5k03g',
    animationUrl: ytThumb('52r_Ul5k03g'),
    category: 'HIIT'
  },
  {
    id: 'hiit_battle_ropes',
    name: 'Battle Rope Slams',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Core'],
    youtubeId: 'U8X28qM8Cks',
    animationUrl: ytThumb('U8X28qM8Cks'),
    category: 'HIIT'
  }
];

export const LIGHT_EXERCISES: ExerciseMetadata[] = [
  {
    id: 'light1',
    name: 'World\'s Greatest Stretch',
    primaryMuscle: 'Core',
    youtubeId: 'l9p6YJ_I2q0',
    animationUrl: ytThumb('l9p6YJ_I2q0'),
    category: 'Recovery'
  },
  {
    id: 'light2',
    name: 'Cat-Cow Mobility',
    primaryMuscle: 'Core',
    youtubeId: 'W3Fv8fT_mYI',
    animationUrl: ytThumb('W3Fv8fT_mYI'),
    category: 'Recovery'
  }
];

export const SET_TYPE_DESCRIPTIONS: Record<string, string> = {
  Normal: "Standard set with prescribed reps and load.",
  Dropset: "Perform a set to failure, then immediately reduce weight and continue.",
  Superset: "Two exercises performed back-to-back with no rest.",
  Failure: "Push the set until technical failure occurs (0 RIR)."
};
