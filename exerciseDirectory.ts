
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
  },
  {
    id: 'chest_db_fly',
    name: 'Dumbbell Chest Fly',
    primaryMuscle: 'Chest',
    youtubeId: 'eGjt4adGeH4',
    animationUrl: ytThumb('eGjt4adGeH4'),
    category: 'Isolation'
  },
  {
    id: 'back_lat_pulldown',
    name: 'Lat Pulldown',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps'],
    youtubeId: 'CAwf7n6Luuc',
    animationUrl: ytThumb('CAwf7n6Luuc'),
    category: 'Compound'
  },
  {
    id: 'back_seated_row',
    name: 'Seated Cable Row',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps'],
    youtubeId: 'GZbfZ033f74',
    animationUrl: ytThumb('GZbfZ033f74'),
    category: 'Compound'
  },
  {
    id: 'sh_ohp',
    name: 'Overhead Barbell Press',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps'],
    youtubeId: '2yjwXTZQDDI',
    animationUrl: ytThumb('2yjwXTZQDDI'),
    category: 'Compound'
  },
  {
    id: 'sh_arnold_press',
    name: 'Arnold Press',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps'],
    youtubeId: '6Z15_WdXmVw',
    animationUrl: ytThumb('6Z15_WdXmVw'),
    category: 'Compound'
  },
  {
    id: 'legs_leg_press',
    name: 'Leg Press',
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    youtubeId: 'IZxyjW7MPJQ',
    animationUrl: ytThumb('IZxyjW7MPJQ'),
    category: 'Compound'
  },
  {
    id: 'legs_romanian_deadlift',
    name: 'Romanian Deadlift',
    primaryMuscle: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Back'],
    youtubeId: 'JCX81dxzJ8Q',
    animationUrl: ytThumb('JCX81dxzJ8Q'),
    category: 'Compound'
  },
  {
    id: 'arm_tricep_pushdown',
    name: 'Tricep Rope Pushdown',
    primaryMuscle: 'Triceps',
    youtubeId: '2-LAMcpzHLU',
    animationUrl: ytThumb('2-LAMcpzHLU'),
    category: 'Isolation'
  },
  {
    id: 'arm_hammer_curl',
    name: 'Hammer Curls',
    primaryMuscle: 'Biceps',
    youtubeId: 'zC3nLlEvin4',
    animationUrl: ytThumb('zC3nLlEvin4'),
    category: 'Isolation'
  },
  {
    id: 'core_plank',
    name: 'Forearm Plank',
    primaryMuscle: 'Core',
    youtubeId: 'pSHjTRCQxIw',
    animationUrl: ytThumb('pSHjTRCQxIw'),
    category: 'Isolation'
  },
  {
    id: 'core_leg_raise',
    name: 'Hanging Leg Raises',
    primaryMuscle: 'Core',
    youtubeId: 'hd0m_0_A9-k',
    animationUrl: ytThumb('hd0m_0_A9-k'),
    category: 'Isolation'
  },
  {
    id: 'chest_cable_fly',
    name: 'Cable Chest Fly',
    primaryMuscle: 'Chest',
    youtubeId: 'Iwe6AmxVf7o',
    animationUrl: ytThumb('Iwe6AmxVf7o'),
    category: 'Isolation'
  },
  {
    id: 'back_pullup',
    name: 'Wide Grip Pull-Ups',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps'],
    youtubeId: 'eGo4IYlbE5g',
    animationUrl: ytThumb('eGo4IYlbE5g'),
    category: 'Compound'
  },
  {
    id: 'sh_face_pull',
    name: 'Face Pulls',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Back'],
    youtubeId: 'rep-qVOkqgk',
    animationUrl: ytThumb('rep-qVOkqgk'),
    category: 'Isolation'
  },
  {
    id: 'legs_calf_raise',
    name: 'Standing Calf Raises',
    primaryMuscle: 'Calves',
    youtubeId: 'YMmgqO8Jo-k',
    animationUrl: ytThumb('YMmgqO8Jo-k'),
    category: 'Isolation'
  },
  {
    id: 'arm_skull_crusher',
    name: 'EZ-Bar Skull Crushers',
    primaryMuscle: 'Triceps',
    youtubeId: 'd_KZxPnN_ss',
    animationUrl: ytThumb('d_KZxPnN_ss'),
    category: 'Isolation'
  },
  {
    id: 'arm_preacher_curl',
    name: 'Preacher Curls',
    primaryMuscle: 'Biceps',
    youtubeId: 'fIWP-FRFNU0',
    animationUrl: ytThumb('fIWP-FRFNU0'),
    category: 'Isolation'
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
