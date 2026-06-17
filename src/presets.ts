import { ConversationPreset } from "./types";

export const CONVERSATION_PRESETS: ConversationPreset[] = [
  {
    id: "bronchitis",
    title: "Acute Cough & Sore Throat consult",
    specialty: "Primary Care / Pulmonology",
    duration: "2 min 14 sec",
    transcript: `Doctor: Good morning, Clara. What brings you to the clinic today?
Patient: Hi Dr. Miller. I've had a really bad cough for about four days now. It feels very deep, and it's starting to hurt my chest.
Doctor: I see. Are you coughing anything up? Any phlegm or mucus?
Patient: Yes, it is a bit thick, yellow or greenish sometimes. Especially in the morning.
Doctor: Okay. Any fever or chills?
Patient: I took my temperature last night and it was 100.4. I've felt a bit feverish and tired, yes.
Doctor: Any shortness of breath, or wheezing when you breathe?
Patient: Not really short of breath when sitting, but if I walk up the stairs I feel winded. And my throat is quite painful, especially when I swallow.
Doctor: Understood. Let's do an examination. I'm going to listen to your lungs. Take deep breaths in and out through your mouth... Okay, breathe. I hear some scattered expiratory wheezes and mild rhonchi in both lower lobes, but your breath sounds are generally equal and there is no consolidation.
Patient: Is it pneumonia, doctor?
Doctor: Luckily, no. Your lungs are clear of dullness, and there's no bronchial breathing that would suggest pneumonia. Let's inspect your throat... Yes, your posterior pharynx is red, slightly swollen, but I don't see any tonsillar exudate or white patches. Your cervical lymph nodes are slightly tender but not abnormally enlarged.
Patient: What do you think is going on?
Doctor: It looks like acute bronchitis, likely a viral respiratory tract infection. Since it's viral, antibiotics won't help and could cause unnecessary side effects.
Patient: What should I do for the cough then? It's keeping me awake.
Doctor: I recommend starting an over-the-counter cough suppressant, like dextromethorphan, specifically Robitussin cough gels, 15 to 30 milligrams every six to eight hours as needed. For the throat pain and low fever, you can take acetaminophen 500 milligrams every six hours, but please do not exceed 3,000 milligrams in a day. Also, use a cool-mist humidifier in your room and drink lots of fluids - water or warm herbal tea.
Patient: Okay. When should I worry?
Doctor: If you develop a fever over 101.5 that doesn't go down with acetaminophen, any chest pressure, severe shortness of breath, or if you start coughing up dark red blood, call us immediately or go to the nearest urgent care. Otherwise, bronchitis can linger for up to two to three weeks, but you should start feeling better in a few days.
Patient: Perfect, thank you Dr. Miller.
Doctor: You're welcome, Clara. Let me print out this care plan, and please follow up if you're not improved in ten days.`
  },
  {
    id: "knee-pain",
    title: "Severe Right Knee Osteoarthritis review",
    specialty: "Orthopedics / Rheumatology",
    duration: "3 min 02 sec",
    transcript: `Doctor: Good afternoon, Harold. Let's take a look at that right knee. How has it been since our last visit?
Patient: Honestly, Dr. Davis, it has been getting worse. The pain is persistent, particularly on the inside part of my knee when I'm walking or standing. I can barely manage a block before I have to sit down.
Doctor: I'm sorry to hear that. On a scale of 1 to 10, how would you rate the pain during active walking?
Patient: It's easily an 8 out of 10. And at night, it throbs. It wakes me up two or three times.
Doctor: Any swelling, warmth, or instability where it feels like it's buckling or giving out?
Patient: It gets swollen after I stand for a while. It feels stiff in the morning for about 20 minutes. No buckling, but it definitely creaks.
Doctor: Let's do some physical maneuvers. Looking at the right knee, there is mild joint effusion and obvious varus alignment - what we call bow-legged stance. On palpation, you have moderate-to-severe tenderness along the medial joint line of the right knee. No lateral line tenderness.
Patient: Owens! Yes, right there is where it hurts.
Doctor: Yes, that is the medial tibial plateau. Your range of motion is limited: flexion is only to 110 degrees, and you lack about 5 degrees of full extension. I hear significant bony crepitus during passive range of motion. MacMurray and Lachman tests are negative, and both your collateral ligaments are stable.
Patient: What do the X-rays show from last week?
Doctor: The X-rays confirm what we're seeing on exam: severe joint space narrowing in the medial compartment of the right knee, significant subchondral sclerosis, and notable osteophytes. This is advanced Stage 3 medial compartment osteoarthritis.
Patient: I've tried ibuprofen and it's not doing much anymore. Do I need a knee replacement?
Doctor: Eventually, a total knee arthroplasty is likely, given the severity. However, we should first try a conservative escalation. I'm going to prescribe Meloxicam, which is a stronger, once-daily prescription NSAID. 15 milligrams once daily with food. I'm also going to send a referral to Physical Therapy for a six-week course of quadriceps strengthening and hamstring stretching to help stabilize the joint.
Patient: Can we do another cortisone shot?
Doctor: It's been five months since your last injection, so yes, we can perform an intra-articular corticosteroid injection today to help reduce the acute synovitis and night throbbing. I'll use 40 milligrams of Kenalog mixed with 1% lidocaine.
Patient: That would be helpful.
Doctor: Let's get that scheduled and get you set up with physical therapy. Please check your blood pressure regularly while on Meloxicam, as it can occasionally raise it, and stop taking it if you experience any dark, tarry stools or severe stomach upset.`
  },
  {
    id: "hypertension",
    title: "Hypertension Routine Follow-up",
    specialty: "Internal Medicine / Cardiology",
    duration: "1 min 45 sec",
    transcript: `Doctor: Hello, Robert. Welcome back. We're review of your blood pressure values today.
Patient: Hi Dr. Sanchez. I've been tracking them at home like you asked.
Doctor: Excellent. Tell me, what have your readings been averaging?
Patient: Mostly they're around 142 over 88 in the mornings, and sometimes 148 over 90 in the evenings before dinner.
Doctor: Okay. Are you having any headaches, blurry vision, chest pain, or shortness of breath?
Patient: No, I feel perfectly fine. None of those.
Doctor: Are you taking your Lisinopril 10mg every single morning as prescribed?
Patient: Yes, I haven't missed a dose. I take it right after my coffee.
Doctor: Okay. Let's check your blood pressure in the office today... Your reading is 146 over 92, heart rate is 72 beats per minute, regular rhythm. This confirms your home logs: your blood pressure remains consistently above our goal of 130 over 80.
Patient: Do I need to double the dose?
Doctor: Since you are tolerating the Lisinopril well without any side effects like a dry cough, instead of doubling Lisinopril, I think it is best to add a second low-dose medication. I will prescribe Amlodipine, which is a calcium channel blocker, 5 milligrams to be taken once daily. You can take it in the evening.
Patient: Are there any side effects to that?
Doctor: Some patients experience mild swelling around their ankles, known as peripheral edema. If that becomes uncomfortable, let me know.
Doctor: Now, how has the sodium restriction been going?
Patient: I've cut out processed soups and frozen dinners, but I could do better on home-cooked meals.
Doctor: Great effort. Keeping sodium under 2,000 milligrams a day is critical. Let's do a basic metabolic panel today to check your potassium levels and kidney function, which we monitor when altering Lisinopril or adding antihypertensives.
Patient: Sure.
Doctor: Continue checking your pressure at home twice a day, and write them down. Come back in 4 weeks for a repeat blood pressure check and to review the lab results.`
  }
];
