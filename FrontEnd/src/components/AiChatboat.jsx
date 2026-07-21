import React, { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import api from "../api/axios";

const BRAND = "#0F6E56";

const SYMPTOM_KEYWORDS = {
  cardiology: ["heart", "chest pain", "palpitation", "blood pressure", "cardiac"],
  dermatology: ["skin", "rash", "acne", "itch", "eczema"],
  orthopedics: ["bone", "fracture", "joint", "back pain", "knee", "shoulder", "sprain"],
  pediatrics: ["child", "baby", "infant", "kid", "toddler"],
  neurology: ["headache", "migraine", "seizure", "numbness", "dizziness", "nerve"],
  ent: ["ear", "nose", "throat", "sinus", "hearing"],
  ophthalmology: ["eye", "vision", "blurry", "sight"],
  gastroenterology: ["stomach", "abdominal", "digestion", "nausea", "vomit", "acidity"],
  gynecology: ["pregnan", "menstrual", "period", "gynae"],
  psychiatry: ["anxiety", "depression", "stress", "sleep", "mental"],
  general: ["fever", "cold", "cough", "flu", "general checkup"],
};

// Steps: idle -> problem -> department -> doctor -> date -> confirm -> payment -> done
const AiChatboat = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello 👋 I'm your healthcare assistant. Tell me what's going on and I'll help you book an appointment.",
    },
  ]);

  const [step, setStep] = useState("idle");
  const [loading, setLoading] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  const [flow, setFlow] = useState({
    patientDetails: { name: "", age: "", gender: "" },
    problem: "",
    department: "",
    doctor: null,
    date: "",
  });

  const [patientForm, setPatientForm] = useState({ name: "", age: "", gender: "" });

  const [payment, setPayment] = useState(null); // { transactionUuid, amount, paymentPageUrl }
  const pollRef = useRef(null);

  const addBotMessage = (text) => setMessages((prev) => [...prev, { sender: "bot", text }]);
  const addUserMessage = (text) => setMessages((prev) => [...prev, { sender: "user", text }]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []); // cleanup on unmount

  const resetFlow = () => {
    stopPolling();
    setFlow({
      patientDetails: { name: "", age: "", gender: "" },
      problem: "",
      department: "",
      doctor: null,
      date: "",
    });
    setPatientForm({ name: "", age: "", gender: "" });
    setPayment(null);
    setStep("idle");
  };

  const startBooking = () => {
    addUserMessage("Book an appointment");
    addBotMessage("Sure — who is this appointment for? Please share their name, age, and gender.");
    setStep("patientInfo");
  };

  const submitPatientInfo = () => {
    const { name, age, gender } = patientForm;
    if (!name.trim() || !age || !gender) return;

    addUserMessage(`${name.trim()}, ${age}, ${gender}`);
    setFlow((prev) => ({
      ...prev,
      patientDetails: { name: name.trim(), age: Number(age), gender },
    }));
    addBotMessage("Thanks! Now, what's the problem or symptom you're dealing with?");
    setStep("problem");
  };

  const submitProblem = async (text) => {
    const problem = text.trim();
    addUserMessage(problem);
    setFlow((prev) => ({ ...prev, problem }));
    setLoading(true);

    try {
      const res = await api.get("/doctors");
      const list = res.data || [];
      setDoctors(list);

      const uniqueDepartments = [...new Set(list.map((d) => d.department))].filter(Boolean);
      setDepartments(uniqueDepartments);

      const matchedDept = matchDepartment(problem, uniqueDepartments);

      if (matchedDept) {
        const inDept = list.filter((d) => d.department === matchedDept);
        setFilteredDoctors(inDept);
        setFlow((prev) => ({ ...prev, department: matchedDept }));
        addBotMessage(
          `That sounds like it falls under ${matchedDept}. Here are the doctors available — or you can browse all departments instead.`
        );
        setStep("doctor");
      } else {
        addBotMessage("Got it. Which department would you like to see a doctor in?");
        setStep("department");
      }
    } catch (err) {
      addBotMessage("Sorry, I couldn't load doctors right now. Please try again in a moment.");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const matchDepartment = (text, availableDepartments) => {
    const lowerText = text.toLowerCase();
    for (const dept of availableDepartments) {
      const keywords = SYMPTOM_KEYWORDS[dept.toLowerCase()];
      if (keywords && keywords.some((kw) => lowerText.includes(kw))) return dept;
    }
    return null;
  };

  const showAllDepartments = () => {
    addUserMessage("Show all departments");
    addBotMessage("Sure, here are all departments:");
    setStep("department");
  };

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

  const pickDoctor = (doctor) => {
    const doctorName = doctor.userId?.name || "the doctor";
    addUserMessage(`Dr. ${doctorName}`);
    setFlow((prev) => ({ ...prev, doctor }));
    addBotMessage(`Great choice. What date would you like to see Dr. ${doctorName}?`);
    setStep("date");
  };

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

      const { bookedCount, capacity, full, nextToken } = res.data;

      if (full) {
        addBotMessage(
          `This doctor is fully booked on that day (${bookedCount}/${capacity}). Please pick another date.`
        );
        setStep("date");
      } else {
        setFlow((prev) => ({ ...prev, nextToken, bookedCount, capacity }));
        addBotMessage(
          `${bookedCount}/${capacity} booked for that day. You'd be token #${nextToken}. Please confirm below:`
        );
        setStep("confirm");
      }
    } catch (err) {
      addBotMessage("Sorry, I couldn't check the doctor's schedule. Please try another date.");
      setStep("date");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // Proceed to payment (replaces direct booking)
  // ======================
  const proceedToPayment = async () => {
    setLoading(true);
    try {
      const res = await api.post("/payments/initiate", {
        doctorId: flow.doctor._id,
        department: flow.department,
        date: flow.date,
        reason: flow.problem,
        patientDetails: flow.patientDetails,
      });

      setPayment(res.data);
      addBotMessage(
        `Please pay NPR ${res.data.amount} to confirm your booking. Scan the QR code with your phone, or use the link on this device.`
      );
      setStep("payment");
      startPolling(res.data.transactionUuid);
    } catch (err) {
      addBotMessage(err.response?.data?.message || "Sorry, couldn't start the payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (transactionUuid) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/payments/status/${transactionUuid}`);
        if (res.data.status === "completed") {
          stopPolling();
          const appt = res.data.appointment;
          const doctorName = appt?.doctorId?.userId?.name || flow.doctor.userId?.name;
          addBotMessage(
            `✅ Payment received! Appointment booked with Dr. ${doctorName} on ${new Date(
              flow.date
            ).toLocaleDateString()}. Your token number is #${appt?.tokenNumber}.`
          );
          resetFlow();
        } else if (res.data.status === "failed") {
          stopPolling();
          addBotMessage("Payment failed or was cancelled. Would you like to try again?");
          setStep("confirm");
        }
        // if still "pending", keep polling
      } catch (err) {
        // transient error — keep polling silently
      }
    }, 3000);
  };

  const cancelFlow = () => {
    addUserMessage("Cancel");
    addBotMessage("No problem, let me know if you'd like to book later.");
    resetFlow();
  };

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;

    if (step === "problem") {
      submitProblem(text);
      setMessage("");
      return;
    }

    addUserMessage(text);
    addBotMessage(
      'I can help you book an appointment — tap "Book an appointment" below to get started.'
    );
    setMessage("");
  };

  return (
    <div className="fixed bottom-10 right-5 z-50">
      {open && (
        <div className="w-80 h-[30rem] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
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

            {step === "patientInfo" && !loading && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Full name"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                />
                <input
                  type="number"
                  min="0"
                  max="120"
                  placeholder="Age"
                  value={patientForm.age}
                  onChange={(e) => setPatientForm((prev) => ({ ...prev, age: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                />
                <div className="flex gap-2">
                  {["male", "female", "other"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setPatientForm((prev) => ({ ...prev, gender: g }))}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs border capitalize"
                      style={
                        patientForm.gender === g
                          ? { background: BRAND, color: "white", borderColor: BRAND }
                          : { borderColor: "#e5e7eb", color: "#374151" }
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <button
                  onClick={submitPatientInfo}
                  disabled={!patientForm.name.trim() || !patientForm.age || !patientForm.gender}
                  className="px-3 py-2 rounded-lg text-xs text-white disabled:opacity-40"
                  style={{ background: BRAND }}
                >
                  Continue
                </button>
                <button onClick={cancelFlow} className="text-xs text-gray-400 underline self-start">
                  Cancel
                </button>
              </div>
            )}

            {step === "problem" && !loading && (
              <p className="text-xs text-gray-400">
                Type your symptom or reason for the visit below and hit send.
              </p>
            )}

            {step === "doctor" && !loading && flow.department && (
              <div className="flex justify-start">
                <button onClick={showAllDepartments} className="text-xs text-gray-400 underline">
                  Not the right department? Show all
                </button>
              </div>
            )}

            {step === "department" && !loading && (
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => pickDepartment(dept)}
                    className="px-3 py-1.5 rounded-full text-xs border"
                    style={{ borderColor: BRAND, color: BRAND }}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}

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
                      {doc.specialization} · NPR {doc.consultationFee || 0}
                    </span>
                  </button>
                ))}
                <button onClick={cancelFlow} className="text-xs text-gray-400 underline self-start">
                  Cancel
                </button>
              </div>
            )}

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

            {step === "confirm" && !loading && (
              <div className="flex flex-col gap-2">
                <div className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                  <p>
                    <span className="font-medium">Patient:</span> {flow.patientDetails.name} (
                    {flow.patientDetails.age}, {flow.patientDetails.gender})
                  </p>
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
                    <span className="font-medium">Token:</span> #{flow.nextToken} ({flow.bookedCount}/
                    {flow.capacity} booked)
                  </p>
                  <p>
                    <span className="font-medium">Fee:</span> NPR {flow.doctor?.consultationFee || 0}
                  </p>
                  {flow.problem && (
                    <p>
                      <span className="font-medium">Reason:</span> {flow.problem}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={proceedToPayment}
                    className="flex-1 px-3 py-2 rounded-lg text-xs text-white"
                    style={{ background: BRAND }}
                  >
                    Proceed to payment
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

            {step === "payment" && payment && (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-2 border border-gray-200 rounded-lg">
                  <QRCode value={payment.paymentPageUrl} size={140} />
                </div>
                <a
                  href={payment.paymentPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline"
                  style={{ color: BRAND }}
                >
                  Or pay on this device
                </a>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Waiting for payment…
                </p>
                <button onClick={cancelFlow} className="text-xs text-gray-400 underline">
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="p-3 border-t flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder={step === "problem" ? "e.g. I have chest pain..." : "Ask about appointments..."}
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