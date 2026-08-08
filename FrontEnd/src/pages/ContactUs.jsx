import React, { useState } from "react";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log(form);
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <section className="bg-[#F5F8F6]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');

        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }

        .pulse-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2.4s ease-out forwards;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-path { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Hero */}
      <div className="relative overflow-hidden bg-[#0F6E56]">
        <svg
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-20"
          viewBox="0 0 1200 120"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            className="pulse-path"
            d="M0,60 L280,60 L310,20 L340,100 L370,40 L400,60 L1200,60"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <span className="font-body text-[#BFE3D6] text-xs sm:text-sm font-semibold uppercase tracking-[0.2em]">
            SK Health Care · Ward & Patient Console
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mt-4 leading-tight">
            We're here when you need us
          </h1>
          <p className="font-body text-[#D7EDE4] text-sm sm:text-base max-w-xl mx-auto mt-4">
            Reach our team for appointments, records, or general questions —
            or find us in person at Durbar Marg, Kathmandu.
          </p>

          <div className="inline-flex items-center gap-2 bg-[#E8871E] text-white font-body text-xs sm:text-sm font-semibold px-4 py-2 rounded-full mt-7">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Emergency line: +977 1-4123911 — available 24/7
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Left: form (2/5) */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-white rounded-2xl border border-[#DDE6E2] shadow-sm p-6 sm:p-7">
              <h3 className="font-display text-lg sm:text-xl font-semibold text-[#12312B] mb-1">
                Send a message
              </h3>
              <p className="font-body text-xs text-[#4A6B62] mb-5">
                We typically reply within one business day.
              </p>

              {submitted && (
                <p className="font-body text-sm text-[#0F6E56] bg-[#F5F8F6] border border-[#DDE6E2] rounded-lg px-4 py-3 mb-4">
                  Message sent — we'll get back to you soon.
                </p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                  className="font-body w-full border border-[#DDE6E2] rounded-lg px-4 py-2.5 text-sm text-[#12312B] placeholder:text-[#8FA69E] focus:outline-none focus:ring-2 focus:ring-[#0F6E56] focus:border-transparent transition"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  required
                  className="font-body w-full border border-[#DDE6E2] rounded-lg px-4 py-2.5 text-sm text-[#12312B] placeholder:text-[#8FA69E] focus:outline-none focus:ring-2 focus:ring-[#0F6E56] focus:border-transparent transition"
                />
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  required
                  rows={4}
                  className="font-body w-full border border-[#DDE6E2] rounded-lg px-4 py-2.5 text-sm text-[#12312B] placeholder:text-[#8FA69E] resize-none focus:outline-none focus:ring-2 focus:ring-[#0F6E56] focus:border-transparent transition"
                />
                <button
                  type="submit"
                  className="group font-body inline-flex items-center justify-center gap-2 bg-[#0F6E56] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0C5744] transition-colors"
                >
                  Send message
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </form>
            </div>
          </div>

          {/* Right: map (3/5) */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="relative rounded-2xl overflow-hidden border border-[#DDE6E2] shadow-sm h-80 sm:h-96 lg:h-full min-h-105">
              <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur px-3.5 py-2 rounded-lg shadow-sm border border-[#DDE6E2] flex items-center gap-2">
                <MapPin size={14} className="text-[#0F6E56]" />
                <span className="font-body text-xs font-semibold text-[#12312B]">
                  Durbar Marg, Kathmandu
                </span>
              </div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1761.1175978319332!2d85.31819559782511!3d27.713076880210807!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1903f0d104e7%3A0x14f31a702063a23b!2sP869%2BR9M%2C%20Durbar%20Marg%2C%20Kathmandu%2044600!5e0!3m2!1sen!2snp!4v1786211153968!5m2!1sen!2snp"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="SK Health Care Location"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;