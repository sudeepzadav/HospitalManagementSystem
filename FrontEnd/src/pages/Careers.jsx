import React, { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaBriefcase, FaTimes, FaCheckCircle, FaMoneyBillWave } from "react-icons/fa";
import api from "../api/axios";

const INK = "#122A2A";
const MUTED = "#5B7373";
const BORDER = "#E1E8E7";
const SURFACE = "#F6F8F8";
const BRAND = "#0E6E66";
const BRAND_SOFT = "#E4F1EF";
const DANGER = "#D64545";

const EMPLOYMENT_LABEL = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

function ApplyModal({ job, onClose }) {
  const [form, setForm] = useState({ applicantName: "", email: "", phone: "", coverLetter: "" });
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setError("Please upload a PDF or Word document.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Resume must be under 5MB.");
      return;
    }
    setError("");
    setResume(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.applicantName.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please fill in your name, email, and phone.");
      return;
    }
    if (!resume) {
      setError("Please attach your resume.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("applicantName", form.applicantName.trim());
      formData.append("email", form.email.trim());
      formData.append("phone", form.phone.trim());
      formData.append("coverLetter", form.coverLetter.trim());
      formData.append("resume", resume);

      await api.post(`/jobs/${job._id}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: BORDER }}>
          <div>
            <h3 className="font-semibold" style={{ color: INK }}>
              Apply — {job.title}
            </h3>
            <p className="text-xs" style={{ color: MUTED }}>
              {job.department}
              {job.salaryRange ? ` · ${job.salaryRange}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <FaTimes size={14} style={{ color: MUTED }} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <FaCheckCircle size={28} style={{ color: BRAND }} className="mx-auto mb-3" />
            <p className="text-sm font-semibold mb-1" style={{ color: INK }}>
              Application submitted
            </p>
            <p className="text-xs mb-5" style={{ color: MUTED }}>
              We'll reach out if there's a match for this role.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: BRAND }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: MUTED }}>
                Full name
              </label>
              <input
                type="text"
                value={form.applicantName}
                onChange={(e) => setForm((f) => ({ ...f, applicantName: e.target.value }))}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-[#0E6E66]"
                style={{ borderColor: BORDER, color: INK }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: MUTED }}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-[#0E6E66]"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: MUTED }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-[#0E6E66]"
                  style={{ borderColor: BORDER, color: INK }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: MUTED }}>
                Cover letter (optional)
              </label>
              <textarea
                rows={3}
                value={form.coverLetter}
                onChange={(e) => setForm((f) => ({ ...f, coverLetter: e.target.value }))}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[#0E6E66]"
                style={{ borderColor: BORDER, color: INK }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: MUTED }}>
                Resume (PDF or Word, under 5MB)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full text-sm"
              />
              {resume && (
                <p className="text-xs mt-1" style={{ color: BRAND }}>
                  {resume.name}
                </p>
              )}
            </div>

            {error && (
              <p className="text-xs" style={{ color: DANGER }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: BRAND }}
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, onApply }) {
  return (
    <div className="border rounded-2xl p-6 bg-white flex flex-col gap-3" style={{ borderColor: BORDER }}>
      <div>
        <h3 className="text-base font-semibold" style={{ color: INK }}>
          {job.title}
        </h3>
        <p className="text-sm" style={{ color: BRAND }}>
          {job.department}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: MUTED }}>
        <span className="flex items-center gap-1">
          <FaBriefcase size={11} />
          {EMPLOYMENT_LABEL[job.employmentType] || job.employmentType}
        </span>
        <span className="flex items-center gap-1">
          <FaMapMarkerAlt size={11} />
          {job.location}
        </span>
      </div>

      {job.salaryRange && (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
          style={{ background: BRAND_SOFT, color: BRAND }}
        >
          Salary:
          <FaMoneyBillWave size={11} />
          {job.salaryRange}
        </span>
      )}

      <p className="text-sm leading-relaxed line-clamp-3" style={{ color: MUTED }}>
        {job.description}
      </p>

      {job.requirements?.length > 0 && (
        <ul className="text-xs list-disc list-inside space-y-0.5" style={{ color: MUTED }}>
          {job.requirements.slice(0, 3).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}

      <button
        onClick={() => onApply(job)}
        className="mt-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
        style={{ background: BRAND }}
      >
        Apply now
      </button>
    </div>
  );
}

const Careers = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingTo, setApplyingTo] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/jobs");
        if (!cancelled) setJobs(res.data?.jobs || []);
      } catch (err) {
        if (!cancelled) setError("Couldn't load openings right now. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: SURFACE }}>
      <div className=" mx-auto px-6 pt-24 pb-20">
        <h1 className="text-3xl font-semibold mb-2" style={{ color: INK }}>
          Careers
        </h1>
        <p className="text-sm mb-10" style={{ color: MUTED }}>
          Join a team focused on attentive, personal care.
        </p>

        {loading && (
          <p className="text-sm text-center py-12" style={{ color: MUTED }}>
            Loading openings…
          </p>
        )}

        {!loading && error && (
          <p className="text-sm text-center py-12" style={{ color: DANGER }}>
            {error}
          </p>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: BORDER }}>
            <p className="text-sm font-medium" style={{ color: INK }}>
              No open positions right now
            </p>
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              Check back soon — new roles are posted here as they open up.
            </p>
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} onApply={setApplyingTo} />
            ))}
          </div>
        )}
      </div>

      {applyingTo && <ApplyModal job={applyingTo} onClose={() => setApplyingTo(null)} />}
    </div>
  );
};

export default Careers;