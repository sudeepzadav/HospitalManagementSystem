const { GoogleGenAI, Type } = require("@google/genai");

// ADJUST this import to match your project's actual Doctor model path/name.
const Doctor = require("../model/doctorSchema");

if (!process.env.GEMINI_API_KEY) {
  // Without an explicit apiKey, @google/genai silently falls back to trying
  // Google Cloud Application Default Credentials (Vertex AI auth) instead
  // of simple API-key auth — which fails with a confusing
  // "Could not load the default credentials" error. Failing loudly here
  // instead makes the real problem (missing/unloaded env var) obvious.
  console.error(
    "GEMINI_API_KEY is not set — check your .env file exists next to where you run `node index.js`, and that dotenv.config() runs before this file is required."
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Free-tier model — gemini-2.5-flash was retired for new accounts. If this
// itself becomes unavailable later, check https://ai.google.dev/gemini-api/docs/latest-model
// for the current recommended free-tier model and swap the string below.
const MODEL = "gemini-3.6-flash";

// Keep this short and ACCURATE — edit these facts to match your real
// hospital. This gets sent on every request, so keep it tight.
const HOSPITAL_FACTS = `
- Hours: Mon-Sat 8:00 AM-8:00 PM, Sun 9:00 AM-2:00 PM. Emergency desk is 24/7.
- Departments: Cardiology, Dermatology, Pediatrics, Orthopedics, ENT, General Medicine, Gynecology, Psychiatry.
- Insurance: Nepal Life, Prime Life, Sanima GIC accepted; self-pay via eSewa.
- Location: Cedar Grove Health, Kathmandu. Exact address is on the Contact page.
- Booking: online via this chat or the Appointments page, or by phone at the front desk.
`;

const SYSTEM_PROMPT = `You are the assistant for Cedar Grove Health, a hospital booking website.

You help with three kinds of requests:

1. General hospital info — hours, departments, insurance, location. Use the facts below. If something isn't covered there, say you're not sure and suggest calling the front desk. Do not invent facts.

2. Finding a doctor — if the person is looking for a doctor by specialty, department, or condition, call the search_doctors tool. Never invent doctor names, specialties, or availability yourself — only the tool's results are real.

3. General health questions — give brief, general, educational information only. Never diagnose. Never recommend specific medications, dosages, or treatment plans. Always end with a short reminder to see a doctor for anything specific to them, and mention they can book an appointment here.

If the person wants to book, schedule, or see a doctor for an actual appointment (as opposed to just asking about one), call the start_booking tool instead of answering yourself — a structured flow handles collecting their details.

Hospital facts:
${HOSPITAL_FACTS}

Keep replies short — 2 to 4 sentences, chat-widget length, not an essay.`;

const tools = [
  {
    functionDeclarations: [
      {
        name: "search_doctors",
        description:
          "Look up doctors by name, specialty, department, or condition/symptom the person mentions.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "Name, specialty, department, or symptom to search for",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "start_booking",
        description: "Hand off to the structured appointment booking flow.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
    ],
  },
];

async function searchDoctors(query) {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  // ADJUST the field/populate names below if your Doctor schema differs.
  return Doctor.find({
    $or: [{ specialization: regex }, { department: regex }],
  })
    .populate("userId", "name")
    .limit(6);
}

async function handleChatMessage(req, res) {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  // Deliberately NOT sending patient name/age/gender/department/date here —
  // only the free-text question itself goes to the LLM.
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: message,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools,
      },
    });

    const call = response.functionCalls?.[0];

    if (call?.name === "start_booking") {
      return res.json({ type: "start_booking" });
    }

    if (call?.name === "search_doctors") {
      const query = (call.args?.query || "").trim();
      const doctors = await searchDoctors(query);
      return res.json({ type: "doctors", query, doctors });
    }

    return res.json({
      type: "text",
      reply: response.text || "Sorry, I didn't quite catch that — could you rephrase?",
    });
  } catch (err) {
    console.error("Chatbot message error:", err);
    return res.status(500).json({ error: "Sorry, the assistant is unavailable right now." });
  }
}

module.exports = { handleChatMessage };