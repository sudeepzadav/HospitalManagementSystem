import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";
import {
  FaCalendarAlt,
  FaStethoscope,
  FaMoneyBillWave,
  FaCheckCircle,
  FaHourglassHalf,
  FaExclamationTriangle,
  FaTicketAlt,
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
const DANGER_SOFT = "#FCEBEB";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// The same ECG stroke used in the navbar's logo mark, stretched into a
// full-width divider. Draws once on mount — the one signature visual
// thread tying the dashboard back to the brand mark.
function PulseDivider() {
  return (
    <svg viewBox="0 0 400 24" className="w-full h-5" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 12 H150 L162 3 L178 21 L190 12 L200 15 L208 12 H400"
        stroke={BRAND}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pathLength="1"
        className="dash-draw"
      />
    </svg>
  );
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase mb-0.5" style={{ color: FAINT }}>
          {eyebrow}
        </p>
        <h2 className="brand-font text-lg font-semibold" style={{ color: INK }}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: BORDER }}>
      {Icon && <Icon size={22} className="mx-auto mb-3" style={{ color: FAINT }} />}
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

const APPT_STATUS_STYLE = {
  pending: { bg: AMBER_SOFT, fg: AMBER, label: "Pending" },
  confirmed: { bg: BRAND_SOFT, fg: BRAND, label: "Confirmed" },
  completed: { bg: BRAND_SOFT, fg: BRAND, label: "Completed" },
  cancelled: { bg: DANGER_SOFT, fg: DANGER, label: "Cancelled" },
  no_show: { bg: "#F1F1F1", fg: "#7A7A7A", label: "No-show" },
};

const PAY_STATUS_STYLE = {
  PENDING: { bg: AMBER_SOFT, fg: AMBER, label: "Pending", Icon: FaHourglassHalf },
  COMPLETE: { bg: BRAND_SOFT, fg: BRAND, label: "Paid", Icon: FaCheckCircle },
  FAILED: { bg: DANGER_SOFT, fg: DANGER, label: "Failed", Icon: FaExclamationTriangle },
};

