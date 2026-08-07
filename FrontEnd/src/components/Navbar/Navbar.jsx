import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import {
  FaSearch,
  FaBell,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";

function PulseMark() {
  return (
    <svg
      width="32"
      height="18"
      viewBox="0 0 34 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 10 H8 L11 3 L15 17 L18 10 L21 13 L23 10 H34"
        stroke="#0E6E66"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        className="draw-pulse"
      />
    </svg>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isPatient = user?.role === "patient";

  useEffect(() => {
    function onClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.log(err);
    }

    logout();
    navigate("/signin");
  };

  return (
    <div className="bg-[#F6F8F8] font-sans">
      <style>{`
        @keyframes draw-pulse { to { stroke-dashoffset: 0; } }
        .draw-pulse {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: draw-pulse 1.1s ease-out 0.15s forwards;
        }
        .brand-font { font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; }
        .menu-panel {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.25s ease;
        }
        .menu-panel.open { max-height: 360px; }
      `}</style>

      <header className="w-full bg-white fixed top-0 z-40 border-b border-[#E1E8E7] shadow-[0_1px_2px_rgba(18,42,42,0.03)]">
        <div className="mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <PulseMark />
              <div className="leading-tight">
                <div className="brand-font text-[16px] font-semibold tracking-tight text-[#122A2A]">
                  SK Health care
                </div>
                <div className="text-[11px] text-[#5B7373]">
                  Ward &amp; Patient Console
                </div>
              </div>
            </div>

            {/* Search — desktop, patients only */}
            {isPatient && (
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg flex-1 max-w-sm transition-colors bg-[#F1F5F4] border border-[#E1E8E7]">
                <FaSearch size={13} className="text-[#5B7373]" />
                <input
                  placeholder="Search patient, MRN…"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-[#8AA0A0] text-[#122A2A]"
                />
              </div>
            )}

            {/* Right cluster */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {user ? (
                <>
                  {/* Profile */}
                  <div className="relative" ref={profileRef}>
                    <button
                      className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg transition-colors hover:bg-[#F1F5F4] focus-visible:outline-2 focus-visible:outline-[#0E6E66] focus-visible:outline-offset-2"
                      onClick={() => setProfileOpen((v) => !v)}
                    >
                      {user?.profileImage ? (
                        <img
                          src={`http://localhost:4000${user.profileImage}`}
                          alt={user.name || "Profile"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-[#0E6E66]">
                          {user?.name
                            ? user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : ""}
                        </div>
                      )}
                      <div className="hidden md:block text-left leading-tight">
                        <div className="text-sm font-medium text-[#122A2A]">
                          {user?.name}
                        </div>
                        <div className="text-[11px] text-[#5B7373]">
                          {user?.department}
                        </div>
                      </div>
                      <FaChevronDown size={11} className="text-[#5B7373]" />
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-lg py-1 bg-white shadow-lg border border-[#E1E8E7]">
                        {[
                          {
                            label: "Dashboard",
                            icon: FaUserCircle,
                            onClick: () => {
                              setProfileOpen(false);
                              navigate(
                                user?.role === "admin"
                                  ? "/admin-dashboard"
                                  : user?.role === "doctor"
                                    ? "/doctor-dashboard"
                                    : "/user-dashboard",
                              );
                            },
                          },
                          {
                            label: "Settings",
                            icon: FaCog,
                            onClick: () => setProfileOpen(false),
                          },
                          {
                            label: "Sign out",
                            icon: FaSignOutAlt,
                            onClick: handleLogout,
                          },
                        ].map(({ label, icon: Icon, onClick }) => (
                          <button
                            key={label}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors text-[#122A2A] hover:bg-[#F1F5F4]"
                            onClick={onClick}
                          >
                            <Icon size={13} className="text-[#5B7373]" />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section menu toggle — mobile only */}
                  <button
                    className="md:hidden p-2.5 rounded-lg transition-colors text-[#5B7373] hover:bg-[#F1F5F4] focus-visible:outline-2 focus-visible:outline-[#0E6E66] focus-visible:outline-offset-2"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    {menuOpen ? <FaTimes size={17} /> : <FaBars size={17} />}
                  </button>
                </>
              ) : (
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors bg-[#0E6E66] hover:bg-[#0B5B54] focus-visible:outline-2 focus-visible:outline-[#0E6E66] focus-visible:outline-offset-2"
                  onClick={() => navigate("/signin")}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section list — collapsible, shown on mobile */}
        <div
          className={`menu-panel ${menuOpen ? "open" : ""} ${
            menuOpen ? "border-t border-[#E1E8E7]" : ""
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
            {isPatient && (
              <div className="md:hidden flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-[#F1F5F4] border border-[#E1E8E7]">
                <FaSearch size={13} className="text-[#5B7373]" />
                <input
                  placeholder="Search patient, MRN…"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-[#8AA0A0] text-[#122A2A]"
                />
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
