import React from "react";
import { navLinks } from "../../constant/navlinks";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NavbarTwo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  function handleBookClick() {
    if (!user) {
      navigate("/signin", { state: { from: "/appointment" } });
      return;
    }
    navigate("/appointment");
  }

  return (
    <header className="border-b border-[#DDE6E2] bg-white sticky top-18 z-20 mb-10">
      <div className="mx-auto px-6 py-4 flex items-center justify-between">
        <nav className="flex items-center gap-8 text-sm font-medium">
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

        <button
          onClick={handleBookClick}
          className="bg-[#0F6E56] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0C5744] transition-colors"
        >
          {user ? "Book an Appointment" : "Login to Book Appointment"}
        </button>
      </div>
    </header>
  );
};

export default NavbarTwo;