function ApptBadge({ status }) {
  const s = APPT_STATUS_STYLE[status] || { bg: "#F1F1F1", fg: "#7A7A7A", label: status };
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-2.5 py-1 tracking-wide"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

// Boarding-pass style card for the single soonest upcoming appointment —
// the hero of the page. A dashed perforation and a "stub" nod to a real
// ticket, since a token number is functionally the same thing: your claim
// on a specific place in line.
function NextAppointmentHero({ appt }) {
  if (!appt) {
    return (
      <div
        className="rounded-2xl border p-8 flex flex-col items-center text-center gap-2"
        style={{ borderColor: BORDER, background: "white" }}
      >
        <FaTicketAlt size={20} style={{ color: FAINT }} />
        <p className="text-sm font-medium" style={{ color: INK }}>
          No upcoming appointment
        </p>
        <p className="text-xs" style={{ color: MUTED }}>
          Book one through the chat assistant — it'll appear here as your next visit.
        </p>
      </div>
    );
  }

  const doctorName = appt.doctorId?.userId?.name || "your doctor";

  return (
    <div
      className="relative rounded-2xl overflow-hidden text-white"
      style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #0A5852 100%)` }}
    >
      <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/70 mb-1">
            Next appointment
          </p>
          <h3 className="brand-font text-2xl font-semibold">Dr. {doctorName}</h3>
          <p className="text-sm text-white/80 mt-0.5">{appt.department}</p>

          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <FaCalendarAlt size={12} className="text-white/60" />
              {formatDate(appt.date)}
            </span>
            {appt.reason && (
              <span className="flex items-center gap-1.5">
                <FaStethoscope size={12} className="text-white/60" />
                {appt.reason}
              </span>
            )}
          </div>
        </div>

        <div className="relative sm:pl-6 sm:border-l border-dashed border-white/30 shrink-0">
          <p className="text-[11px] uppercase tracking-wide text-white/60 mb-1">Token</p>
          <p className="brand-font text-4xl font-bold leading-none">#{appt.tokenNumber}</p>
          <p className="text-[11px] text-white/60 mt-2">NPR {appt.consultationFee || 0}</p>
        </div>
      </div>
      <div className="px-6 sm:px-7 pb-1 opacity-80">
        <PulseDivider />
      </div>
    </div>
  );
}

function AppointmentCard({ appt }) {
  const doctorName = appt.doctorId?.userId?.name || "Unknown";
  return (
    <div
      className="border rounded-xl p-4 bg-white flex flex-col gap-2 transition-shadow hover:shadow-[0_2px_10px_rgba(18,42,42,0.06)]"
      style={{ borderColor: BORDER }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm" style={{ color: INK }}>
            Dr. {doctorName}
          </p>
          <p className="text-xs" style={{ color: MUTED }}>
            {appt.department}
          </p>
        </div>
        <ApptBadge status={appt.status} />
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

      <p className="text-xs font-semibold mt-1" style={{ color: BRAND }}>
        NPR {appt.consultationFee || 0}
      </p>
    </div>
  );
}

function PaymentRow({ payment }) {
  const s = PAY_STATUS_STYLE[payment.status] || {
    bg: "#F1F1F1",
    fg: "#7A7A7A",
    label: payment.status,
    Icon: FaHourglassHalf,
  };
  const { Icon } = s;

  return (
    <div className="border rounded-xl p-4 bg-white flex items-center gap-4" style={{ borderColor: BORDER }}>
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: s.bg }}
      >
        <Icon size={14} style={{ color: s.fg }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: INK }}>
          {payment.department || "—"} · NPR {payment.amount}
        </p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>
          {formatDate(payment.createdAt)}
        </p>
        {payment.failed && (
          <p className="text-xs mt-1.5" style={{ color: DANGER }}>
            {payment.failureReason || "This payment failed. Contact support with your reference below."}
          </p>
        )}
        <p className="text-[10px] mt-1.5 font-mono truncate" style={{ color: FAINT }}>
          Ref · {payment.transactionUuid}
        </p>
      </div>

      <span
        className="text-[10px] font-semibold rounded-full px-2.5 py-1 shrink-0"
        style={{ background: s.bg, color: s.fg }}
      >
        {s.label}
      </span>
    </div>
  );
}

