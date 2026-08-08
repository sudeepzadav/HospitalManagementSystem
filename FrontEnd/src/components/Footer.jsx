import React from "react";
import { socialLinks } from "../constant/socialLinks";
import { FaInstagram } from "react-icons/fa";

const patientLinks = [
  { label: "Book an appointment", href: "#" },
  { label: "Find a doctor", href: "#" },
  { label: "Patient portal", href: "#" },
  { label: "Billing and insurance", href: "#" },
  { label: "Visitor guidelines", href: "#" },
];

const hospitalLinks = [
  { label: "Departments", href: "#" },
  { label: "Our specialists", href: "#" },
  { label: "Careers", href: "#" },
  { label: "News and updates", href: "#" },
  { label: "Contact us", href: "#" },
];

const legalLinks = [
  { label: "Privacy policy", href: "#" },
  { label: "Terms of use", href: "#" },
  { label: "Accessibility", href: "#" },
  { label: "Patient rights", href: "#" },
];

function LocationIcon() {
  return (
    <svg
      className="mt-0.5 shrink-0"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      className="mt-0.5 shrink-0"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.7a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.2-1.5 1.6-1.5H16.7V3.7C16.4 3.6 15.4 3.5 14.2 3.5c-2.4 0-4 1.4-4 4.1v2.3H7.5V13h2.7v8h3.3Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 3H22l-7.2 8.2L23 21h-6.6l-5.2-6.4L5 21H1.9l7.7-8.8L2 3h6.7l4.7 5.9L18.9 3Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.1 3.77-2.1 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21h-4V9Z" />
    </svg>
  );
}

export default function Footer({
  hospitalName = "Sk Healthcare",
  emergencyNumber = "(555) 011-2200",
  generalNumber = "(555) 011-2000",
  address = "4200 Ridgeway Ave, Suite 100, Millbrook",
  year = new Date().getFullYear(),
}) {
  return (
    <div className="bg-black">
      <div className="bg-[#12312B] text-white text-center text-[13px] tracking-wide py-2 px-4">
        Emergency department open 24/7 &nbsp;·&nbsp;
        <span className="text-[#8FD9BE] font-semibold">
          {" "}
          Call {emergencyNumber}{" "}
        </span>
        for ambulance dispatch
      </div>

      <footer className="bg-[#F5F8F6] border-t border-[#DDE6E2] px-5 pt-8 pb-5">
        <div className="mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr] gap-6 pb-6">
            {/* Brand */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F6E56] relative shrink-0">
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-1 bg-white" />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-3.5 bg-white" />
                </div>

                <span className="text-lg font-semibold text-[#12312B]">
                  {hospitalName}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-[#4A6B62] max-w-xs">
                Full-service hospital providing trusted healthcare, advanced
                treatments, and compassionate care since 1978.
              </p>

              <div className="flex gap-2 mt-1">
                <span className="text-[11px] font-semibold text-[#0F6E56] bg-[#E1F5EE] rounded px-2 py-1">
                  JCI Accredited
                </span>

                <span className="text-[11px] font-semibold text-[#0F6E56] bg-[#E1F5EE] rounded px-2 py-1">
                  ISO 9001
                </span>
              </div>
            </div>

            {/* Patients */}
            <div>
              <h4 className="text-xs uppercase font-semibold text-[#4A6B62] mb-3">
                Patients
              </h4>

              <ul className="space-y-1.5 text-sm text-[#12312B]">
                {patientLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-[#0F6E56]">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hospital */}
            <div>
              <h4 className="text-xs uppercase font-semibold text-[#4A6B62] mb-3">
                Hospital
              </h4>

              <ul className="space-y-1.5 text-sm text-[#12312B]">
                {hospitalLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-[#0F6E56]">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs uppercase font-semibold text-[#4A6B62] mb-3">
                Contact
              </h4>

              <div className="flex gap-2 text-sm text-[#4A6B62] mb-2">
                <LocationIcon />
                <span>{address}</span>
              </div>

              <div className="flex gap-2 text-sm text-[#4A6B62] mb-3">
                <PhoneIcon />
                <span>{generalNumber}</span>
              </div>

              <div className="bg-[#FBEAE6] border border-[#F0C9BE] rounded-lg px-3 py-2">
                <p className="text-xs text-[#B3341C]">Emergency</p>

                <p className="font-bold text-[#B3341C]">{emergencyNumber}</p>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-[#DDE6E2] pt-4 flex flex-wrap justify-between items-center gap-3">
            <p className="text-xs text-[#4A6B62]">
              © {year} {hospitalName}. All rights reserved.
            </p>

            <div className="flex gap-4">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs text-[#4A6B62] hover:text-[#0F6E56]"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-8 h-8 rounded-full border border-[#DDE6E2] flex items-center justify-center text-[#4A6B62] hover:text-[#0F6E56] hover:border-[#0F6E56]"
                >
                  {social.icon === "facebook" && <FacebookIcon />}
                  {social.icon === "twitter" && <XIcon />}
                  {social.icon === "linkedin" && <LinkedInIcon />}
                  {social.icon === "instagram" && <FaInstagram />}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
