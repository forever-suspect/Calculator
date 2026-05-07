import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getDailyHoroscope(lifePath: number) {
  const prompt = `Generate a daily horoscope for Life Path Number ${lifePath}. 
  The tone should be mystical yet practical. Keep it around 100 words. 
  Include a "Focus of the Day" sentence.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return result.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The stars are currently obscured. Please check back later.";
  }
}

export async function getCompatibilityReport(p1LifePath: number, p2LifePath: number) {
  const prompt = `Detailed compatibility report for two people with Life Path Numbers ${p1LifePath} and ${p2LifePath}.
  Structure the report with:
  1. Synergy Overview
  2. Potential Challenges
  3. Tips for Harmony
  4. Compatibility Score (out of 100%)
  
  Format the response in Markdown.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return result.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Our compatibility algorithm is being recalibrated. Try again soon.";
  }
}
