import React, { useState } from "react";
import { departments } from "../constant/departments";

const Appointment = () => {
  const [dept, setDept] = useState("");
  const [date, setDate] = useState("");

  function handleSearch(e) {
    e.preventDefault();

    console.log("Searching appointment:", {
      department: dept,
      date: date,
    });
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

          <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A6B62] mb-1.5">
            Department
          </label>

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


          <label className="block text-xs font-semibold uppercase tracking-wide text-[#4A6B62] mb-1.5">
            Preferred date
          </label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mb-5 rounded-lg border border-[#DDE6E2] bg-white px-3.5 py-2.5 text-sm"
          />


          <button
            type="submit"
            className="w-full bg-[#0F6E56] text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-[#0C5744]"
          >
            Search availability
          </button>

        </form>
      </section>
    </div>
  );
};

export default Appointment;