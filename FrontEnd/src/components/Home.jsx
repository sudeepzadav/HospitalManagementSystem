import React, { useState } from "react";
import { departments } from "../constant/departments";
import { doctors } from "../constant/doctors";
import { stats } from "../constant/stats";
import heroSection from "../assets/image/heroSection.jpg";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [dept, setDept] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    console.log("Searching availability for", { dept, date });
  }

  return (
    <div className="bg-white text-[#12312B] mt-20">
      <div className="relative m-5">
        <img
          src={heroSection}
          alt="Hospital"
          className="w-full h-125 object-cover rounded-2xl"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-blue-900/40 rounded-2xl"></div>

        {/* Text */}
        <div className="absolute top-1/2 left-10 transform -translate-y-1/2 text-white max-w-xl">
          <h1 className="text-5xl font-bold leading-tight">
            Your Health, Our Priority
          </h1>

          <p className="text-xl mt-4">
            Providing compassionate care with advanced medical technology and
            expert doctors.
          </p>

          <button
          onClick={()=> navigate("/appointment")}
           className="mt-6 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-100">
            Book an Appointment
          </button>
        </div>
      </div>

      {/* Doctors */}
      <section id="doctors" className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-9">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              Our specialists
            </h2>
            <p className="text-sm text-[#4A6B62]">
              Meet a few of the physicians on our team.
            </p>
          </div>
          <button
            onClick={() => navigate("/doctors")}
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#0F6E56] hover:text-[#0C5744] cursor-pointer"
          >
            View all doctors
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {doctors.map((doc) => (
            <div
              key={doc.name}
              className="border border-[#DDE6E2] rounded-2xl p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#E1F5EE] mx-auto mb-4 flex items-center justify-center text-[#0F6E56] font-semibold text-lg">
                {doc.name.split(" ").slice(-1)[0][0]}
              </div>
              <h3 className="text-sm font-semibold mb-0.5">{doc.name}</h3>
              <p className="text-sm text-[#0F6E56] mb-0.5">{doc.role}</p>
              <p className="text-xs text-[#4A6B62]">{doc.years}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