const TABS = [
  { key: "appointments", label: "Appointments" },
  { key: "payments", label: "Payments" },
  { key: "profile", label: "Profile" },
];

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState("appointments");

  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(false);

  const [apptTab, setApptTab] = useState("upcoming");
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState("");

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState("");

  useEffect(() => {
    // Profile — your real endpoint is GET /users/me (getCurrentUser).
    api
      .get("/users/me")
      .then((res) => setProfile(res.data?.user || res.data))
      .catch(() => setProfileError(true));

    api
      .get("/appointments/my-appointments")
      .then((res) => {
        setUpcoming(res.data.upcoming || []);
        setPast(res.data.past || []);
      })
      .catch(() => setApptError("Couldn't load your appointments right now."))
      .finally(() => setApptLoading(false));

    api
      .get("/payments/my-payments")
      .then((res) => setPayments(res.data.payments || []))
      .catch(() => setPaymentsError("Couldn't load your payment history right now."))
      .finally(() => setPaymentsLoading(false));
  }, []);

  const attentionCount = useMemo(() => payments.filter((p) => p.failed).length, [payments]);
  const nextAppt = upcoming[0];

  return (
    <div className="min-h-screen" style={{ background: SURFACE }}>
      <style>{`
        @keyframes dash-draw { to { stroke-dashoffset: 0; } }
        .dash-draw {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: dash-draw 1.2s ease-out 0.2s forwards;
        }
        .brand-font { font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
            style={{ background: BRAND }}
          >
            {initials(profile?.name)}
          </div>
          <div>
            <h1 className="brand-font text-2xl font-semibold" style={{ color: INK }}>
              {profile?.name ? `Hi, ${profile.name.split(" ")[0]}` : "My Dashboard"}
            </h1>
            <p className="text-sm" style={{ color: MUTED }}>
              Your appointments, payments, and account in one place.
            </p>
          </div>
        </div>

        {/* Hero: next appointment */}
        <div className="mb-10">
          {apptLoading ? (
            <div className="rounded-2xl border p-8 animate-pulse" style={{ borderColor: BORDER, background: "white" }} />
          ) : (
            <NextAppointmentHero appt={nextAppt} />
          )}
        </div>

        {/* Tabs */}
        <div className="inline-flex p-1 rounded-full mb-7" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="relative px-4 py-2 text-sm font-medium rounded-full transition-colors"
              style={activeTab === t.key ? { background: BRAND, color: "white" } : { color: MUTED }}
            >
              {t.label}
              {t.key === "payments" && attentionCount > 0 && (
                <span
                  className="ml-1.5 inline-flex items-center justify-center text-[10px] font-semibold rounded-full w-4 h-4"
                  style={{
                    background: activeTab === t.key ? "white" : DANGER,
                    color: activeTab === t.key ? DANGER : "white",
                  }}
                >
                  {attentionCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Appointments */}
        {activeTab === "appointments" && (
          <div>
            <SectionHeading
              eyebrow="Visits"
              title="Your appointments"
              action={
                <div className="flex gap-1.5">
                  {["upcoming", "past"].map((k) => (
                    <button
                      key={k}
                      onClick={() => setApptTab(k)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition-colors"
                      style={
                        apptTab === k
                          ? { background: BRAND, color: "white", borderColor: BRAND }
                          : { borderColor: BORDER, color: MUTED, background: "white" }
                      }
                    >
                      {k}
                    </button>
                  ))}
                </div>
              }
            />

            {apptLoading && (
              <p className="text-sm" style={{ color: MUTED }}>
                Loading…
              </p>
            )}
            {apptError && (
              <p className="text-sm" style={{ color: DANGER }}>
                {apptError}
              </p>
            )}

            {!apptLoading && !apptError && (
              <>
                {apptTab === "upcoming" && upcoming.length === 0 && (
                  <EmptyState
                    icon={FaCalendarAlt}
                    title="No upcoming appointments"
                    subtitle="Book one through the chat assistant to see it here."
                  />
                )}
                {apptTab === "past" && past.length === 0 && (
                  <EmptyState icon={FaCalendarAlt} title="No past appointments yet" />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(apptTab === "upcoming" ? upcoming : past).map((appt) => (
                    <AppointmentCard key={appt._id} appt={appt} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Payments */}
        {activeTab === "payments" && (
          <div>
            <SectionHeading eyebrow="Billing" title="Payment history" />

            <div className="flex flex-col gap-3">
              {paymentsLoading && (
                <p className="text-sm" style={{ color: MUTED }}>
                  Loading…
                </p>
              )}
              {paymentsError && (
                <p className="text-sm" style={{ color: DANGER }}>
                  {paymentsError}
                </p>
              )}

              {!paymentsLoading && !paymentsError && payments.length === 0 && (
                <EmptyState icon={FaMoneyBillWave} title="No payments yet" />
              )}

              {!paymentsLoading &&
                !paymentsError &&
                payments.map((p) => <PaymentRow key={p._id} payment={p} />)}
            </div>
          </div>
        )}

        {/* Profile */}
        {activeTab === "profile" && (
          <div>
            <SectionHeading eyebrow="Account" title="Profile" />
            <div className="border rounded-2xl p-6 bg-white max-w-md" style={{ borderColor: BORDER }}>
              {profileError && (
                <p className="text-sm" style={{ color: DANGER }}>
                  Couldn't load profile details from <code className="text-xs bg-gray-50 px-1 rounded">GET /api/users/me</code>.
                  Make sure you're logged in and the token hasn't expired.
                </p>
              )}
              {!profileError && !profile && (
                <p className="text-sm" style={{ color: MUTED }}>
                  Loading…
                </p>
              )}
              {profile && (
                <div className="flex flex-col gap-4 text-sm">
                  <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: BORDER }}>
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ background: BRAND }}
                    >
                      {initials(profile.name)}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: INK }}>
                        {profile.name || "—"}
                      </p>
                      <p className="text-xs" style={{ color: MUTED }}>
                        Patient
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: FAINT }}>
                      Email
                    </p>
                    <p style={{ color: INK }}>{profile.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: FAINT }}>
                      Phone
                    </p>
                    <p style={{ color: INK }}>{profile.phone || "—"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;