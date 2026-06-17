import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  FileText,
  Copy,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Stethoscope,
  HeartPulse,
  Activity,
  Clock,
  ArrowRight,
  ChevronLeft,
  Check,
  RefreshCw,
  Search,
  BookOpen,
  CheckCircle,
  TrendingUp,
  X,
  AlertCircle
} from "lucide-react";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { CONVERSATION_PRESETS } from "./presets";
import { ClinicalDocument, SOAPNote } from "./types";

export default function App() {
  // Screens navigation state: "recorder" or "review"
  const [activeScreen, setActiveScreen] = useState<"recorder" | "review">("recorder");

  // Core application state
  const [transcript, setTranscript] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Speech and simulation refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simulatedPresetWordsRef = useRef<string[]>([]);
  const simulatedWordIndexRef = useRef<number>(0);

  // Active document and History logs (loaded from local state/storage)
  const [activeDocument, setActiveDocument] = useState<ClinicalDocument | null>(null);
  const [documentHistory, setDocumentHistory] = useState<ClinicalDocument[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // SOAP tab state on the review screen ("subjective" | "objective" | "assessment" | "plan")
  const [activeSoapTab, setActiveSoapTab] = useState<keyof SOAPNote>("subjective");

  // Load document history on boot
  useEffect(() => {
    try {
      const stored = localStorage.getItem("clinicalscribe_history");
      if (stored) {
        setDocumentHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to restore history", e);
    }

    // Attempt to configure Web Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          let chunk = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript;
              chunk += (chunk ? " " : "") + text;
            }
          }
          if (chunk) {
            setTranscript((prev) => {
              const cleaned = prev.endsWith(" ") || prev === "" ? prev : prev + " ";
              return cleaned + chunk;
            });
          }
        };

        rec.onerror = (err: any) => {
          if (err.error === "no-speech") {
            // Ignore minor silence events
            return;
          }
          console.error("Speech Recognition Error", err.error);
          if (err.error === "not-allowed") {
            showFeedback("Microphone permissions denied. Fell back to manual text or simulator.", "info");
          }
        };

        recognitionRef.current = rec;
      } catch (e) {
        console.error("Failed to construct SpeechRecognition instance", e);
      }
    }
  }, []);

  // Save history helper
  const saveHistory = (updated: ClinicalDocument[]) => {
    setDocumentHistory(updated);
    try {
      localStorage.setItem("clinicalscribe_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist history", e);
    }
  };

  // Toast feedback message helper
  const showFeedback = (text: string, type: "success" | "info" | "error" = "info") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
  };

  // Convert seconds to digital clock format 'MM:SS'
  const formatTime = (secs: number) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // Start continuous audio recording / simulation
  const handleStartRecording = () => {
    if (isRecording) return;

    // Reset previous recorder state if desired, or let them append
    setIsRecording(true);
    setRecordingSeconds(0);

    // 1. Digital Clock Timer
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // 2. Active Speech Recognition trigger (if permitted)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        showFeedback("Microphone active. Whisper or talk to record consultation.", "success");
      } catch (e) {
        console.warn("Could not start microphoned dictation capture:", e);
      }
    }

    // 3. Automated Dictation simulator (if a preset was chosen)
    if (selectedPresetId) {
      const preset = CONVERSATION_PRESETS.find((p) => p.id === selectedPresetId);
      if (preset) {
        setTranscript(""); // Clear to play simulation
        simulatedPresetWordsRef.current = preset.transcript.split(/\s+/);
        simulatedWordIndexRef.current = 0;

        simulationIntervalRef.current = setInterval(() => {
          const words = simulatedPresetWordsRef.current;
          const index = simulatedWordIndexRef.current;

          if (index < words.length) {
            // Read 2-3 words at a time to simulate human speed
            const takeCount = Math.floor(Math.random() * 2) + 2;
            const slice = words.slice(index, index + takeCount).join(" ");
            setTranscript((prev) => (prev ? prev + " " + slice : slice));
            simulatedWordIndexRef.current += takeCount;
          } else {
            // Simulation finished
            if (simulationIntervalRef.current) {
              clearInterval(simulationIntervalRef.current);
            }
          }
        }, 500); // Ticks words typing
      }
    }
  };

  // Stop recording / simulation
  const handleStopRecording = () => {
    if (!isRecording) return;

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Could not stop live microphone listener cleanly:", e);
      }
    }

    showFeedback("Dictation complete. You can now edit/review the raw transcript.");
  };

  // Reset current workspace screen
  const handleResetWorkspace = () => {
    handleStopRecording();
    setTranscript("");
    setRecordingSeconds(0);
    setSelectedPresetId("");
    showFeedback("Workspace reset. Ready for new encounter log.");
  };

  // Live Load Preset Scenario
  const handleLoadPreset = (presetId: string) => {
    handleStopRecording();
    const preset = CONVERSATION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setTranscript(preset.transcript);
      setRecordingSeconds(0);
      showFeedback(`Loaded conversation script for "${preset.title}".`);
    } else {
      setSelectedPresetId("");
      setTranscript("");
    }
  };

  // Core Request API: Post the conversation to Gemini AI
  const handleGenerateClinicalNote = async () => {
    if (!transcript || transcript.trim().length < 15) {
      showFeedback("A transcript with at least 15 characters is required to analyze clinical relevance.", "error");
      return;
    }

    handleStopRecording();
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const errPayload = await response.json();
        throw new Error(errPayload.error || "Failed representing Gemini response stream.");
      }

      const parsedJSON = await response.json();

      // Format current timestamp
      const runTime = new Date();
      const timestampString = runTime.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // Match preset name or general encounter
      let activePresetName = "General Consult";
      if (selectedPresetId) {
        const found = CONVERSATION_PRESETS.find((p) => p.id === selectedPresetId);
        if (found) activePresetName = found.title;
      } else {
        // Auto extract start of transcript as title
        activePresetName = "Consultation " + runTime.toLocaleDateString();
      }

      // Construct final clinical doc
      const newDocument: ClinicalDocument = {
        id: "doc_" + Date.now(),
        timestamp: timestampString,
        title: activePresetName,
        transcript,
        patient_summary: parsedJSON.patient_summary,
        soap_note: parsedJSON.soap_note,
        key_symptoms: parsedJSON.key_symptoms || [],
        medications: parsedJSON.medications || [],
        clinical_findings: parsedJSON.clinical_findings || [],
        follow_up_recommendations: parsedJSON.follow_up_recommendations || [],
      };

      // Store in state & storage history
      setActiveDocument(newDocument);
      saveHistory([newDocument, ...documentHistory]);

      // Route to reviewing screen
      setActiveScreen("review");
      showFeedback("Clinical note generated successfully!", "success");
    } catch (error: any) {
      console.error(error);
      showFeedback(`AIS Error: ${error.message || "Failed to communicate with LLM"}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Select historical clinical note
  const handleSelectHistoryDoc = (doc: ClinicalDocument) => {
    setActiveDocument(doc);
    setTranscript(doc.transcript);
    setActiveScreen("review");
    setShowHistorySidebar(false);
    showFeedback(`Opened document review for "${doc.title}"`);
  };

  // Delete historical clinical note
  const handleDeleteHistoryDoc = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filtered = documentHistory.filter((doc) => doc.id !== id);
    saveHistory(filtered);
    if (activeDocument?.id === id) {
      setActiveDocument(null);
      setActiveScreen("recorder");
    }
    showFeedback("Clinical note deleted from history.");
  };

  // Copy active SOAP category or summary to clipboard
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showFeedback(`${label} copied to clipboard!`, "success");
  };

  // Export full clinical documentation as Markdown file
  const handleExportMarkdown = () => {
    if (!activeDocument) return;

    const docStr = `# ${activeDocument.title}
Clinical Documentation Summary - Scribed: ${activeDocument.timestamp}

## 1. Executive Patient Summary
${activeDocument.patient_summary}

## 2. SOAP Note
### Subjective
${activeDocument.soap_note.subjective}

### Objective
${activeDocument.soap_note.objective}

### Assessment
${activeDocument.soap_note.assessment}

### Plan
${activeDocument.soap_note.plan}

## 3. Key Symptoms Recognized
${activeDocument.key_symptoms.length > 0 ? activeDocument.key_symptoms.map(s => `- ${s}`).join("\n") : "None noted."}

## 4. Medications Mentioned
${activeDocument.medications.length > 0 ? activeDocument.medications.map(m => `- ${m}`).join("\n") : "None noted."}

## 5. Objective Clinical Findings
${activeDocument.clinical_findings.length > 0 ? activeDocument.clinical_findings.map(f => `- ${f}`).join("\n") : "None discussed."}

## 6. Follow-up & Safety Recommendations
${activeDocument.follow_up_recommendations.length > 0 ? activeDocument.follow_up_recommendations.map(r => `- ${r}`).join("\n") : "None noted."}

---
Disclaimers:
- ClinicalScribe AI provides documentation logs. Decisive diagnostic & prescription accountability rests fully with the attending physician.
`;

    const blob = new Blob([docStr], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `clinical_${activeDocument.title.replace(/\s+/g, "_").toLowerCase()}_note.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback("Markdown file downloaded successfully.", "success");
  };

  // Trigger browser print UI
  const handlePrint = () => {
    window.print();
  };

  // Filter history list
  const filteredHistory = documentHistory.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.patient_summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="scribe-root" className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col antialiased">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border bg-white border-stone-200 text-stone-800 text-sm max-w-sm animate-bounce">
          {feedbackMessage.type === "success" && (
            <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />
          )}
          {feedbackMessage.type === "error" && (
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          )}
          {feedbackMessage.type === "info" && (
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          )}
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="ml-auto text-stone-400 hover:text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-300 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Primary Clinic Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-stone-900 leading-none">
              ClinicalScribe AI
            </h1>
            <p className="text-[11px] font-mono tracking-wider text-stone-500 uppercase mt-1">
              PRO CLINICAL DOCUMENTATION ENGINE
            </p>
          </div>
        </div>

        {/* Header navigation & status metrics */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistorySidebar(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-lg text-xs font-semibold"
          >
            <Clock size={14} />
            <span>Consult Notes History ({documentHistory.length})</span>
          </button>

          {activeDocument && (
            <button
              onClick={() => {
                setActiveScreen(activeScreen === "recorder" ? "review" : "recorder");
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-white bg-teal-600 hover:bg-teal-700 rounded-lg text-xs font-semibold"
            >
              <FileText size={14} />
              <span>
                {activeScreen === "recorder" ? "View Active SOAP" : "View Scribe Recorder"}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Saved Documents Panel sidebar drawer */}
      {showHistorySidebar && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-[380px] bg-white h-full border-l border-stone-300 shadow-2xl flex flex-col animate-slide-in">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-stone-900">Encounter History</h3>
                <p className="text-[11px] text-stone-500">Search and review patient consult SOAP documents</p>
              </div>
              <button
                onClick={() => setShowHistorySidebar(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Historical Search widget */}
            <div className="p-4 border-b border-stone-100 bg-stone-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter by diagnosis, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* List entries */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No records correspond to the request.</p>
                </div>
              ) : (
                filteredHistory.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectHistoryDoc(doc)}
                    className={`p-3.5 rounded-xl border transition-all text-left cursor-pointer hover:border-teal-400/50 hover:bg-stone-50 ${
                      activeDocument?.id === doc.id
                        ? "border-teal-500 bg-teal-50/20"
                        : "border-stone-200 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="font-display font-semibold text-xs text-stone-950 truncate max-w-[200px]">
                        {doc.title}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteHistoryDoc(e, doc.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition rounded-md hover:bg-rose-50"
                        title="Delete record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono inline-block mb-2">
                      {doc.timestamp}
                    </span>
                    <p className="text-[11px] text-stone-600 line-clamp-2">
                      {doc.patient_summary}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {doc.medications.slice(0, 2).map((m, idx) => (
                        <span key={idx} className="text-[9px] bg-stone-100/80 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                          {m}
                        </span>
                      ))}
                      {doc.key_symptoms.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="text-[9px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Areas Layout splitting */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col">
        {activeScreen === "recorder" ? (
          /* SCREEN 1: Medical Scribe Recorder */
          <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-stone-100 gap-4">
                <div>
                  <h2 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2">
                    <Activity className="text-teal-600 h-5 w-5" />
                    Encounter Consultation Dictation
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Hold consultation or load patient scripts. The scribe documents the verbal flow seamlessly.
                  </p>
                </div>

                {/* Digital Timing System representation */}
                <div className="flex items-center gap-3 bg-stone-100/90 rounded-2xl px-4 py-2 self-start md:self-auto">
                  <Clock className={`h-4 w-4 ${isRecording ? "text-rose-500 animate-pulse" : "text-stone-500"}`} />
                  <span className="font-mono text-sm font-bold text-stone-700">
                    {formatTime(recordingSeconds)}
                  </span>
                </div>
              </div>

              {/* Dictation Prescription helper tool & Presets load bar */}
              <div className="mt-5 bg-stone-50/60 p-4 rounded-xl border border-stone-200/50">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xs font-semibold text-stone-700 font-display">
                    Eencounter Scenarios & Presets (Quick Setup)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CONVERSATION_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleLoadPreset(p.id)}
                      className={`text-left p-3 rounded-lg border text-xs transition-all ${
                        selectedPresetId === p.id
                          ? "border-teal-500 bg-white ring-1 ring-teal-500/30 font-medium"
                          : "border-stone-200 hover:border-stone-300 bg-white"
                      }`}
                    >
                      <div className="font-bold text-stone-800 text-[11px] truncate">{p.title}</div>
                      <div className="text-[10px] text-stone-500 mt-1 flex items-center justify-between">
                        <span>{p.specialty}</span>
                        <span className="font-mono">{p.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-stone-500 leading-relaxed italic">
                  * Select a preset to instantly import a consultation transcript, or keep it set to blank to capture your microphone input.
                </div>
              </div>

              {/* MIC ACTIVE ANIMATOR */}
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                <AudioVisualizer isRecording={isRecording} />

                <div className="flex gap-2.5 w-full sm:w-auto">
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-3 px-5 rounded-xl transition duration-150 shadow-sm"
                    >
                      <Mic size={15} />
                      <span>Start Recording</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs py-3 px-5 rounded-xl transition duration-150 shadow-sm"
                    >
                      <Square size={14} />
                      <span>Stop Recording</span>
                    </button>
                  )}

                  <button
                    onClick={handleResetWorkspace}
                    disabled={isGenerating}
                    className="p-3 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition border border-stone-200"
                    title="Clear workspace"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Transcript Textbox screen area */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Live Transcript Input
                  </label>
                  {transcript.length > 0 && (
                    <button
                      onClick={() => setTranscript("")}
                      className="text-[10px] font-bold text-rose-500 hover:underline"
                    >
                      Clear Content
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    disabled={isRecording}
                    placeholder="Select a scenario above to test with loaded medical logs, or start speaking to dictate your consult live. You can also type/edit the raw text right here..."
                    className="w-full min-h-[300px] bg-stone-50 hover:bg-stone-50/20 border border-stone-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl p-4 text-sm text-stone-800 leading-relaxed focus:outline-none focus:bg-white resize-y font-sans transition-all"
                  />
                  {isRecording && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-rose-500 text-white text-[9px] font-mono tracking-wider uppercase font-semibold px-2 py-1 rounded-md shadow-sm">
                      <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
                      Capturing
                    </div>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500">
                  <span>
                    Word Count: <strong className="font-mono text-stone-700">{transcript.split(/\s+/).filter(Boolean).length}</strong>
                  </span>
                  <span>Editable draft</span>
                </div>
              </div>

              {/* GENERATE ACTION BAR */}
              <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
                  <CheckCircle size={14} className="text-teal-600" />
                  <span>The AI generates structured HIPAA-ready notes from consultation text.</span>
                </div>

                <button
                  onClick={handleGenerateClinicalNote}
                  disabled={isGenerating || transcript.trim().length === 0}
                  className={`flex items-center gap-2 font-semibold text-xs py-3 px-6 rounded-xl shadow-sm transition-all duration-150 ${
                    transcript.trim().length === 0
                      ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700 text-white hover:shadow"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Scribing Clinical Analysis...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Generate Clinical Note</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Disclaimer disclaimer notices */}
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-[11.5px] text-orange-800 leading-relaxed flex gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-orange-600 mt-0.5" />
              <div>
                <strong>Legal Safety Advisory:</strong> ClinicalScribe AI organizes documented verbal notes for professional reference. It does not provide medical logic, diagnostics, or therapy recommendations. Real-time patient care accountability is exclusively held by the medical specialist.
              </div>
            </div>
          </div>
        ) : (
          /* SCREEN 2: Note Review Screen */
          <div className="flex-1 flex flex-col space-y-6 max-w-4xl w-full mx-auto print:max-w-full print:p-0">
            {/* Header controls for Note Review Screen */}
            <div className="flex items-center justify-between print:hidden">
              <button
                onClick={() => setActiveScreen("recorder")}
                className="flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg hover:bg-stone-100 transition"
              >
                <ChevronLeft size={16} />
                <span>Back to Consult Scribe</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyToClipboard(JSON.stringify(activeDocument, null, 2), "Full Document")}
                  className="flex items-center gap-2 px-3.5 py-2 text-[11px] font-semibold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition"
                >
                  <Copy size={13} />
                  <span>Copy raw JSON</span>
                </button>

                <button
                  onClick={handleExportMarkdown}
                  className="flex items-center gap-2 px-3.5 py-2 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 hover:bg-teal-100/50 rounded-xl transition"
                >
                  <Download size={13} />
                  <span>Download Markdown</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3.5 py-2 text-[11px] font-semibold text-white bg-stone-850 hover:bg-stone-900 rounded-xl transition shadow-sm"
                >
                  <FileText size={13} />
                  <span>Print Note / PDF</span>
                </button>
              </div>
            </div>

            {/* Print Header banner */}
            <div className="hidden print:block border-b-2 border-stone-800 pb-4 mb-6">
              <h1 className="text-2xl font-bold uppercase text-stone-900">ClinicalScribe AI SOAP Report</h1>
              <p className="text-xs text-stone-600">Automated medical consultation documentation. HIPAA-compliant offline representation.</p>
              <div className="grid grid-cols-2 mt-4 text-xs gap-2">
                <div><strong>Encounter Title:</strong> {activeDocument?.title}</div>
                <div><strong>Transcription Timestamp:</strong> {activeDocument?.timestamp}</div>
              </div>
            </div>

            {/* Core Review Layout */}
            {activeDocument ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:flex print:flex-col">
                
                {/* PRIMARY DETAILS REPORT: 8 columns left */}
                <div className="lg:col-span-8 flex flex-col gap-6 print:w-full">
                  
                  {/* Executive Patient Summary (Critical MVP Item 1) */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                      <h3 className="font-display font-bold text-base text-stone-900 flex items-center gap-2">
                        <UserCheckIcon className="text-teal-600 h-4 w-4" />
                        Patient Encounter Overview
                      </h3>
                      <button
                        onClick={() => handleCopyToClipboard(activeDocument.patient_summary, "Patient Summary")}
                        className="text-stone-400 hover:text-stone-700 font-medium text-[10px] flex items-center gap-1 transition"
                      >
                        <Copy size={11} />
                        <span>Copy Summary</span>
                      </button>
                    </div>
                    <p className="text-stone-800 text-sm leading-relaxed leading-7">
                      {activeDocument.patient_summary}
                    </p>
                  </div>

                  {/* SOAP NOTE - Dynamic Tabbed Panel (Critical MVP Item 2) */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col print:border-none print:shadow-none print:p-0">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4 print:mb-2 text-stone-900">
                      <h3 className="font-display font-bold text-base text-stone-900 flex items-center gap-2">
                        <HeartPulse className="text-rose-500 h-4 w-4" />
                        Structured SOAP Note
                      </h3>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono font-semibold print:hidden">
                        Tabbed Review
                      </span>
                    </div>

                    {/* SOAP navigation controller tabs */}
                    <div className="flex p-1 bg-stone-100/80 rounded-xl space-x-1.5 mb-5 print:hidden">
                      {(["subjective", "objective", "assessment", "plan"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveSoapTab(tab)}
                          className={`flex-1 py-2 text-xs font-bold font-display rounded-lg capitalize transition-all ${
                            activeSoapTab === tab
                              ? "bg-white text-stone-900 shadow-sm"
                              : "text-stone-500 hover:text-stone-800"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Active SOAP text card */}
                    <div className="bg-stone-50/50 rounded-xl p-5 border border-stone-200/50 relative print:bg-white print:border-none print:p-0">
                      <div className="absolute top-4 right-4 print:hidden">
                        <button
                          onClick={() => handleCopyToClipboard(activeDocument.soap_note[activeSoapTab], `${activeSoapTab.toUpperCase()} Category`)}
                          className="bg-white hover:bg-stone-100 border border-stone-200 text-stone-500 hover:text-stone-700 text-[10px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg transition"
                        >
                          <Copy size={10} />
                          <span>Copy</span>
                        </button>
                      </div>

                      <div className="print:hidden">
                        <h4 className="font-display font-bold text-xs uppercase tracking-widest text-teal-700 mb-2">
                          {activeSoapTab} Findings
                        </h4>
                        <div className="text-stone-800 text-sm leading-relaxed whitespace-pre-wrap leading-7 font-sans">
                          {activeDocument.soap_note[activeSoapTab]}
                        </div>
                      </div>

                      {/* Print Layout representing ALL 4 components sequentially */}
                      <div className="hidden print:block space-y-6">
                        {(["subjective", "objective", "assessment", "plan"] as const).map((tab) => (
                          <div key={tab} className="border-b border-stone-300 pb-3">
                            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-stone-900">
                              {tab}
                            </h4>
                            <p className="text-xs text-stone-800 whitespace-pre-wrap mt-2 leading-relaxed">
                              {activeDocument.soap_note[tab]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RAW TRANSCRIPT ARCHIVE PANEL */}
                  <details className="group bg-white rounded-2xl border border-stone-200 p-5 shadow-sm print:hidden">
                    <summary className="font-display font-semibold text-sm text-stone-700 cursor-pointer flex items-center justify-between focus:outline-none">
                      <span>Review raw patient conversation transcript</span>
                      <span className="text-xs text-teal-600 font-semibold group-open:hidden">Show Transcript</span>
                      <span className="text-xs text-teal-600 font-semibold hidden group-open:inline">Hide Transcript</span>
                    </summary>
                    <div className="mt-4 pt-4 border-t border-stone-100 max-h-[250px] overflow-y-auto bg-stone-50 p-3 rounded-lg border text-xs text-stone-600 whitespace-pre-line leading-relaxed scrollbar font-mono">
                      {activeDocument.transcript}
                    </div>
                  </details>
                </div>

                {/* CLINICAL SUMMARY BADGES: 4 columns right sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6 print:w-full print:mt-6">
                  
                  {/* Symptoms & Medications recognized (Items 3 & 4) */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col">
                    <h3 className="font-display font-bold text-sm text-stone-900 border-b border-stone-100 pb-3 mb-4 flex items-center gap-2">
                      <TrendingUp className="text-teal-600 h-4 w-4" />
                      Key Clinical Extractions
                    </h3>
                    
                    {/* Symptoms recognized */}
                    <div className="mb-5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold block mb-2.5">
                        Symptoms Recognized
                      </span>
                      {activeDocument.key_symptoms.length === 0 ? (
                        <span className="text-xs text-stone-400 italic">No diagnostic markers discussed.</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {activeDocument.key_symptoms.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-100 rounded-lg px-2.5 py-1"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Medications list */}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold block mb-2.5">
                        Medications & Regimens
                      </span>
                      {activeDocument.medications.length === 0 ? (
                        <span className="text-xs text-stone-400 italic">No therapies or medications.</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {activeDocument.medications.map((m, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-lg px-2.5 py-1"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Objective Findings list (Item 5) */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col">
                    <h3 className="font-display font-bold text-sm text-stone-900 border-b border-stone-100 pb-3 mb-4 flex items-center gap-2">
                      <Activity className="text-stone-700 h-4 w-4" />
                      Observable Findings
                    </h3>
                    {activeDocument.clinical_findings.length === 0 ? (
                      <span className="text-xs text-stone-400 italic">No physical examination parameters were listed in conversation.</span>
                    ) : (
                      <ul className="space-y-2">
                        {activeDocument.clinical_findings.map((f, i) => (
                          <li key={i} className="flex gap-2.5 text-xs text-stone-700 items-start leading-relaxed">
                            <span className="h-1.5 w-1.5 bg-stone-400 rounded-full mt-1.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Safety and Follow-up recommendations (Item 6) */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col">
                    <h3 className="font-display font-bold text-sm text-stone-900 border-b border-stone-100 pb-3 mb-4 flex items-center gap-2">
                      <Clock className="text-orange-600 h-4 w-4" />
                      Schedule Care & Warnings
                    </h3>
                    {activeDocument.follow_up_recommendations.length === 0 ? (
                      <span className="text-xs text-stone-400 italic">No follow-up constraints or red flags noted in log.</span>
                    ) : (
                      <ul className="space-y-2">
                        {activeDocument.follow_up_recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-2.5 text-xs text-stone-700 items-start leading-relaxed">
                            <span className="h-1.5 w-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Scriptor Clinican footer context branding */}
      <footer className="bg-white py-5 border-t border-stone-200 mt-20 text-center text-xs text-stone-400 font-sans print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ClinicalScribe AI. Fully sandbox-compliant HIPAA architecture.
          </span>
          <span>
            attending doctor portal v2.5.0
          </span>
        </div>
      </footer>
    </div>
  );
}

// Inline helper icons to avoid missing imports in strict trees
function UserCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
