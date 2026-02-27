
import { MuscleGroup, WarmUpExercise, WarmUpSubCategory, Exercise } from './types';
import { WARMUP_LIBRARY } from './warmupLibrary';

export const generateWarmUpSequence = (exercises: Exercise[]): WarmUpExercise[] => {
  const muscleGroups = new Set<MuscleGroup>();
  let hasCompound = false;

  exercises.forEach(ex => {
    if (ex.metadata?.primaryMuscle) {
      muscleGroups.add(ex.metadata.primaryMuscle);
    }
    // Heuristic for compound lifts
    const name = ex.name.toLowerCase();
    if (
      name.includes('squat') || 
      name.includes('deadlift') || 
      name.includes('bench press') || 
      name.includes('overhead press') || 
      name.includes('row') ||
      ex.sets >= 4
    ) {
      hasCompound = true;
    }
  });

  const sequence: WarmUpExercise[] = [];
  const muscles = Array.from(muscleGroups);

  // 1. General Warm-up (if compound day or multi-muscle)
  if (hasCompound || muscles.length > 2) {
    const general = WARMUP_LIBRARY.find(w => w.primaryMuscle === 'Full Body' && w.subCategory === WarmUpSubCategory.GENERAL);
    if (general) sequence.push(general);
  }

  // 2. Mobility Drill (Pick one for primary focus)
  const primaryMuscle = muscles[0];
  if (primaryMuscle) {
    const mobility = WARMUP_LIBRARY.find(w => w.primaryMuscle === primaryMuscle && w.subCategory === WarmUpSubCategory.MOBILITY);
    if (mobility) sequence.push(mobility);
  }

  // 3. Activation Drill
  muscles.slice(0, 2).forEach(m => {
    const activation = WARMUP_LIBRARY.find(w => w.primaryMuscle === m && w.subCategory === WarmUpSubCategory.ACTIVATION);
    if (activation && !sequence.includes(activation)) sequence.push(activation);
  });

  // 4. Pattern Primer (if compound)
  if (hasCompound && primaryMuscle) {
    const primer = WARMUP_LIBRARY.find(w => w.primaryMuscle === primaryMuscle && w.subCategory === WarmUpSubCategory.PATTERN_PREP);
    if (primer && !sequence.includes(primer)) sequence.push(primer);
  }

  // Ensure unique and limit to 5
  return Array.from(new Set(sequence)).slice(0, 5);
};
