export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ClinicalDocument {
  id: string;
  timestamp: string;
  title: string;
  transcript: string;
  patient_summary: string;
  soap_note: SOAPNote;
  key_symptoms: string[];
  medications: string[];
  clinical_findings: string[];
  follow_up_recommendations: string[];
}

export interface ConversationPreset {
  id: string;
  title: string;
  specialty: string;
  duration: string;
  transcript: string;
}
