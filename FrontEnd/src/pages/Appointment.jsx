import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { departments } from "../constant/departments";
import api from "../api/axios";

const Appointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDoctorId = searchParams.get("doctorId");

  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [reason, setReason] = useState("");

  const [dept, setDept] = useState("");
  const [date, setDate] = useState("");

  // The doctor clicked from a doctor card (via ?doctorId=...), if any.
  // Once set, this doctor is the ONLY one ever checked/booked — never
  // substituted for someone else in the same department.
  const [preselectedDoctor, setPreselectedDoctor] = useState(null);
  const [loadingPreselected, setLoadingPreselected] = useState(!!preselectedDoctorId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState([]); // [{ doctor, bookedCount, capacity, full, nextToken }]

  useEffect(() => {
    if (!preselectedDoctorId) return;

    let cancelled = false;
    async function loadPreselectedDoctor() {
      setLoadingPreselected(true);
      try {
        const res = await api.get("/doctors");
        const doctor = (res.data || []).find((d) => d._id === preselectedDoctorId);
        if (!cancelled) {
          if (doctor) {
            setPreselectedDoctor(doctor);
            setDept(doctor.department); // keep in sync even though the field is now locked
          } else {
            setError("That doctor couldn't be found — please search below instead.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError("Couldn't load that doctor — please search below instead.");
        }
      } finally {
        if (!cancelled) setLoadingPreselected(false);
      }
    }

    loadPreselectedDoctor();
    return () => {
      cancelled = true;
    };
  }, [preselectedDoctorId]);

  async function handleSearch(e) {
    e.preventDefault();

    if (!patientName.trim() || !patientAge || !patientGender) {
      setError("Please enter the patient's name, age, and gender.");
      return;
    }

    if (Number(patientAge) <= 0 || Number(patientAge) > 120) {
      setError("Please enter a valid age.");
      return;
    }

    if (!dept || !date) {
      setError("Please select both a department and a date.");
      return;
    }

    setError("");
    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      // If a doctor was pre-selected from their profile card, only ever
      // check THEIR availability — never fall back to the full department
      // list, even though we still know `dept` for display purposes.
      let doctorsToCheck;
      if (preselectedDoctor) {
        doctorsToCheck = [preselectedDoctor];
      } else {
        const doctorsRes = await api.get("/doctors");
        doctorsToCheck = (doctorsRes.data || []).filter((d) => d.department === dept);
      }

      if (doctorsToCheck.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const statusResults = await Promise.all(
        doctorsToCheck.map(async (doctor) => {
          try {
            const statusRes = await api.get("/appointments/queue-status", {
              params: { doctorId: doctor._id, date },
            });
            return { doctor, ...statusRes.data };
          } catch (err) {
            // If status check fails for a specific doctor, show them as unknown
            // rather than dropping the whole search
            return { doctor, bookedCount: null, capacity: null, full: null, nextToken: null };
          }
        })
      );

      setResults(statusResults);
    } catch (err) {
      setError("Sorry, we couldn't load availability right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleBook(doctor) {
    const booking = {
      patient: {
        name: patientName.trim(),
        age: Number(patientAge),
        gender: patientGender,
      },
      doctorId: doctor._id,
      doctorName: doctor.userId?.name || "Unknown",
      specialization: doctor.specialization,
      department: dept,
      date,
      reason: reason.trim(),
      consultationFee: doctor.consultationFee || 0,
    };

    localStorage.setItem("pendingBooking", JSON.stringify(booking));
    navigate("/appointment/payment");
  }

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto mt-20 px-6 pt-16 pb-14 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <span className="inline-block text-[11px] font-semibold tracking-wide text-[#0F6E56] bg-[#E1F5EE] rounded-[5px] px-2.5 py-1.5 mb-5">
            Now accepting new patients
          </span>

          <h1 className="text-[40px] sm:text-[48px] leading-[1.1] font-semibold tracking-tight mb-5">
            Care that meets you where you are.
          </h1>

          <p className="text-base leading-relaxed text-[#4A6B62] max-w-md mb-8">
            Cedar Grove Health connects you to 40+ specialties, same-week
            appointments, and a care team that keeps your full history in one
            place.
          </p>

          <div className="flex items-center gap-6">
            <a
              href="#book"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-[#0F6E56] text-white rounded-lg px-5 py-3 hover:bg-[#0C5744]"
            >
              Find a doctor
            </a>

            <a
              href="#"
              className="text-sm font-semibold text-[#12312B] hover:text-[#0F6E56]"
            >
              Explore patient portal
            </a>
          </div>
        </div>

        {/* Appointment Form */}
        <form
          id="book"
          onSubmit={handleSearch}
          className="bg-[#F5F8F6] border border-[#DDE6E2] rounded-2xl p-6 sm:p-7"
        >
          <h2 className="text-base font-semibold mb-1">
            Check appointment availability
          </h2>

          <p className="text-sm text-[#4A6B62] mb-5">
            See open slots before you call.
          </p>

          {preselectedDoctor && (
            <div className="flex items-center gap-2 bg-[#E1F5EE] border border-[#0F6E56]/20 rounded-lg px-3.5 py-2.5 mb-5">
              <span className="text-xs font-semibold text-[#0F6E56]">
                Booking with Dr. {preselectedDoctor.userId?.name || "Unknown"} ·{" "}
                {preselectedDoctor.specialization}
              </span>
            </div>
          )}

          {loadingPreselected && (
            <p className="text-xs text-[#4A6B62] mb-4">Loading doctor…</p>
          )}

          <p className="text-xs font-semibold uppercase tracking-wide text-[#4A6B62] mb-2">
            Who is this appointment for?
          </p>

          <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A6B62] mb-1.5">
            Patient name
          </label>

          <input
            type="text"
            placeholder="e.g. Sita Sharma"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full mb-4 rounded-lg border border-[#DDE6E2] bg-white px-3.5 py-2.5 text-sm"
          />

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A6B62] mb-1.5">
                Age
              </label>

              <input
                type="number"
                min="0"
                max="120"
                placeholder="Age"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="w-full rounded-lg border border-[#DDE6E2] bg-white px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A6B62] mb-1.5">
                Gender
              </label>

              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full rounded-lg border border-[#DDE6E2] bg-white px-3.5 py-2.5 text-sm"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A6B62] mb-1.5">
            Problem / reason for visit
          </label>

          <textarea
            rows={2}
            placeholder="e.g. Persistent cough for a week"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mb-4 rounded-lg border border-[#DDE6E2] bg-white px-3.5 py-2.5 text-sm resize-none"
          />

          <div className="h-px bg-[#DDE6E2] mb-4" />

          <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A6B62] mb-1.5">
            Department
          </label>

          {preselectedDoctor ? (
            // Locked once a specific doctor was chosen from their card —
            // changing department here would no longer make sense, since
            // it's this doctor's department, not a filter to search by.
            <div className="w-full mb-4 rounded-lg border border-[#DDE6E2] bg-[#F0F3F2] px-3.5 py-2.5 text-sm text-[#4A6B62]">
              {dept} <span className="text-xs">(set by selected doctor)</span>
            </div>
          ) : (
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full mb-4 rounded-lg border border-[#DDE6E2] bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="">Select a department</option>

              {departments.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A6B62] mb-1.5">
            Preferred date
          </label>

          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mb-5 rounded-lg border border-[#DDE6E2] bg-white px-3.5 py-2.5 text-sm"
          />

          {error && (
            <p className="text-xs text-red-500 mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || loadingPreselected}
            className="w-full bg-[#0F6E56] text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-[#0C5744] disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search availability"}
          </button>
        </form>
      </section>

      {/* Results */}
      {searched && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="text-xl font-semibold mb-4">
            {preselectedDoctor
              ? `Availability for Dr. ${preselectedDoctor.userId?.name || "Unknown"} on `
              : `Availability in ${dept} on `}
            {new Date(date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>

          <p className="text-sm text-[#4A6B62] mb-4">
            Booking for <span className="font-semibold">{patientName}</span>{" "}
            ({patientAge}, {patientGender})
          </p>

          {loading && (
            <p className="text-sm text-[#4A6B62]">Checking availability…</p>
          )}

          {!loading && results.length === 0 && (
            <p className="text-sm text-[#4A6B62]">
              {preselectedDoctor
                ? "This doctor's availability couldn't be checked. Please try another date."
                : "No doctors found in this department. Try another department or date."}
            </p>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(({ doctor, bookedCount, capacity, full, nextToken }) => (
                <div
                  key={doctor._id}
                  className="border border-[#DDE6E2] rounded-xl p-4 bg-white flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        Dr. {doctor.userId?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-[#4A6B62]">
                        {doctor.specialization}
                      </p>
                    </div>

                    {full === true && (
                      <span className="text-[10px] font-semibold bg-red-50 text-red-500 rounded-full px-2 py-1">
                        Full
                      </span>
                    )}
                    {full === false && (
                      <span className="text-[10px] font-semibold bg-[#E1F5EE] text-[#0F6E56] rounded-full px-2 py-1">
                        Available
                      </span>
                    )}
                    {full === null && (
                      <span className="text-[10px] font-semibold bg-gray-50 text-gray-400 rounded-full px-2 py-1">
                        Unknown
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#4A6B62]">
                    Consultation fee: NPR {doctor.consultationFee || 0}
                  </p>

                  {capacity !== null && (
                    <p className="text-xs text-[#4A6B62]">
                      {bookedCount}/{capacity} booked
                      {!full && nextToken ? ` · next token #${nextToken}` : ""}
                    </p>
                  )}

                  <button
                    onClick={() => handleBook(doctor)}
                    disabled={full === true}
                    className="w-full mt-1 bg-[#0F6E56] text-white rounded-lg px-3 py-2 text-xs font-semibold hover:bg-[#0C5744] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {full === true ? "Fully booked" : "Book this doctor"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Appointment;