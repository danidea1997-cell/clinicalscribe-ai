import dotenv from "dotenv";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;

// Lazy initialization getter for Gemini API to ensure the server starts even if key is missing initially
function getGeminiClient() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please add it to your secrets in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// REST API endpoint: Generate structured clinical SOAP notes from transcript
app.post("/api/generate-note", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      return res.status(400).json({ error: "Transcript is required and cannot be empty." });
    }

    const ai = getGeminiClient();

    // Define systemic clinical document processing instructions
    const systemInstruction = `
You are an expert, highly precise Medical Documentation Scribe.
Your sole responsibility is to analyze the provided doctor-patient consultation transcript and generate structured clinical documentation.

STRICT INSTRUCTIONS:
1. Do not invent, assume, or extrapolate any medical information.
2. Only include details explicitly mentioned in the text.
3. If crucial clinical sections cannot be filled due to lack of information, write or list "Not discussed" or leave empty as appropriate. Never fabricate symptoms, readings, diagnoses, or prescriptions.
4. Organize your response according to the requested JSON schema.
5. The output must be perfectly objective, clinically focused, and professional.
`;

    // Retrieve generated summary and SOAP components using schema validation with a fallback model if one is offline or busy
    let response;
    const modelToTry = ["gemini-3.5-flash", "gemini-2.5-flash"];
    let lastError = null;

    for (const modelName of modelToTry) {
      try {
        console.log(`Attempting clinical analysis with model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: `Perform clinical extraction and generate structured notes for this transcript:\n\n${transcript}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                patient_summary: {
                  type: Type.STRING,
                  description: "A professional 2-3 sentence overview containing the patient's demographics, primary concern (chief complaint), and context of the visit.",
                },
                soap_note: {
                  type: Type.OBJECT,
                  properties: {
                    subjective: {
                      type: Type.STRING,
                      description: "Subjective findings: History of present illness, patient reported symptoms, pain description, timeline, and relevant family/social history mentioned.",
                    },
                    objective: {
                      type: Type.STRING,
                      description: "Objective findings: Physical exam signs, vital signs mentioned, observable behaviors, or tests reviewed during the conversation.",
                    },
                    assessment: {
                      type: Type.STRING,
                      description: "Assessment: Clinical impression, potential differential diagnoses discussed, and clinician synthesis of the clinical state.",
                    },
                    plan: {
                      type: Type.STRING,
                      description: "Plan: Diagnostic studies ordered, medications prescribed or adjusted, patient education, referrals, and clear timeline for next steps.",
                    },
                  },
                  required: ["subjective", "objective", "assessment", "plan"],
                },
                key_symptoms: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Array of specific symptoms reported by the patient (e.g., 'dry cough', 'sharp knee joint pain').",
                },
                medications: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Array of medications mentioned, including current prescriptions, dosage changes discussed, or newly planned regimens.",
                },
                clinical_findings: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of observable clinical signs, blood pressure readings, temperature, heart rates, or specific test results reviewed in the consult.",
                },
                follow_up_recommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of timeline expectations, upcoming appointments, red-flag symptoms to watch, or emergency guidelines discussed.",
                },
              },
              required: [
                "patient_summary",
                "soap_note",
                "key_symptoms",
                "medications",
                "clinical_findings",
                "follow_up_recommendations",
              ],
            },
          },
        });
        
        // If successful, break out of loop
        if (response) {
          console.log(`Successfully completed notes generation using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or limits reached:`, err.message || err);
        lastError = err;
        // Continue to fallback model
      }
    }

    if (!response) {
      throw lastError || new Error("All active LLM models returned capacity or transient availability constraints. Please try again in a few seconds.");
    }

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No response output text was returned by Gemini.");
    }

    const clinicalData = JSON.parse(outputText.trim());
    return res.json(clinicalData);
  } catch (error: any) {
    console.error("ClinicalScribe API Error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred during medical note generation.",
      details: error.toString(),
    });
  }
});

// Configure Vite middleware or serve static static fields
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production from the dist folder
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ClinicalScribe AI server running on http://localhost:${PORT}`);
  });
}

startServer();
