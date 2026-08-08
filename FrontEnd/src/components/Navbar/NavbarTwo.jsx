import React, { useState } from "react";
import { navLinks } from "../../constant/navlinks";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NavbarTwo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleBookClick() {
    setMenuOpen(false);
    if (!user) {
      navigate("/signin", { state: { from: "/appointment" } });
      return;
    }
    navigate("/appointment");
  }

  return (
    <header className="border-b border-[#DDE6E2] bg-white sticky top-18 z-20 mb-10">
      <div className="mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              to={link.href}
              className="text-[#12312B] hover:text-[#0F6E56] transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="md:hidden relative w-8 h-8 flex flex-col justify-center items-center gap-1.25"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span
            className={`block h-0.5 w-6 bg-[#12312B] rounded-full transition-all duration-300 ${
              menuOpen ? "rotate-45 translate-y-[6.5px]" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-[#12312B] rounded-full transition-all duration-300 ${
              menuOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-[#12312B] rounded-full transition-all duration-300 ${
              menuOpen ? "-rotate-45 translate-y-[6.5px]" : ""
            }`}
          />
        </button>

        <button
          onClick={handleBookClick}
          className="bg-[#0F6E56] text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#0C5744] transition-colors"
        >
          <span className="sm:hidden">Book</span>
          <span className="hidden sm:inline">
            {user ? "Book an Appointment" : "Login to Book Appointment"}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      <nav
        className={`md:hidden flex flex-col gap-1 px-4 text-sm font-medium border-t border-[#DDE6E2] overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-96 pt-3 pb-4 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {navLinks.map((link) => (
          <Link
            key={link.id}
            to={link.href}
            onClick={() => setMenuOpen(false)}
            className="text-[#12312B] hover:text-[#0F6E56] hover:bg-[#F5F8F6] transition-colors py-2 px-2 rounded-md"
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default NavbarTwo;