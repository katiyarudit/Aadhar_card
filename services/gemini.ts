
import { GoogleGenAI, Type } from "@google/genai";
import { InsightData } from "../types";

export const generateRiskInsight = async (
  state: string,
  total: number,
  percentile: number,
  date: string
): Promise<InsightData> => {
  // Always use a new instance with direct access to process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this suspicious Aadhaar enrolment activity:
        State: ${state} (Border State)
        Date: ${date}
        Total Enrolments: ${total}
        95th Percentile Threshold: ${percentile}
        
        The daily enrolment is significantly higher than the 95th percentile for this state. Provide a risk assessment.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: { 
              type: Type.STRING,
              description: 'Description of the detected anomaly'
            },
            impact: { 
              type: Type.STRING,
              description: 'Potential consequences of the spike'
            },
            solution: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'List of recommended actions'
            }
          },
          required: ["problem", "impact", "solution"],
          propertyOrdering: ["problem", "impact", "solution"]
        }
      }
    });

    // response.text is a property, not a method
    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text) as InsightData;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    // Fallback logic
    return {
      problem: `Unusually high Aadhaar enrolment in border state ${state} on ${date}.`,
      impact: "Potential migration pressure or fraudulent verification activity near international borders.",
      solution: [
        "Enforce strict physical document verification for all applicants.",
        "Deploy multi-biometric cross-referencing audit.",
        "Conduct snap audits of enrolment centers in high-volume districts.",
        "Implement border-specific verification protocols for new adult enrolments."
      ]
    };
  }
};
