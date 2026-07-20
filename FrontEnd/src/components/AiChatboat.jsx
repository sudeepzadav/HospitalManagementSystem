import React, { useState } from "react";
import api from "../api/axios";

const BRAND = "#0F6E56";

// Steps: idle -> problem -> department -> doctor -> date -> reason -> confirm -> done
const AiChatboat = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello 👋 I'm your healthcare assistant. I can help you book an appointment.",
    },
  ]);

  const [step, setStep] = useState("idle");
  const [loading, setLoading] = useState(false);

  const [doctors, setDoctors] = useState([]); // all doctors, fetched once
  const [allDepartments, setAllDepartments] = useState([]);
  const [suggestedDepartment, setSuggestedDepartment] = useState(null);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  const [flow, setFlow] = useState({
    problem: "",
    department: "",
    doctor: null, // full doctor object
    date: "",
    reason: "",
    queue: null, // { count, nextToken, maxPerDay }
  });

  const addBotMessage = (text) => {
    setMessages((prev) => [...prev, { sender: "bot", text }]);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
  };

  const resetFlow = () => {
    setFlow({ problem: "", department: "", doctor: null, date: "", reason: "", queue: null });
    setSuggestedDepartment(null);
    setStep("idle");
  };

  // ======================
  // Step: Start booking -> ask for the problem first
  // ======================
  const startBooking = () => {
    addUserMessage("Book an appointment");
    addBotMessage("Sure! First, tell me a bit about the problem you're having.");
    setStep("problem");
  };

  // ======================
  // Step: Problem submitted -> match department, fetch doctors
  // ======================
  const submitProblem = async (text) => {
    const problem = text.trim();
    if (!problem) return;
    addUserMessage(problem);
    setFlow((prev) => ({ ...prev, problem }));
    setLoading(true);

    try {
      const [matchRes, doctorsRes] = await Promise.all([
        api.post("/appointments/match-department", { problem }),
        api.get("/doctors"),
      ]);

      const list = doctorsRes.data || [];
      setDoctors(list);

      const departments = matchRes.data?.departments?.length
        ? matchRes.data.departments
        : [...new Set(list.map((d) => d.department))].filter(Boolean);
      setAllDepartments(departments);

      if (departments.length === 0) {
        addBotMessage("Sorry, no departments are available for booking right now.");
        setStep("idle");
        return;
      }

      const matched = matchRes.data?.matchedDepartment || null;
      setSuggestedDepartment(matched);

      if (matched) {
        addBotMessage(
          `Based on what you told me, this sounds like it could be a ${matched} issue. You can go with that, or pick a different department below.`
        );
      } else {
        addBotMessage("Got it. I couldn't pin down a specific department for that — here are all the departments we have:");
      }

      setStep("department");
    } catch (err) {
      addBotMessage("Sorry, I couldn't process that right now. Please try again in a moment.");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // Step: Pick department
  // ======================
  const pickDepartment = (dept) => {
    addUserMessage(dept);
    const inDept = doctors.filter((d) => d.department === dept);
    setFilteredDoctors(inDept);
    setFlow((prev) => ({ ...prev, department: dept }));

    if (inDept.length === 0) {
      addBotMessage(`Sorry, there are no doctors currently listed under ${dept}.`);
      setStep("department");
      return;
    }

    addBotMessage(`Here are the doctors in ${dept}:`);
    setStep("doctor");
  };

  // ======================
  // Step: Pick doctor -> ask for date
  // ======================
  const pickDoctor = (doctor) => {
    const doctorName = doctor.userId?.name || "the doctor";
    addUserMessage(`Dr. ${doctorName}`);
    setFlow((prev) => ({ ...prev, doctor }));
    addBotMessage(`Great choice. What date would you like to see Dr. ${doctorName}?`);
    setStep("date");
  };

  // ======================
  // Step: Pick date -> check queue status (20/day cap)
  // ======================
  const submitDate = async (dateValue) => {
    if (!dateValue) return;
    addUserMessage(
      new Date(dateValue).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    setFlow((prev) => ({ ...prev, date: dateValue }));
    setLoading(true);

    try {
      const res = await api.get("/appointments/queue-status", {
        params: { doctorId: flow.doctor._id, date: dateValue },
      });

      const data = res.data;

      if (!data.dayAvailable) {
        addBotMessage(data.message || "The doctor isn't available on that day. Please pick another date.");
        setStep("date");
        return;
      }

      if (data.isFull) {
        addBotMessage(
          `Dr. ${flow.doctor.userId?.name || ""} already has ${data.count}/${data.maxPerDay} patients booked that day. Please pick a different date.`
        );
        setStep("date");
        return;
      }

      setFlow((prev) => ({
        ...prev,
        queue: { count: data.count, nextToken: data.nextToken, maxPerDay: data.maxPerDay },
      }));
      addBotMessage(
        `You'd be token #${data.nextToken} for that day (${data.count}/${data.maxPerDay} booked so far). Want to add any extra notes about your visit? (optional)`
      );
      setStep("reason");
    } catch (err) {
      addBotMessage("Sorry, I couldn't check the doctor's queue. Please try another date.");
      setStep("date");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // Step: Reason (optional free text, reuses the main input box)
  // ======================
  const submitReason = (text) => {
    const reason = text.trim();
    addUserMessage(reason || "Skip");
    setFlow((prev) => ({ ...prev, reason }));
    setStep("confirm");
    addBotMessage("Please confirm your appointment:");
  };

  // ======================
  // Step: Confirm -> book
  // ======================
  const confirmBooking = async () => {
    setLoading(true);
    try {
      const res = await api.post("/appointments/self-book", {
        doctorId: flow.doctor._id,
        department: flow.department,
        date: flow.date,
        problem: flow.problem,
        reason: flow.reason,
      });

      const doctorName = flow.doctor.userId?.name || "your doctor";
      const tokenNumber = res.data?.appointment?.tokenNumber;
      addBotMessage(
        `✅ Appointment booked with Dr. ${doctorName} on ${new Date(
          flow.date
        ).toLocaleDateString()}${tokenNumber ? ` — you're token #${tokenNumber}` : ""}. You'll see it in your appointments list.`
      );
      resetFlow();
    } catch (err) {
      const msg = err.response?.data?.message || "Sorry, something went wrong while booking.";
      addBotMessage(`${msg} Would you like to try a different date?`);
      setStep("date");
    } finally {
      setLoading(false);
    }
  };

  const cancelFlow = () => {
    addUserMessage("Cancel");
    addBotMessage("No problem, let me know if you'd like to book later.");
    resetFlow();
  };

  // ======================
  // Free-text input (used for problem step, reason step, and fallback nudge)
  // ======================
  const sendMessage = () => {
    const text = message.trim();
    if (!text && step !== "reason") return;

    if (step === "problem") {
      submitProblem(text);
      setMessage("");
      return;
    }

    if (step === "reason") {
      submitReason(text);
      setMessage("");
      return;
    }

    // Fallback for free text outside the guided flow
    addUserMessage(text);
    addBotMessage(
      'I can help you book an appointment — tap "Book an appointment" below to get started.'
    );
    setMessage("");
  };

  // Order departments so the suggested one (if any) appears first
  const orderedDepartments = suggestedDepartment
    ? [suggestedDepartment, ...allDepartments.filter((d) => d !== suggestedDepartment)]
    : allDepartments;

  return (
    <div className="fixed bottom-10 right-5 z-50">
      {open && (
        <div className="w-80 h-112 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div
            className="text-white px-4 py-3 flex justify-between items-center"
            style={{ background: BRAND }}
          >
            <div>
              <h3 className="font-semibold">Health Assistant</h3>
              <p className="text-xs">Online</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-xl text-sm max-w-[75%] whitespace-pre-line ${
                    msg.sender === "user" ? "text-white" : "bg-gray-100 text-gray-700"
                  }`}
                  style={msg.sender === "user" ? { background: BRAND } : undefined}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl text-sm bg-gray-100 text-gray-400">
                  Typing…
                </div>
              </div>
            )}

            {/* Idle: start button */}
            {step === "idle" && !loading && (
              <div className="flex justify-start">
                <button
                  onClick={startBooking}
                  className="px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: BRAND }}
                >
                  📅 Book an appointment
                </button>
              </div>
            )}

            {/* Problem step hint */}
            {step === "problem" && !loading && (
              <p className="text-xs text-gray-400">
                Type your symptom or problem below and hit send (e.g. "chest pain", "skin rash").
              </p>
            )}

            {/* Department options */}
            {step === "department" && !loading && (
              <div className="flex flex-wrap gap-2">
                {orderedDepartments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => pickDepartment(dept)}
                    className="px-3 py-1.5 rounded-full text-xs border"
                    style={
                      dept === suggestedDepartment
                        ? { background: BRAND, color: "white", borderColor: BRAND }
                        : { borderColor: BRAND, color: BRAND }
                    }
                  >
                    {dept === suggestedDepartment ? `✓ ${dept} (suggested)` : dept}
                  </button>
                ))}
                <button onClick={cancelFlow} className="text-xs text-gray-400 underline self-start w-full">
                  Cancel
                </button>
              </div>
            )}

            {/* Doctor options */}
            {step === "doctor" && !loading && (
              <div className="flex flex-col gap-2">
                {filteredDoctors.map((doc) => (
                  <button
                    key={doc._id}
                    onClick={() => pickDoctor(doc)}
                    className="text-left px-3 py-2 rounded-lg text-xs border border-gray-200 hover:border-[#0F6E56]"
                  >
                    <span className="font-medium">Dr. {doc.userId?.name || "Unknown"}</span>
                    <br />
                    <span className="text-gray-500">
                      {doc.specialization} · ${doc.consultationFee || 0}
                    </span>
                  </button>
                ))}
                <button onClick={cancelFlow} className="text-xs text-gray-400 underline self-start">
                  Cancel
                </button>
              </div>
            )}

            {/* Date picker */}
            {step === "date" && !loading && (
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                  onChange={(e) => submitDate(e.target.value)}
                />
                <button onClick={cancelFlow} className="text-xs text-gray-400 underline self-start">
                  Cancel
                </button>
              </div>
            )}

            {/* Reason step hint */}
            {step === "reason" && !loading && (
              <p className="text-xs text-gray-400">
                Type any extra notes below and hit send, or just hit send to skip.
              </p>
            )}

            {/* Confirm */}
            {step === "confirm" && !loading && (
              <div className="flex flex-col gap-2">
                <div className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                  <p>
                    <span className="font-medium">Doctor:</span> Dr. {flow.doctor?.userId?.name}
                  </p>
                  <p>
                    <span className="font-medium">Department:</span> {flow.department}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span>{" "}
                    {new Date(flow.date).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Token:</span> #{flow.queue?.nextToken} of{" "}
                    {flow.queue?.maxPerDay} today
                  </p>
                  <p>
                    <span className="font-medium">Problem:</span> {flow.problem}
                  </p>
                  {flow.reason && (
                    <p>
                      <span className="font-medium">Notes:</span> {flow.reason}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={confirmBooking}
                    className="flex-1 px-3 py-2 rounded-lg text-xs text-white"
                    style={{ background: BRAND }}
                  >
                    Confirm booking
                  </button>
                  <button
                    onClick={cancelFlow}
                    className="flex-1 px-3 py-2 rounded-lg text-xs border border-gray-300 text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Input (used for problem step, reason step, and free-text fallback) */}
          <div className="p-3 border-t flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder={
                step === "problem"
                  ? "Describe your problem…"
                  : step === "reason"
                  ? "Extra notes (optional)…"
                  : "Ask about appointments..."
              }
              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={sendMessage}
              className="text-white px-4 rounded-lg"
              style={{ background: BRAND }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center text-2xl"
          style={{ background: BRAND }}
        >
          💬
        </button>
      )}
    </div>
  );
};

export default AiChatboat;