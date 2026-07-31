import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled", "no_show"];

function StatusBadge({ status }) {
  const map = {
    pending: { bg: "#FFF7E6", fg: "#B8860B" },
    confirmed: { bg: BRAND_SOFT, fg: BRAND },
    completed: { bg: BRAND_SOFT, fg: BRAND },
    cancelled: { bg: "#FDEDED", fg: "#C0392B" },
    no_show: { bg: "#F3F3F3", fg: "#6B7280" },
  };
  const s = map[status] || { bg: "#F3F3F3", fg: "#6B7280" };
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-2 py-1 capitalize"
      style={{ background: s.bg, color: s.fg }}
    >
      {status?.replace("_", " ")}
    </span>
  );
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "appointments", label: "Appointments" },
  { key: "doctors", label: "Doctors" },
  { key: "patients", label: "Patients" },
  { key: "issues", label: "Payment Issues" },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [savingId, setSavingId] = useState(null);

  // Doctors
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");

  // Patients
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState("");

  // Payment issues
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState("");
  const [retryingId, setRetryingId] = useState(null);

  // Patient growth
  const [growth, setGrowth] = useState([]);
  const [growthLoading, setGrowthLoading] = useState(true);
  const [growthError, setGrowthError] = useState("");

  const loadAppointments = useCallback(() => {
    setApptLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;

    api
      .get("/appointments", { params })
      .then((res) => setAppointments(res.data.appointments || []))
      .catch(() => setApptError("Couldn't load appointments."))
      .finally(() => setApptLoading(false));
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    api
      .get("/doctors")
      .then((res) => setDoctors(res.data || []))
      .catch(() => setDoctorsError("Couldn't load doctors."))
      .finally(() => setDoctorsLoading(false));

    // Assumed endpoint — adjust if your patients list lives elsewhere.
    api
      .get("/patients")
      .then((res) => setPatients(res.data || []))
      .catch(() =>
        setPatientsError("Couldn't load patients. (Check GET /api/patients matches your real endpoint.)")
      )
      .finally(() => setPatientsLoading(false));

    loadIssues();

    api
      .get("/user/growth", { params: { months: 6 } })
      .then((res) => setGrowth(res.data.growth || []))
      .catch(() => setGrowthError("Couldn't load user growth data."))
      .finally(() => setGrowthLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadIssues() {
    setIssuesLoading(true);
    api
      .get("/payments/issues")
      .then((res) => setIssues(res.data.issues || []))
      .catch(() => setIssuesError("Couldn't load payment issues."))
      .finally(() => setIssuesLoading(false));
  }

  async function updateStatus(id, status) {
    setSavingId(id);
    try {
      await api.put(`/appointments/${id}/status`, { status });
      setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't update status.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteAppt(id) {
    if (!window.confirm("Delete this appointment? This can't be undone.")) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't delete appointment.");
    }
  }

  async function retryBooking(transactionUuid) {
    setRetryingId(transactionUuid);
    try {
      const res = await api.post(`/payments/${transactionUuid}/retry-booking`);
      if (res.data.success) {
        setIssues((prev) => prev.filter((i) => i.transactionUuid !== transactionUuid));
        alert("Booking created successfully.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Retry failed — the slot may still be unavailable.");
    } finally {
      setRetryingId(null);
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter(
    (a) => new Date(a.date).toISOString().split("T")[0] === todayStr
  ).length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-1" style={{ color: INK }}>
        Admin Dashboard
      </h1>
      <p className="text-sm mb-8" style={{ color: MUTED }}>
        Manage appointments, doctors, patients, and payment issues.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b flex-wrap" style={{ borderColor: BORDER }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="relative px-4 py-2.5 text-sm font-medium"
            style={{ color: activeTab === t.key ? BRAND : MUTED }}
          >
            {t.label}
            {t.key === "issues" && issues.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center text-[10px] font-semibold text-white bg-red-500 rounded-full w-4 h-4">
                {issues.length}
              </span>
            )}
            {activeTab === t.key && (
              <span
                className="absolute left-0 right-0 -bottom-[1px] h-[2px] rounded-full"
                style={{ background: BRAND }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Appointments" value={appointments.length} />
            <StatCard label="Today" value={todayCount} />
            <StatCard label="Pending" value={pendingCount} accent="#B8860B" />
            <StatCard label="Cancelled" value={cancelledCount} accent="#C0392B" />
            <StatCard label="Doctors" value={doctors.length} />
            <StatCard label="Patients" value={patients.length} />
            <StatCard
              label="Payment Issues"
              value={issues.length}
              accent={issues.length > 0 ? "#C0392B" : undefined}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="border rounded-xl p-5 bg-white max-w-sm flex-1 min-w-[280px]" style={{ borderColor: BORDER }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: MUTED }}>
                Patients vs Doctors
              </p>
              {doctorsLoading || patientsLoading ? (
                <p className="text-sm" style={{ color: MUTED }}>
                  Loading…
                </p>
              ) : patients.length + doctors.length === 0 ? (
                <p className="text-sm" style={{ color: MUTED }}>
                  No data yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Patients", value: patients.length },
                        { name: "Doctors", value: doctors.length },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill={BRAND} />
                      <Cell fill="#B8860B" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={24} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="border rounded-xl p-5 bg-white flex-1 min-w-[320px]" style={{ borderColor: BORDER }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: MUTED }}>
                New Users (last 6 months)
              </p>
              {growthLoading && (
                <p className="text-sm" style={{ color: MUTED }}>
                  Loading…
                </p>
              )}
              {growthError && <p className="text-sm text-red-500">{growthError}</p>}
              {!growthLoading && !growthError && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={growth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} name="New users" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointments */}
      {activeTab === "appointments" && (
        <div>
          <div className="flex flex-wrap gap-3 mb-5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: BORDER }}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: BORDER }}
            />
            {(statusFilter || dateFilter) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setDateFilter("");
                }}
                className="text-xs underline"
                style={{ color: MUTED }}
              >
                Clear filters
              </button>
            )}
          </div>

          {apptLoading && (
            <p className="text-sm" style={{ color: MUTED }}>
              Loading…
            </p>
          )}
          {apptError && <p className="text-sm text-red-500">{apptError}</p>}

          {!apptLoading && !apptError && (
            <div className="overflow-x-auto border rounded-xl" style={{ borderColor: BORDER }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b" style={{ borderColor: BORDER }}>
                    <th className="p-3 font-semibold" style={{ color: MUTED }}>
                      Patient
                    </th>
                    <th className="p-3 font-semibold" style={{ color: MUTED }}>
                      Doctor
                    </th>
                    <th className="p-3 font-semibold" style={{ color: MUTED }}>
                      Date
                    </th>
                    <th className="p-3 font-semibold" style={{ color: MUTED }}>
                      Token
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
                  {appointments.map((a) => (
                    <tr key={a._id} className="border-b last:border-0" style={{ borderColor: BORDER }}>
                      <td className="p-3">{a.patientDetails?.name || a.patientId?.userId?.name || "—"}</td>
                      <td className="p-3">Dr. {a.doctorId?.userId?.name || "—"}</td>
                      <td className="p-3">{formatDate(a.date)}</td>
                      <td className="p-3">#{a.tokenNumber}</td>
                      <td className="p-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={a.status}
                            disabled={savingId === a._id}
                            onChange={(e) => updateStatus(a._id, e.target.value)}
                            className="border rounded-lg px-2 py-1 text-xs"
                            style={{ borderColor: BORDER }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <button onClick={() => deleteAppt(a._id)} className="text-xs text-red-500 underline">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-sm" style={{ color: MUTED }}>
                        No appointments match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Doctors */}
      {activeTab === "doctors" && (
        <div>
          {doctorsLoading && (
            <p className="text-sm" style={{ color: MUTED }}>
              Loading…
            </p>
          )}
          {doctorsError && <p className="text-sm text-red-500">{doctorsError}</p>}
          {!doctorsLoading && !doctorsError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((d) => (
                <div key={d._id} className="border rounded-xl p-4 bg-white" style={{ borderColor: BORDER }}>
                  <p className="font-semibold text-sm" style={{ color: INK }}>
                    Dr. {d.userId?.name || "Unknown"}
                  </p>
                  <p className="text-xs" style={{ color: MUTED }}>
                    {d.department} · {d.specialization}
                  </p>
                  <p className="text-xs mt-1" style={{ color: BRAND }}>
                    NPR {d.consultationFee || 0}
                  </p>
                  <p className="text-xs mt-2" style={{ color: MUTED }}>
                    Available: {(d.availability || []).map((a) => a.day).join(", ") || "—"}
                  </p>
                </div>
              ))}
              {doctors.length === 0 && (
                <p className="text-sm col-span-full" style={{ color: MUTED }}>
                  No doctors found.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Patients */}
      {activeTab === "patients" && (
        <div>
          {patientsLoading && (
            <p className="text-sm" style={{ color: MUTED }}>
              Loading…
            </p>
          )}
          {patientsError && <p className="text-sm text-red-500">{patientsError}</p>}
          {!patientsLoading && !patientsError && (
            <div className="overflow-x-auto border rounded-xl" style={{ borderColor: BORDER }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b" style={{ borderColor: BORDER }}>
                    <th className="p-3 font-semibold" style={{ color: MUTED }}>
                      Name
                    </th>
                    <th className="p-3 font-semibold" style={{ color: MUTED }}>
                      Email
                    </th>
                    <th className="p-3 font-semibold" style={{ color: MUTED }}>
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p._id} className="border-b last:border-0" style={{ borderColor: BORDER }}>
                      <td className="p-3">{p.userId?.name || "—"}</td>
                      <td className="p-3">{p.userId?.email || "—"}</td>
                      <td className="p-3">{p.userId?.phone || "—"}</td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-sm" style={{ color: MUTED }}>
                        No patients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Issues */}
      {activeTab === "issues" && (
        <div className="flex flex-col gap-3">
          {issuesLoading && (
            <p className="text-sm" style={{ color: MUTED }}>
              Loading…
            </p>
          )}
          {issuesError && <p className="text-sm text-red-500">{issuesError}</p>}

          {!issuesLoading && !issuesError && issues.length === 0 && (
            <div className="text-center py-14 rounded-xl border border-dashed" style={{ borderColor: BORDER }}>
              <p className="text-sm font-medium" style={{ color: INK }}>
                No payment issues right now
              </p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                Payments that succeeded but couldn't be booked will show up here.
              </p>
            </div>
          )}

          {issues.map((i) => (
            <div
              key={i._id}
              className="border rounded-xl p-4 bg-white flex items-center justify-between gap-4"
              style={{ borderColor: BORDER }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: INK }}>
                  {i.department} · NPR {i.amount} · {formatDate(i.date)}
                </p>
                <p className="text-xs mt-1 text-red-500">{i.failureReason || "Unknown reason"}</p>
                <p className="text-[10px] mt-1 font-mono" style={{ color: MUTED }}>
                  Ref: {i.transactionUuid}
                </p>
              </div>
              {i.failureReason?.includes("Payment was verified") ? (
                <button
                  onClick={() => retryBooking(i.transactionUuid)}
                  disabled={retryingId === i.transactionUuid}
                  className="text-xs font-semibold text-white rounded-lg px-3 py-2 disabled:opacity-50"
                  style={{ background: BRAND }}
                >
                  {retryingId === i.transactionUuid ? "Retrying…" : "Retry booking"}
                </button>
              ) : (
                <span className="text-[10px]" style={{ color: MUTED }}>
                  Not retryable — eSewa never confirmed this payment
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;