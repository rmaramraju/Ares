import { Type } from "@google/genai";
import { UserProfile } from "./types";
import { AIService } from "./src/services/aiService";

export const generateFitnessPlan = async (profile: UserProfile) => {
  const prompt = `Act as an elite sports scientist and nutritionist. Architect a scientifically-optimized fitness and nutrition protocol for a ${profile.age}y/o ${profile.gender} ${profile.bodyType}.
    PRIMARY GOAL: ${profile.goal}.
    EXPERIENCE LEVEL: ${profile.experienceLevel || "Intermediate"}.
    TRAINING AGE: ${profile.yearsLifting || 0} years.
    ATHLETIC BACKGROUND: ${profile.athleticBackground ? "Yes" : "No"}.
    DETAILED GOALS: ${profile.detailedGoals || "Not specified"}.
    WORKOUT PREFERENCE: ${profile.workoutPreference || "Not specified"}.
    COMMITMENT: ${profile.gymDaysPerWeek} dedicated gym days per week.
    BIOMETRICS: ${profile.weight}kg, ${profile.height}cm.
    PREFERENCES: Cardio: ${profile.cardioPreference.join(", ")}, Cuisine: ${profile.cuisinePreference}.
    MAINTENANCE: ${profile.maintenanceCalories} kcal.

    REQUIREMENTS:
    1. Create a ${profile.gymDaysPerWeek}-day workout split.
    2. Exercises must include specific rep ranges and rest cues.
    3. Include a nutrition protocol (3-5 meals) aligned with goal.
    4. MUST include fiber (grams) for each meal.
    5. Estimate a realistic 'goalWeight' and 'targetBodyFat' percentage for this profile.
    6. Provide the plan in the strictly requested JSON format.`;

  try {
    const responseText = await AIService.generateContent({
      prompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          workoutPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayName: { type: Type.STRING },
                focus: { type: Type.STRING },
                exercises: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      sets: { type: Type.NUMBER },
                      reps: { type: Type.STRING },
                      instructions: { type: Type.STRING },
                      category: { type: Type.STRING }
                    },
                    required: ["name", "sets", "reps", "instructions"]
                  }
                }
              },
              required: ["dayName", "focus", "exercises"]
            }
          },
          dietPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fats: { type: Type.NUMBER },
                fiber: { type: Type.NUMBER }
              },
              required: ["name", "calories", "protein", "carbs", "fats", "fiber"]
            }
          },
          goalWeight: { type: Type.NUMBER },
          targetBodyFat: { type: Type.NUMBER },
          cardioRecommendation: { type: Type.STRING }
        },
        required: ["workoutPlan", "dietPlan", "goalWeight", "targetBodyFat", "cardioRecommendation"]
      }
    });

    const jsonStr = responseText?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("ARES_API_ERR: Protocol Synthesis Failed", error);
    throw new Error("SYSTEM_ERR: FAILED_TO_SYNTHESIZE_PROTOCOL");
  }
};
