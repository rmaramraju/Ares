import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { UserProfile } from "./types";

export const generateFitnessPlan = async (profile: UserProfile) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `Act as an elite sports scientist and nutritionist. Architect a scientifically-optimized fitness and nutrition protocol for a ${profile.age}y/o ${profile.gender} ${profile.bodyType}.
    PRIMARY GOAL: ${profile.goal}.
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
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("ARES_API_ERR: Protocol Synthesis Failed", error);
    throw new Error("SYSTEM_ERR: FAILED_TO_SYNTHESIZE_PROTOCOL");
  }
};

export const analyzePhysique = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `Act as an elite sports scientist and body composition expert. 
    Analyze this athlete's physique from the provided image.
    Provide a detailed assessment including:
    1. Muscle definition and vascularity assessment.
    2. Estimated body fat percentage range.
    3. Structural symmetry observations.
    4. Recommended focus areas for the next training block.
    
    Format the response in professional, technical Markdown with clear headings. 
    Be encouraging but scientifically objective. Use terms like 'hypertrophy', 'posterior chain', 'definition', 'composition'.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        },
        { text: prompt }
      ]
    });

    return response.text || "ARES_SYSTEM: Analysis data corrupted or unavailable.";
  } catch (error) {
    console.error("ARES_API_ERR: Physique Analysis Failed", error);
    return "SYSTEM_ERR: BIOMETRIC_SCAN_FAILED. Check neural link and retry.";
  }
};
