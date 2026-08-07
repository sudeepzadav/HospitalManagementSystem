import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const BRAND = "#0F6E56";
const BRAND_SOFT = "#E1F5EE";
const BORDER = "#DDE6E2";
const MUTED = "#4A6B62";
const INK = "#12312B";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatCard({ label, value, accent }) {
  return (
    <div className="border rounded-xl p-4 bg-white" style={{ borderColor: BORDER }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="text-2xl font-semibold mt-1" style={{ color: accent || INK }}>
        {value}
      </p>
    </div>
  );
}

const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

function JobTypeBadge({ type }) {
  const found = JOB_TYPES.find((t) => t.value === type);
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-2 py-1"
      style={{ background: BRAND_SOFT, color: BRAND }}
    >
      {found ? found.label : type || "—"}
    </span>
  );
}

function StatusBadge({ status }) {
  const isOpen = status === "open";
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-2 py-1 capitalize"
      style={{
        background: isOpen ? BRAND_SOFT : "#F3F3F3",
        color: isOpen ? BRAND : "#6B7280",
      }}
    >
      {isOpen ? "Open" : "Closed"}
    </span>
  );
}

const emptyForm = {
  title: "",
  department: "",
  location: "",
  employmentType: "full_time",
  salaryRange: "",
  deadline: "",
  description: "",
  requirements: "",
};

function JobFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(initial && initial._id);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.department.trim()) {
      setError("Title and department are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        requirements: Array.isArray(form.requirements)
          ? form.requirements
          : form.requirements
              .split("\n")
              .map((r) => r.trim())
              .filter(Boolean),
      };
      let res;
      if (isEdit) {
        res = await api.put(`/jobs/${initial._id}`, payload);
      } else {
        res = await api.post("/jobs", payload);
      }
      onSaved(res.data.job || res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save this job posting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: INK }}>
          {isEdit ? "Edit job posting" : "Post a new job"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold" style={{ color: MUTED }}>
              Job title
            </label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-full mt-1"
              style={{ borderColor: BORDER }}
              placeholder="e.g. Staff Nurse"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold" style={{ color: MUTED }}>
                Department
              </label>
              <input
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full mt-1"
                style={{ borderColor: BORDER }}
                placeholder="e.g. Cardiology"
              />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: MUTED }}>
                Location
              </label>
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full mt-1"
                style={{ borderColor: BORDER }}
                placeholder="e.g. Kathmandu"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold" style={{ color: MUTED }}>
                Job type
              </label>
              <select
                value={form.employmentType}
                onChange={(e) => update("employmentType", e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full mt-1"
                style={{ borderColor: BORDER }}
              >
                {JOB_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: MUTED }}>
                Application deadline
              </label>
              <input
                type="date"
                value={form.deadline ? form.deadline.split("T")[0] : ""}
                onChange={(e) => update("deadline", e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full mt-1"
                style={{ borderColor: BORDER }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: MUTED }}>
              Salary range (optional)
            </label>
            <input
              value={form.salaryRange}
              onChange={(e) => update("salaryRange", e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-full mt-1"
              style={{ borderColor: BORDER }}
              placeholder="e.g. NPR 40,000 – 60,000 / month"
            />
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: MUTED }}>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              className="border rounded-lg px-3 py-2 text-sm w-full mt-1"
              style={{ borderColor: BORDER }}
              placeholder="Role summary, responsibilities, etc."
            />
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: MUTED }}>
              Requirements (one per line)
            </label>
            <textarea
              value={
                Array.isArray(form.requirements) ? form.requirements.join("\n") : form.requirements
              }
              onChange={(e) => update("requirements", e.target.value)}
              rows={4}
              className="border rounded-lg px-3 py-2 text-sm w-full mt-1"
              style={{ borderColor: BORDER }}
              placeholder={"e.g.\nBSc in Nursing\n2+ years experience"}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium rounded-lg px-4 py-2 border"
              style={{ borderColor: BORDER, color: MUTED }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm font-semibold text-white rounded-lg px-4 py-2 disabled:opacity-50"
              style={{ background: BRAND }}
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Post job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const JobPostings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const loadJobs = useCallback(() => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (departmentFilter) params.department = departmentFilter;

    api
      .get("/jobs", { params })
      .then((res) => setJobs(res.data.jobs || res.data || []))
      .catch(() => setError("Couldn't load job postings."))
      .finally(() => setLoading(false));
  }, [statusFilter, departmentFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function openCreate() {
    setEditingJob(null);
    setModalOpen(true);
  }

  function openEdit(job) {
    setEditingJob(job);
    setModalOpen(true);
  }

  function handleSaved(job) {
    setModalOpen(false);
    if (editingJob) {
      setJobs((prev) => prev.map((j) => (j._id === job._id ? job : j)));
    } else {
      setJobs((prev) => [job, ...prev]);
    }
  }

  async function toggleStatus(job) {
    const nextStatus = job.status === "open" ? "closed" : "open";
    setTogglingId(job._id);
    try {
      await api.put(`/jobs/${job._id}/status`, { status: nextStatus });
      setJobs((prev) =>
        prev.map((j) => (j._id === job._id ? { ...j, status: nextStatus } : j))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't update job status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteJob(id) {
    if (!window.confirm("Delete this job posting? This can't be undone.")) return;
    try {
      await api.delete(`/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't delete this job posting.");
    }
  }

  const openCount = jobs.filter((j) => j.status === "open").length;
  const closedCount = jobs.filter((j) => j.status !== "open").length;
  const departments = Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)));

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: INK }}>
            Job Postings
          </h1>
          <p className="text-sm" style={{ color: MUTED }}>
            Create and manage open positions.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="text-sm font-semibold text-white rounded-lg px-4 py-2"
          style={{ background: BRAND }}
        >
          + Post a job
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Postings" value={jobs.length} />
        <StatCard label="Open" value={openCount} accent={BRAND} />
        <StatCard label="Closed" value={closedCount} />
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: BORDER }}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: BORDER }}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {(statusFilter || departmentFilter) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setDepartmentFilter("");
            }}
            className="text-xs underline"
            style={{ color: MUTED }}
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && (
        <p className="text-sm" style={{ color: MUTED }}>
          Loading…
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto border rounded-xl" style={{ borderColor: BORDER }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: BORDER }}>
                <th className="p-3 font-semibold" style={{ color: MUTED }}>
                  Title
                </th>
                <th className="p-3 font-semibold" style={{ color: MUTED }}>
                  Department
                </th>
                <th className="p-3 font-semibold" style={{ color: MUTED }}>
                  Type
                </th>
                <th className="p-3 font-semibold" style={{ color: MUTED }}>
                  Deadline
                </th>
                <th className="p-3 font-semibold" style={{ color: MUTED }}>
                  Status
                </th>
                <th className="p-3 font-semibold" style={{ color: MUTED }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j._id} className="border-b last:border-0" style={{ borderColor: BORDER }}>
                  <td className="p-3 font-medium" style={{ color: INK }}>
                    {j.title}
                  </td>
                  <td className="p-3">{j.department}</td>
                  <td className="p-3">
                    <JobTypeBadge type={j.employmentType} />
                  </td>
                  <td className="p-3">{formatDate(j.deadline)}</td>
                  <td className="p-3">
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(j)}
                        className="text-xs underline"
                        style={{ color: BRAND }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleStatus(j)}
                        disabled={togglingId === j._id}
                        className="text-xs underline disabled:opacity-50"
                        style={{ color: MUTED }}
                      >
                        {togglingId === j._id
                          ? "…"
                          : j.status === "open"
                          ? "Close"
                          : "Reopen"}
                      </button>
                      <button
                        onClick={() => deleteJob(j._id)}
                        className="text-xs text-red-500 underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm" style={{ color: MUTED }}>
                    No job postings yet. Click "Post a job" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <JobFormModal
          initial={editingJob}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default JobPostings;