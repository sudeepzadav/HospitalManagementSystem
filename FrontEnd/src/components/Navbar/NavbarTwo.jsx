import React from "react";
import { navLinks } from "../../constant/navlinks";
import { useNavigate } from "react-router-dom";

const NavbarTwo = () => {
  const navigate = useNavigate();
  return (
    <header className="border-b border-[#DDE6E2] bg-white sticky top-18 z-20">
      <div className="mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left Side - Navigation Links */}
        <nav className="flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className="text-[#12312B] hover:text-[#0F6E56] transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right Side - Book Appointment Button */}
        <button
          onClick={()=> navigate("/appointment")}
          className="bg-[#0F6E56] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0C5744] transition-colors"
        >
          Book an Appointment
        </button>
      </div>
    </header>
  );
};

export default NavbarTwo;
