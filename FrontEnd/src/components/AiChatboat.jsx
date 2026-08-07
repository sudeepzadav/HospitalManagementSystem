import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { SYMPTOM_KEYWORDS } from "../constant/symptommatcher";

const BRAND = "#0F6E56";

const AiChatboat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello 👋 I'm your healthcare assistant. Ask me about doctors, hospital hours, or a health concern — or book an appointment directly.",
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
    bookedCount: null,
    capacity: null,
    nextToken: null,
  });

  const [patientForm, setPatientForm] = useState({ name: "", age: "", gender: "" });

  const paymentTabRef = useRef(null);
  const paymentResolvedRef = useRef(false);
  const watchIntervalRef = useRef(null);

  const addBotMessage = (text) => setMessages((prev) => [...prev, { sender: "bot", text }]);
  const addUserMessage = (text) => setMessages((prev) => [...prev, { sender: "user", text }]);

  const stopWatchingPaymentTab = () => {
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
  };

  const resetFlow = () => {
    stopWatchingPaymentTab();
    paymentTabRef.current = null;
    paymentResolvedRef.current = false;
    setFlow({
      patientDetails: { name: "", age: "", gender: "" },
      problem: "",
      department: "",
      doctor: null,
      date: "",
      bookedCount: null,
      capacity: null,
      nextToken: null,
    });
    setPatientForm({ name: "", age: "", gender: "" });
    setFilteredDoctors([]);
    setStep("idle");
  };

  // Not logged in — nudge them to sign in instead of starting the booking
  // flow, and remember to send them back to the appointment flow after.
  const requireLoginForBooking = () => {
    addBotMessage("You'll need to log in first to book an appointment. Redirecting you to sign in…");
    setStep("idle");
    setOpen(false);
    navigate("/signin", { state: { from: "/appointment" } });
  };

  const startBooking = () => {
    if (!user) {
      addUserMessage("Book an appointment");
      requireLoginForBooking();
      return;
    }
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

    if (flow.doctor) {
      addBotMessage(
        `Thanks! What date would you like to see Dr. ${flow.doctor.userId?.name || "the doctor"}?`
      );
      setStep("doctorDate");
    } else {
      addBotMessage("Thanks! Now, what's the problem or symptom you're dealing with?");
      setStep("problem");
    }
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
        setFlow((prev) => ({ ...prev, department: matchedDept }));
        addBotMessage(
          `That sounds like it falls under ${matchedDept}. What date would you like to come in? (You can also browse all departments once you see the doctor list.)`
        );
        setStep("date");
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
    setFilteredDoctors([]);
    setStep("department");
  };

  const pickDepartment = (dept) => {
    addUserMessage(dept);
    setFlow((prev) => ({ ...prev, department: dept }));

    
    if (flow.date) {
      fetchDoctorsWithStatus(dept, flow.date);
    } else {
      addBotMessage(`Got it. What date would you like to come in for ${dept}?`);
      setStep("date");
    }
  };


  const fetchDoctorsWithStatus = async (dept, dateValue) => {
    setLoading(true);
    try {
      const inDept = doctors.filter((d) => d.department === dept);

      if (inDept.length === 0) {
        addBotMessage(`Sorry, there are no doctors currently listed under ${dept}.`);
        setStep("department");
        return;
      }

      const statusResults = await Promise.all(
        inDept.map(async (doctor) => {
          try {
            const statusRes = await api.get("/appointments/queue-status", {
              params: { doctorId: doctor._id, date: dateValue },
            });
            return { doctor, ...statusRes.data };
          } catch (err) {
            // If status check fails for a specific doctor, show them as
            // unknown rather than dropping the whole list
            return { doctor, bookedCount: null, capacity: null, full: null, nextToken: null };
          }
        })
      );

      setFilteredDoctors(statusResults);
      setFlow((prev) => ({ ...prev, department: dept, date: dateValue }));
      addBotMessage(
        `Here's availability in ${dept} on ${new Date(dateValue).toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}:`
      );
      setStep("doctor");
    } catch (err) {
      addBotMessage("Sorry, we couldn't load availability right now. Please try again.");
      setStep("date");
    } finally {
      setLoading(false);
    }
  };

  const submitDeptDate = (dateValue) => {
    if (!dateValue || !flow.department) return;
    addUserMessage(
      new Date(dateValue).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    fetchDoctorsWithStatus(flow.department, dateValue);
  };

  const pickDoctor = (item) => {
    const { doctor, bookedCount, capacity, full, nextToken } = item;
    if (full) return; // guarded in the UI too, but just in case

    const doctorName = doctor.userId?.name || "the doctor";
    addUserMessage(`Dr. ${doctorName}`);
    setFlow((prev) => ({ ...prev, doctor, bookedCount, capacity, nextToken }));
    addBotMessage(
      `Great choice. You'd be token #${nextToken} with Dr. ${doctorName} (${bookedCount}/${capacity} booked). Please confirm below:`
    );
    setStep("confirm");
  };


  const pickDoctorFromLookup = (doctor) => {
    if (!user) {
      addUserMessage(`Book with Dr. ${doctor.userId?.name || "Unknown"}`);
      requireLoginForBooking();
      return;
    }

    const doctorName = doctor.userId?.name || "Unknown";
    addUserMessage(`Book with Dr. ${doctorName}`);
    setFlow((prev) => ({ ...prev, doctor, department: doctor.department }));

    if (flow.patientDetails.name) {
      addBotMessage(`Got it — what date would you like to see Dr. ${doctorName}?`);
      setStep("doctorDate");
    } else {
      addBotMessage("Great — first, who is this appointment for? Please share their name, age, and gender.");
      setStep("patientInfo");
    }
  };

  const submitSingleDoctorDate = async (dateValue) => {
    if (!dateValue || !flow.doctor) return;

    addUserMessage(
      new Date(dateValue).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    setLoading(true);

    try {
      const res = await api.get("/appointments/queue-status", {
        params: { doctorId: flow.doctor._id, date: dateValue },
      });

      const { bookedCount, capacity, full, nextToken } = res.data;
      const doctorName = flow.doctor.userId?.name || "the doctor";

      if (full) {
        addBotMessage(
          `Dr. ${doctorName} is fully booked on that day (${bookedCount}/${capacity}). Please pick another date.`
        );
        setStep("doctorDate");
      } else {
        setFlow((prev) => ({ ...prev, date: dateValue, bookedCount, capacity, nextToken }));
        addBotMessage(
          `${bookedCount}/${capacity} booked for that day. You'd be token #${nextToken}. Please confirm below:`
        );
        setStep("confirm");
      }
    } catch (err) {
      addBotMessage("Sorry, I couldn't check that doctor's schedule. Please try another date.");
      setStep("doctorDate");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    function handlePaymentMessage(event) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== "appointment-payment-result") return;

      paymentResolvedRef.current = true;
      stopWatchingPaymentTab();

      if (data.status === "confirmed" && data.appointment) {
        const appt = data.appointment;
        const doctorName = appt.doctorName || flow.doctor?.userId?.name || "the doctor";
        addBotMessage(
          `✅ Payment received! Appointment booked with Dr. ${doctorName} on ${new Date(
            appt.date || flow.date
          ).toLocaleDateString()}. Your token number is #${appt.tokenNumber}.`
        );
        resetFlow();
      } else if (data.status === "failed") {
        addBotMessage("Payment didn't go through. Would you like to try again?");
        setStep("confirm");
      } else {
        addBotMessage(
          "We couldn't confirm the payment automatically. If you completed it, check the payment tab before trying again."
        );
        setStep("confirm");
      }
    }

    window.addEventListener("message", handlePaymentMessage);
    return () => {
      window.removeEventListener("message", handlePaymentMessage);
      stopWatchingPaymentTab();
    };
  }, [flow.doctor, flow.date]);

  const handleBookAndPay = () => {
    addUserMessage("Proceed to payment");

    const booking = {
      patient: {
        name: flow.patientDetails.name,
        age: flow.patientDetails.age,
        gender: flow.patientDetails.gender,
      },
      doctorId: flow.doctor._id,
      doctorName: flow.doctor.userId?.name || "Unknown",
      specialization: flow.doctor.specialization,
      department: flow.department,
      date: flow.date,
      reason: (flow.problem || "").trim(),
      consultationFee: flow.doctor.consultationFee || 0,
    };

  
    localStorage.setItem("pendingBooking", JSON.stringify(booking));

    
    const tab = window.open("/appointment/payment", "_blank");
    paymentTabRef.current = tab;
    paymentResolvedRef.current = false;

    addBotMessage(
      `A payment tab has opened for NPR ${booking.consultationFee}. Complete it there — I'll pick it up here as soon as it's done.`
    );
    setStep("awaitingPayment");

    stopWatchingPaymentTab();
    watchIntervalRef.current = setInterval(() => {
      if (paymentResolvedRef.current) {
        stopWatchingPaymentTab();
        return;
      }
      if (paymentTabRef.current && paymentTabRef.current.closed) {
        stopWatchingPaymentTab();
        addBotMessage(
          "Looks like the payment tab was closed before finishing. If you completed the payment, hang tight — otherwise you can try again below."
        );
        setStep("confirm");
      }
    }, 1000);
  };

  const reopenPaymentTab = () => {
    addUserMessage("Reopen payment tab");
    const tab = window.open("/appointment/payment", "_blank");
    paymentTabRef.current = tab;
  };

  const cancelFlow = () => {
    addUserMessage("Cancel");
    addBotMessage("No problem, let me know if you'd like to book later.");
    resetFlow();
  };

  
  const askAssistant = async (text) => {
    addUserMessage(text);
    setLoading(true);

    try {
      const res = await api.post("/chatbot/message", { message: text });
      const data = res.data;

      if (data.type === "start_booking") {
        if (!user) {
          requireLoginForBooking();
        } else {
          addBotMessage("Sure — who is this appointment for? Please share their name, age, and gender.");
          setStep("patientInfo");
        }
      } else if (data.type === "doctors") {
        if (!data.doctors || data.doctors.length === 0) {
          addBotMessage(
            `I couldn't find any doctors matching "${data.query}". Try a different specialty or department, or tap "Book an appointment" to browse all departments.`
          );
        } else {
          setMessages((prev) => [...prev, { sender: "bot", type: "doctors", doctors: data.doctors }]);
        }
      } else {
        addBotMessage(data.reply || "Sorry, I didn't quite catch that.");
      }
    } catch (err) {
      addBotMessage(
        "Sorry, I'm having trouble answering right now. You can still book using the button below."
      );
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;

    if (step === "problem") {
      submitProblem(text);
      setMessage("");
      return;
    }

    if (step === "idle") {
      askAssistant(text);
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
        <div className="w-80 h-120 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
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
                {msg.type === "doctors" ? (
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    {msg.doctors.map((doctor) => (
                      <button
                        key={doctor._id}
                        onClick={() => pickDoctorFromLookup(doctor)}
                        className="text-left px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white hover:border-[#0F6E56]"
                      >
                        <span className="font-medium">Dr. {doctor.userId?.name || "Unknown"}</span>
                        <br />
                        <span className="text-gray-500">
                          {doctor.specialization} · {doctor.department} · NPR {doctor.consultationFee || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`px-3 py-2 rounded-xl text-sm max-w-[75%] whitespace-pre-line ${
                      msg.sender === "user" ? "text-white" : "bg-gray-100 text-gray-700"
                    }`}
                    style={msg.sender === "user" ? { background: BRAND } : undefined}
                  >
                    {msg.text}
                  </div>
                )}
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
                  {user ? "📅 Book an appointment" : "🔒 Login to book an appointment"}
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

            {step === "date" && !loading && (
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                  onChange={(e) => submitDeptDate(e.target.value)}
                />
                <button onClick={cancelFlow} className="text-xs text-gray-400 underline self-start">
                  Cancel
                </button>
              </div>
            )}

            {step === "doctorDate" && !loading && (
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="border rounded-lg px-3 py-2 text-sm outline-none"
                  onChange={(e) => submitSingleDoctorDate(e.target.value)}
                />
                <button onClick={cancelFlow} className="text-xs text-gray-400 underline self-start">
                  Cancel
                </button>
              </div>
            )}

            {step === "doctor" && !loading && (
              <div className="flex flex-col gap-2">
                {flow.department && (
                  <button onClick={showAllDepartments} className="text-xs text-gray-400 underline self-start">
                    Not the right department? Show all
                  </button>
                )}

                {filteredDoctors.length === 0 && (
                  <p className="text-xs text-gray-400">
                    No doctors found in this department for that date.
                  </p>
                )}

                {filteredDoctors.map(({ doctor, bookedCount, capacity, full, nextToken }) => (
                  <button
                    key={doctor._id}
                    onClick={() => pickDoctor({ doctor, bookedCount, capacity, full, nextToken })}
                    disabled={full === true}
                    className="text-left px-3 py-2 rounded-lg text-xs border border-gray-200 hover:border-[#0F6E56] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-medium">Dr. {doctor.userId?.name || "Unknown"}</span>
                        <br />
                        <span className="text-gray-500">
                          {doctor.specialization} · NPR {doctor.consultationFee || 0}
                        </span>
                      </div>

                      {full === true && (
                        <span className="text-[10px] font-semibold bg-red-50 text-red-500 rounded-full px-2 py-1 whitespace-nowrap">
                          Full
                        </span>
                      )}
                      {full === false && (
                        <span className="text-[10px] font-semibold bg-[#E1F5EE] text-[#0F6E56] rounded-full px-2 py-1 whitespace-nowrap">
                          Available
                        </span>
                      )}
                      {full === null && (
                        <span className="text-[10px] font-semibold bg-gray-50 text-gray-400 rounded-full px-2 py-1 whitespace-nowrap">
                          Unknown
                        </span>
                      )}
                    </div>

                    {capacity !== null && (
                      <p className="text-gray-400 mt-1">
                        {bookedCount}/{capacity} booked
                        {!full && nextToken ? ` · next token #${nextToken}` : ""}
                      </p>
                    )}
                  </button>
                ))}

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
                    onClick={handleBookAndPay}
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

            {step === "awaitingPayment" && !loading && (
              <div className="flex flex-col gap-2">
                <div className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-gray-500">Amount due</p>
                  <p className="text-lg font-semibold" style={{ color: BRAND }}>
                    NPR {flow.doctor?.consultationFee || 0}
                  </p>
                </div>
                <p className="text-xs text-gray-400 text-center animate-pulse">
                  Waiting for payment to complete in the other tab…
                </p>
                <button
                  onClick={reopenPaymentTab}
                  className="text-center px-3 py-2 rounded-lg text-xs text-white"
                  style={{ background: BRAND }}
                >
                  Reopen payment tab
                </button>
                <button onClick={cancelFlow} className="text-xs text-gray-400 underline self-start">
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
              placeholder={
                step === "problem"
                  ? "e.g. I have chest pain..."
                  : step === "idle"
                  ? "Ask a question or find a doctor..."
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