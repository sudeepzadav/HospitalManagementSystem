import React, { useEffect, useState } from "react";
import { departments } from "../constant/departments";
import { stats } from "../constant/stats";
import heroSection from "../assets/image/heroSection.jpg";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

export default function Home() {
  const [dept, setDept] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      setLoadingDoctors(true);
      setDoctorsError("");
      try {
        const res = await api.get("/doctors");
        if (!cancelled) setDoctors(res.data || []);
      } catch (err) {
        if (!cancelled) {
          setDoctorsError("Couldn't load doctors right now.");
        }
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    }

    loadDoctors();
    return () => {
      cancelled = true;
    };
  }, []);

  
  const featuredDoctors = doctors.slice(0, 4);

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
            onClick={() => navigate("/appointment")}
            className="mt-6 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-100"
          >
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

        {loadingDoctors && (
          <p className="text-sm text-[#4A6B62] py-8 text-center">
            Loading doctors…
          </p>
        )}

        {!loadingDoctors && doctorsError && (
          <p className="text-sm text-red-500 py-8 text-center">
            {doctorsError}
          </p>
        )}

        {!loadingDoctors && !doctorsError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredDoctors.map((doc) => {
              const name = doc.userId?.name || "Unknown";
              return (
                <div
                  key={doc._id}
                  className="border border-[#DDE6E2] rounded-2xl p-6 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-[#E1F5EE] mx-auto mb-4 flex items-center justify-center overflow-hidden text-[#0F6E56] font-semibold text-lg">
                    {doc.userId?.profileImage ? (
                      <img
                        src={`${API_ROOT}${doc.userId.profileImage}`}
                        alt={`Dr. ${name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {name.split(" ").slice(-1)[0][0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold mb-0.5">Dr. {name}</h3>
                  <p className="text-sm text-[#0F6E56] mb-0.5">
                    {doc.specialization}
                  </p>
                  <p className="text-xs text-[#4A6B62] mb-4">
                    {doc.experience || 0} yrs experience
                  </p>

                  <button
                    onClick={() => navigate(`/appointment?doctorId=${doc._id}`)}
                    className="w-full text-sm font-semibold text-white rounded-lg px-3 py-2 bg-[#0F6E56] hover:bg-[#0C5744] transition-colors"
                  >
                    Book appointment
                  </button>
                </div>
              );
            })}

            {featuredDoctors.length === 0 && (
              <p className="col-span-full text-sm text-[#4A6B62] py-8 text-center">
                No doctors listed yet.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}