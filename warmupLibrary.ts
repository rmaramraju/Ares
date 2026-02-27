
import { WarmUpExercise, WarmUpSubCategory } from './types';

export const WARMUP_LIBRARY: WarmUpExercise[] = [
  // CHEST
  {
    id: 'chest-mobility-1',
    name: 'Dynamic Pec Stretch',
    primaryMuscle: 'Chest',
    subCategory: WarmUpSubCategory.MOBILITY,
    instructions: 'Stand in a doorway or use a rack. Gently lean forward with arms at 90 degrees to stretch the pecs dynamically.',
    reps: '10-12 per side'
  },
  {
    id: 'chest-activation-1',
    name: 'Scapular Push-ups',
    primaryMuscle: 'Chest',
    subCategory: WarmUpSubCategory.ACTIVATION,
    instructions: 'In a plank position, move your shoulder blades together and apart without bending your elbows.',
    reps: '15 reps'
  },
  {
    id: 'chest-pattern-1',
    name: 'Empty Barbell Bench Press',
    primaryMuscle: 'Chest',
    subCategory: WarmUpSubCategory.PATTERN_PREP,
    instructions: 'Perform the bench press movement with an empty bar, focusing on bar path and shoulder stability.',
    reps: '15 reps'
  },

  // SHOULDERS
  {
    id: 'shoulders-joint-1',
    name: 'Shoulder Dislocations (PVC Pipe)',
    primaryMuscle: 'Shoulders',
    subCategory: WarmUpSubCategory.JOINT_PREP,
    instructions: 'Hold a PVC pipe with a wide grip and rotate it from your hips to your lower back and back.',
    reps: '12 reps'
  },
  {
    id: 'shoulders-lateral-1',
    name: 'Band Pull-Aparts',
    primaryMuscle: 'Shoulders',
    subCategory: WarmUpSubCategory.ACTIVATION,
    instructions: 'Hold a resistance band in front of you and pull it apart, squeezing your shoulder blades.',
    reps: '20 reps'
  },
  {
    id: 'shoulders-rear-1',
    name: 'Face Pulls (Light Band)',
    primaryMuscle: 'Shoulders',
    subCategory: WarmUpSubCategory.ACTIVATION,
    instructions: 'Pull the band towards your forehead, pulling the ends apart and rotating your thumbs back.',
    reps: '15 reps'
  },

  // BACK
  {
    id: 'back-mobility-1',
    name: 'Cat-Cow Stretch',
    primaryMuscle: 'Back',
    subCategory: WarmUpSubCategory.MOBILITY,
    instructions: 'On all fours, alternate between arching your back and rounding it to mobilize the spine.',
    reps: '10 reps'
  },
  {
    id: 'back-activation-1',
    name: 'Dead Bugs',
    primaryMuscle: 'Back',
    subCategory: WarmUpSubCategory.ACTIVATION,
    instructions: 'Lying on your back, lower opposite arm and leg while keeping your lower back pressed to the floor.',
    reps: '10 per side'
  },
  {
    id: 'back-pattern-1',
    name: 'Inverted Rows (High)',
    primaryMuscle: 'Back',
    subCategory: WarmUpSubCategory.PATTERN_PREP,
    instructions: 'Perform rows using a bar set high, focusing on scapular retraction.',
    reps: '12 reps'
  },

  // QUADS
  {
    id: 'quads-mobility-1',
    name: 'World\'s Greatest Stretch',
    primaryMuscle: 'Quads',
    subCategory: WarmUpSubCategory.MOBILITY,
    instructions: 'Lunge forward, place inside elbow to floor, then rotate arm towards the sky.',
    reps: '5 per side'
  },
  {
    id: 'quads-activation-1',
    name: 'Bodyweight Squats',
    primaryMuscle: 'Quads',
    subCategory: WarmUpSubCategory.ACTIVATION,
    instructions: 'Perform controlled squats focusing on knee tracking and depth.',
    reps: '15 reps'
  },

  // HAMSTRINGS
  {
    id: 'hams-mobility-1',
    name: 'Leg Swings (Front to Back)',
    primaryMuscle: 'Hamstrings',
    subCategory: WarmUpSubCategory.MOBILITY,
    instructions: 'Swing one leg forward and backward in a controlled manner.',
    reps: '15 per side'
  },
  {
    id: 'hams-activation-1',
    name: 'Glute Bridges',
    primaryMuscle: 'Hamstrings',
    subCategory: WarmUpSubCategory.ACTIVATION,
    instructions: 'Lying on your back, lift your hips towards the ceiling, squeezing glutes and hams.',
    reps: '20 reps'
  },

  // CORE
  {
    id: 'core-activation-1',
    name: 'Plank with Shoulder Taps',
    primaryMuscle: 'Core',
    subCategory: WarmUpSubCategory.ACTIVATION,
    instructions: 'In a plank position, tap opposite shoulder while minimizing hip rotation.',
    reps: '10 per side'
  },
  {
    id: 'core-stability-1',
    name: 'Bird-Dog',
    primaryMuscle: 'Core',
    subCategory: WarmUpSubCategory.PATTERN_PREP,
    instructions: 'On all fours, extend opposite arm and leg simultaneously.',
    reps: '10 per side'
  },

  // FULL BODY
  {
    id: 'fullbody-general-1',
    name: 'Jumping Jacks',
    primaryMuscle: 'Full Body',
    subCategory: WarmUpSubCategory.GENERAL,
    instructions: 'Standard jumping jacks to increase heart rate.',
    durationSeconds: 60
  },
  {
    id: 'fullbody-general-2',
    name: 'Burpees (Slow)',
    primaryMuscle: 'Full Body',
    subCategory: WarmUpSubCategory.GENERAL,
    instructions: 'Controlled burpees to engage the entire body.',
    reps: '10 reps'
  },

  // EXPLOSIVE
  {
    id: 'explosive-neural-1',
    name: 'Box Jumps (Low)',
    primaryMuscle: 'Explosive',
    subCategory: WarmUpSubCategory.NEURAL_PREP,
    instructions: 'Jump onto a low box, focusing on landing softly and explosive takeoff.',
    reps: '5 reps'
  },
  {
    id: 'explosive-mobility-1',
    name: 'Deep Squat with Internal Rotation',
    primaryMuscle: 'Explosive',
    subCategory: WarmUpSubCategory.MOBILITY,
    instructions: 'Sit in a deep squat and rotate one knee inward towards the floor.',
    reps: '8 per side'
  }
];
