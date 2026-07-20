import React, { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Star,
  GraduationCap,
  Languages as LanguagesIcon,
} from "lucide-react";
import { doctors } from "../constant/doctors";

const initials = (name) =>
  name
    .replace("Dr. ", "")
    .split(" ")
    .map((n) => n[0])
    .join("");

const Doctors = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const specialties = useMemo(
    () => ["All", ...new Set(doctors.map((d) => d.role))],
    [],
  );

  const featured = doctors.find((d) => d.featured);
  const visible = doctors.filter(
    (d) => !d.featured && (activeFilter === "All" || d.role === activeFilter),
  );

  const avgExperience = Math.round(
    doctors.reduce((sum, d) => sum + d.experienceYears, 0) / doctors.length,
  );

  return (
    <div>
      {/* Doctors */}
      <section id="doctors" className="mx-auto px-6 py-16 mt-5">
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
          <span className="w-1 h-1 rounded-full bg-[#DDE6E2] hidden sm:block" />
          <span>
            <strong className="text-[#0C5744] font-semibold">4.8</strong>{" "}
            average patient rating
          </span>
        </div>

        {/* Specialty filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {specialties.map((s) => (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F6E56] ${
                activeFilter === s
                  ? "bg-[#0F6E56] text-white"
                  : "bg-[#E1F5EE] text-[#0C5744] hover:bg-[#cdeee2]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Doctor cards */}
          {visible.map((d) => (
            <a
              href="#"
              key={d.name}
              className="group border border-[#DDE6E2] rounded-2xl p-6 bg-white transition-all duration-200 hover:border-[#0F6E56] hover:shadow-[0_8px_24px_-12px_rgba(15,110,86,0.25)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F6E56]"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="flex items-center gap-1 text-xs font-medium text-[#0C5744]">
                  <Star size={13} className="fill-current text-[#F0C46A]" />
                  {d.rating}
                </span>
              </div>

              <h3 className="text-base font-semibold mb-0.5">{d.name}</h3>
              <p className="text-sm text-[#0F6E56] font-medium mb-2">
                {d.role}
              </p>
              <p className="text-sm text-[#4A6B62] leading-relaxed mb-4">
                {d.bio}
              </p>

              <div className="flex items-center justify-between text-xs text-[#4A6B62] pt-3 border-t border-[#EEF3F1]">
                <span>{d.years}</span>
                <span className="flex items-center gap-1">
                  <LanguagesIcon size={13} />
                  {d.languages.join(", ")}
                </span>
              </div>
            </a>
          ))}

          {visible.length === 0 && (
            <p className="col-span-full text-sm text-[#4A6B62] py-8 text-center">
              No doctors found in this specialty right now.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Doctors;
