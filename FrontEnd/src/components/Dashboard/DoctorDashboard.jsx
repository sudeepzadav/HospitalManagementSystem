import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import {
  FaCalendarAlt,
  FaUserCircle,
  FaClock,
  FaStethoscope,
} from "react-icons/fa";

const INK = "#122A2A";
const MUTED = "#5B7373";
const FAINT = "#8AA0A0";
const BORDER = "#E1E8E7";
const SURFACE = "#F6F8F8";
const BRAND = "#0E6E66";
const BRAND_SOFT = "#E4F1EF";
const AMBER = "#B8860B";
const AMBER_SOFT = "#FDF6E8";
const DANGER = "#D64545";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const STATUS_STYLE = {
  pending: { bg: AMBER_SOFT, fg: AMBER, label: "Pending" },
  confirmed: { bg: BRAND_SOFT, fg: BRAND, label: "Confirmed" },
  completed: { bg: BRAND_SOFT, fg: BRAND, label: "Completed" },
  cancelled: { bg: "#FCEBEB", fg: DANGER, label: "Cancelled" },
  no_show: { bg: "#F1F1F1", fg: "#7A7A7A", label: "No-show" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "#F1F1F1", fg: "#7A7A7A", label: status };
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-2.5 py-1"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="text-center py-14 rounded-2xl border border-dashed" style={{ borderColor: BORDER }}>
      {Icon && <Icon size={20} className="mx-auto mb-3" style={{ color: FAINT }} />}
      <p className="text-sm font-medium" style={{ color: INK }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: MUTED }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Today's queue row — this is the doctor's main working view, so it gets
// the most actionable treatment: patient details up front, plus one-tap
// status buttons instead of a dropdown, since these get used constantly
// through a clinic day.
function QueueRow({ appt, onUpdateStatus, updating }) {
  const patientName = appt.patientDetails?.name || appt.patientId?.userId?.name || "Unknown";

  return (
    <div className="border rounded-xl p-4 bg-white flex flex-col sm:flex-row sm:items-center gap-4" style={{ borderColor: BORDER }}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
        style={{ background: BRAND }}
      >
        #{appt.tokenNumber}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: INK }}>
          {patientName}
          {appt.patientDetails?.age ? (
            <span className="font-normal text-xs ml-1.5" style={{ color: MUTED }}>
              · {appt.patientDetails.age}y, {appt.patientDetails.gender}
            </span>
          ) : null}
        </p>
        {appt.reason && (
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            {appt.reason}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={appt.status} />
        {appt.status === "pending" && (
          <button
            onClick={() => onUpdateStatus(appt._id, "confirmed")}
            disabled={updating === appt._id}
            className="text-xs font-semibold rounded-lg px-3 py-1.5 border disabled:opacity-50"
            style={{ borderColor: BRAND, color: BRAND }}
          >
            Confirm
          </button>
        )}
        {appt.status === "confirmed" && (
          <button
            onClick={() => onUpdateStatus(appt._id, "completed")}
            disabled={updating === appt._id}
            className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
            style={{ background: BRAND }}
          >
            Mark seen
          </button>
        )}
        {["pending", "confirmed"].includes(appt.status) && (
          <button
            onClick={() => onUpdateStatus(appt._id, "no_show")}
            disabled={updating === appt._id}
            className="text-xs font-semibold rounded-lg px-3 py-1.5 border disabled:opacity-50"
            style={{ borderColor: BORDER, color: MUTED }}
          >
            No-show
          </button>
        )}
      </div>
    </div>
  );
}

function SimpleAppointmentCard({ appt }) {
  const patientName = appt.patientDetails?.name || appt.patientId?.userId?.name || "Unknown";
  return (
    <div className="border rounded-xl p-4 bg-white flex flex-col gap-2" style={{ borderColor: BORDER }}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold" style={{ color: INK }}>
          {patientName}
        </p>
        <StatusBadge status={appt.status} />
      </div>
      <p className="text-xs flex items-center gap-1.5" style={{ color: MUTED }}>
        <FaCalendarAlt size={10} style={{ color: FAINT }} />
        {formatDate(appt.date)} · Token #{appt.tokenNumber}
      </p>
      {appt.reason && (
        <p className="text-xs" style={{ color: MUTED }}>
          {appt.reason}
        </p>
      )}
    </div>
  );
}

const TABS = [
  { key: "today", label: "Today's Queue" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState("today");

  const [doctor, setDoctor] = useState(null);
  const [today, setToday] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/appointments/my-schedule")
      .then((res) => {
        setDoctor(res.data.doctor);
        setToday(res.data.today || []);
        setUpcoming(res.data.upcoming || []);
        setPast(res.data.past || []);
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load your schedule."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpdateStatus(id, status) {
    setUpdating(id);
    try {
      await api.put(`/appointments/${id}/status`, { status });
      setToday((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't update status.");
    } finally {
      setUpdating(null);
    }
  }

  const doctorName = doctor?.userId?.name;
  const activeTodayCount = today.filter((a) => ["pending", "confirmed"].includes(a.status)).length;

  return (
    <div className="min-h-screen" style={{ background: SURFACE }}>
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: BRAND }}
          >
            <FaStethoscope size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: INK }}>
              {doctorName ? `Dr. ${doctorName}` : "Doctor Dashboard"}
            </h1>
            <p className="text-sm" style={{ color: MUTED }}>
              {doctor?.department || "Your schedule and patient queue."}
            </p>
          </div>
        </div>

        {error && (
          <div className="border rounded-xl p-4 mb-6 text-sm" style={{ borderColor: BORDER, color: DANGER }}>
            {error}
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border rounded-xl p-4 bg-white" style={{ borderColor: BORDER }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: FAINT }}>
              In queue today
            </p>
            <p className="text-2xl font-semibold mt-1" style={{ color: BRAND }}>
              {activeTodayCount}
            </p>
          </div>
          <div className="border rounded-xl p-4 bg-white" style={{ borderColor: BORDER }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: FAINT }}>
              Upcoming
            </p>
            <p className="text-2xl font-semibold mt-1" style={{ color: INK }}>
              {upcoming.length}
            </p>
          </div>
          <div className="border rounded-xl p-4 bg-white" style={{ borderColor: BORDER }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: FAINT }}>
              Consultation fee
            </p>
            <p className="text-2xl font-semibold mt-1" style={{ color: INK }}>
              NPR {doctor?.consultationFee || 0}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="inline-flex p-1 rounded-full mb-6" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-4 py-2 text-sm font-medium rounded-full transition-colors"
              style={activeTab === t.key ? { background: BRAND, color: "white" } : { color: MUTED }}
            >
              {t.label}
              {t.key === "today" && activeTodayCount > 0 && (
                <span
                  className="ml-1.5 inline-flex items-center justify-center text-[10px] font-semibold rounded-full w-4 h-4"
                  style={{
                    background: activeTab === t.key ? "white" : BRAND,
                    color: activeTab === t.key ? BRAND : "white",
                  }}
                >
                  {activeTodayCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-sm" style={{ color: MUTED }}>
            Loading…
          </p>
        )}

        {!loading && activeTab === "today" && (
          <div className="flex flex-col gap-3">
            {today.length === 0 && (
              <EmptyState
                icon={FaClock}
                title="No patients in today's queue"
                subtitle="Confirmed and pending bookings for today will appear here."
              />
            )}
            {today.map((appt) => (
              <QueueRow key={appt._id} appt={appt} onUpdateStatus={handleUpdateStatus} updating={updating} />
            ))}
          </div>
        )}

        {!loading && activeTab === "upcoming" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.length === 0 && (
              <div className="col-span-full">
                <EmptyState icon={FaCalendarAlt} title="No upcoming appointments" />
              </div>
            )}
            {upcoming.map((appt) => (
              <SimpleAppointmentCard key={appt._id} appt={appt} />
            ))}
          </div>
        )}

        {!loading && activeTab === "past" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.length === 0 && (
              <div className="col-span-full">
                <EmptyState icon={FaUserCircle} title="No past appointments yet" />
              </div>
            )}
            {past.map((appt) => (
              <SimpleAppointmentCard key={appt._id} appt={appt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;