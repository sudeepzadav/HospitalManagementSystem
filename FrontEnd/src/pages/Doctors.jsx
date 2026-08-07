import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Star, GraduationCap, Clock, CalendarPlus } from "lucide-react";
import api from "../api/axios";


const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const DAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const formatAvailability = (availability) => {
  if (!availability?.length) return "";

  const valid = availability.filter((slot) => slot?.day);

  const sorted = [...valid].sort((a, b) => {
    const ai = DAY_ORDER.indexOf(a.day);
    const bi = DAY_ORDER.indexOf(b.day);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const groups = [];
  for (const slot of sorted) {
    const last = groups[groups.length - 1];
    const sameHours =
      last && last.startTime === slot.startTime && last.endTime === slot.endTime;
    const consecutiveDay =
      last &&
      DAY_ORDER.indexOf(slot.day) === DAY_ORDER.indexOf(last.days[last.days.length - 1]) + 1;

    if (sameHours && consecutiveDay) {
      last.days.push(slot.day);
    } else {
      groups.push({ days: [slot.day], startTime: slot.startTime, endTime: slot.endTime });
    }
  }

  return groups
    .map((g) => {
      const short = (d) => d.slice(0, 3);
      const dayText =
        g.days.length > 1
          ? `${short(g.days[0])}–${short(g.days[g.days.length - 1])}`
          : g.days[0];
      return g.startTime && g.endTime
        ? `${dayText}, ${g.startTime}–${g.endTime}`
        : dayText;
    })
    .join(" · ");
};

const Doctors = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("department") || "All"
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/doctors");
        if (!cancelled) setDoctors(res.data || []);
      } catch (err) {
        if (!cancelled) {
          setError("Couldn't load doctors right now. Please try again in a moment.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDoctors();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the filter in sync if the department in the URL changes
  // (e.g. clicking a different department card while already on this page).
  useEffect(() => {
    const fromUrl = searchParams.get("department");
    setActiveFilter(fromUrl || "All");
  }, [searchParams]);

  const departments = useMemo(
    () => ["All", ...new Set(doctors.map((d) => d.department).filter(Boolean))],
    [doctors]
  );

  const handleFilterClick = (dept) => {
    setActiveFilter(dept);
    if (dept === "All") {
      searchParams.delete("department");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ department: dept }, { replace: true });
    }
  };

  const visible = useMemo(
    () =>
      doctors.filter(
        (d) => activeFilter === "All" || d.department === activeFilter
      ),
    [doctors, activeFilter]
  );

  const avgExperience = doctors.length
    ? Math.round(
        doctors.reduce((sum, d) => sum + (d.experience || 0), 0) / doctors.length
      )
    : 0;


  const ratedDoctors = doctors.filter((d) => d.rating > 0);
  const avgRating = ratedDoctors.length
    ? (ratedDoctors.reduce((sum, d) => sum + d.rating, 0) / ratedDoctors.length).toFixed(1)
    : null;

  return (
    <div>
      {/* Doctors */}
      <section id="doctors" className="mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-9">
          <div>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0F6E56] mb-2">
              Our team
            </span>
            <h2 className="font-serif text-3xl sm:text-[2.25rem] leading-tight tracking-tight mb-2">
              Meet Our Doctors
            </h2>
            <p className="text-sm text-[#4A6B62] max-w-md">
              Experienced specialists dedicated to attentive, personal care.
            </p>
          </div>
          <a
            href="#"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#0F6E56] hover:text-[#0C5744] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F6E56]"
          >
            View all
            <ArrowUpRight size={15} />
          </a>
        </div>

        {/* Quick stats strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#4A6B62] border-y border-[#DDE6E2] py-3.5 mb-8">
          <span>
            <strong className="text-[#0C5744] font-semibold">
              {doctors.length}
            </strong>{" "}
            specialists
          </span>
          <span className="w-1 h-1 rounded-full bg-[#DDE6E2] hidden sm:block" />
          <span>
            <strong className="text-[#0C5744] font-semibold">
              {avgExperience} yrs
            </strong>{" "}
            average experience
          </span>
          {avgRating && (
            <>
              <span className="w-1 h-1 rounded-full bg-[#DDE6E2] hidden sm:block" />
              <span>
                <strong className="text-[#0C5744] font-semibold">{avgRating}</strong>{" "}
                average patient rating
              </span>
            </>
          )}
        </div>

        {/* Specialty filter chips */}
        {departments.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => handleFilterClick(dept)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F6E56] ${
                  activeFilter === dept
                    ? "bg-[#0F6E56] text-white"
                    : "bg-[#E1F5EE] text-[#0C5744] hover:bg-[#cdeee2]"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="text-sm text-[#4A6B62] py-8 text-center">Loading doctors…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-500 py-8 text-center">{error}</p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((d) => (
              <a
                href="#"
                key={d._id}
                className="group border border-[#DDE6E2] rounded-2xl p-6 bg-white transition-all duration-200 hover:border-[#0F6E56] hover:shadow-[0_8px_24px_-12px_rgba(15,110,86,0.25)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F6E56]"
              >
                <div className="flex items-start justify-between mb-4">
                  {d.userId?.profileImage ? (
                    <img
                      src={`${API_ROOT}${d.userId.profileImage}`}
                      alt={`Dr. ${d.userId?.name || ""}`}
                      className="w-12 h-12 rounded-full object-cover border border-[#DDE6E2]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#E1F5EE] flex items-center justify-center text-[#0F6E56] font-semibold text-sm">
                      {(d.userId?.name || "?").split(" ").slice(-1)[0][0]}
                    </div>
                  )}
                  {d.rating > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-[#0C5744]">
                      <Star size={13} className="fill-current text-[#F0C46A]" />
                      {d.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold mb-0.5">
                  Dr. {d.userId?.name || "Unknown"}
                </h3>
                <p className="text-sm text-[#0F6E56] font-medium mb-2">
                  {d.specialization}
                </p>

                {d.qualification?.length > 0 && (
                  <p className="flex items-center gap-1 text-xs text-[#4A6B62] mb-3">
                    <GraduationCap size={13} />
                    {d.qualification.join(", ")}
                  </p>
                )}

                {d.availability?.length > 0 && (
                  <div className="flex items-start gap-1 text-xs text-[#4A6B62] mb-4">
                    <Clock size={13} className="mt-0.5 shrink-0" />
                    <span>{formatAvailability(d.availability)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[#4A6B62] pt-3 border-t border-[#EEF3F1] mb-4">
                  <span>{d.experience || 0} yrs experience</span>
                  <span>NPR {d.consultationFee || 0}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/appointment?doctorId=${d._id}`);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-white rounded-lg px-3 py-2 bg-[#0F6E56] hover:bg-[#0C5744] transition-colors"
                >
                  <CalendarPlus size={14} />
                  Book appointment
                </button>
              </a>
            ))}

            {visible.length === 0 && (
              <p className="col-span-full text-sm text-[#4A6B62] py-8 text-center">
                No doctors found in this department right now.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Doctors;