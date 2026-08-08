import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Users } from "lucide-react";
import { departments } from "../constant/departments";

const Departments = () => {
  const navigate = useNavigate();
  const featured = departments.find((d) => d.featured);
  const rest = departments.filter((d) => !d.featured);

  const goToDoctors = (deptName) => {
    navigate(`/doctors?department=${encodeURIComponent(deptName)}`);
  };

  return (
    <div>
      {/* Departments */}
      <section id="departments" className="mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-9">
          <div>
            <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-[#0F6E56] mb-2">
              Care areas
            </span>
            <h2 className="font-serif text-3xl sm:text-[2.25rem] leading-tight tracking-tight mb-2">
              Departments
            </h2>
            <p className="text-sm text-[#4A6B62] max-w-md">
              Specialized care across every stage of life, backed by
              specialists who know your history.
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
              {departments.length}
            </strong>{" "}
            departments
          </span>
          <span className="w-1 h-1 rounded-full bg-[#DDE6E2] hidden sm:block" />
          <span>
            <strong className="text-[#0C5744] font-semibold">
              {departments.reduce((sum, d) => sum + (d.specialists || 0), 0)}+
            </strong>{" "}
            specialists on staff
          </span>
          <span className="w-1 h-1 rounded-full bg-[#DDE6E2] hidden sm:block" />
          <span>
            <strong className="text-[#0C5744] font-semibold">24/7</strong>{" "}
            emergency response
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Featured department — spans two columns on larger screens */}
          {featured && (
            <button
              type="button"
              onClick={() => goToDoctors(featured.name)}
              className="group relative sm:col-span-2 rounded-2xl p-7 overflow-hidden bg-[#0C5744] text-white transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F6E56] text-left"
            >
              {/* decorative icon pattern */}
              <featured.icon
                size={180}
                strokeWidth={1}
                className="absolute -right-6 -bottom-8 text-white/10 rotate-12"
              />
              <div className="relative flex flex-col h-full justify-between gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <featured.icon size={20} />
                    </span>
                    <span className="text-xs font-semibold tracking-widest uppercase text-[#8FD6BE]">
                      {featured.availability}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {featured.name}
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed max-w-md">
                    {featured.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5 text-sm text-white/85">
                    <span className="flex items-center gap-1.5">
                      <Users size={15} />
                      {featured.specialists} specialists
                    </span>
                    {featured.stat && (
                      <span>
                        {featured.stat.value}{" "}
                        <span className="text-white/60">
                          {featured.stat.label}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-1.5 transition-all">
                    Explore
                    <ArrowUpRight size={15} />
                  </span>
                </div>
              </div>
            </button>
          )}

          {/* Standard department cards */}
          {rest.map((d) => (
            <button
              type="button"
              key={d.name}
              onClick={() => goToDoctors(d.name)}
              className="group border border-[#DDE6E2] rounded-2xl p-6 bg-white transition-all duration-200 hover:border-[#0F6E56] hover:shadow-[0_8px_24px_-12px_rgba(15,110,86,0.25)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F6E56] text-left w-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#E1F5EE] flex items-center justify-center">
                  <d.icon size={20} className="text-[#0F6E56]" />
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-[#0F6E56] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                />
              </div>

              <h3 className="text-base font-semibold mb-1.5">{d.name}</h3>
              <p className="text-sm text-[#4A6B62] leading-relaxed mb-4">
                {d.desc}
              </p>

              <div className="flex items-center justify-between text-xs text-[#4A6B62] pt-3 border-t border-[#EEF3F1]">
                <span className="flex items-center gap-1">
                  <Users size={13} />
                  {d.specialists} specialists
                </span>
                <span className="font-medium text-[#0C5744]">
                  {d.availability}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Departments;