import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  Building2,
  BadgeCheck,
  DollarSign,
  GraduationCap,
  CalendarClock,
  Plus,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { departments } from "../constant/departments";

const COLOR = {
  paper: "#F6F4EE",
  paperDeep: "#EFEAE0",
  ink: "#1C2B26",
  inkSoft: "#5B6B64",
  sage: "#3F6B57",
  sageDark: "#2C4E3E",
  sageLight: "#E8EFE9",
  line: "#DBE2DA",
  coral: "#E1573C",
  white: "#FFFFFF",
};

// Pulled from the app's real department list (constant/departments.js)
// so this dropdown, the doctors directory, and the chatbot's keyword
// matching (appointmentController.js DEPARTMENT_KEYWORDS) all agree on
// the exact same department names.
const DEPARTMENT_OPTIONS = departments.map((d) => d.name);

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const emptyAvailabilityRow = () => ({
  day: "Monday",
  startTime: "09:00",
  endTime: "17:00",
});

const DoctorsProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    department: DEPARTMENT_OPTIONS[0],
    specialization: "",
    licenseNumber: "",
    consultationFee: "",
    qualification: "",
    experience: "",
  });

  const [availability, setAvailability] = useState([emptyAvailabilityRow()]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateAvailabilityRow = (index, field, value) => {
    setAvailability((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addAvailabilityRow = () => {
    setAvailability((prev) => [...prev, emptyAvailabilityRow()]);
  };

  const removeAvailabilityRow = (index) => {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.specialization.trim()) {
      setError("Enter your specialization.");
      return;
    }
    if (availability.length === 0) {
      setError("Add at least one day you're available.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/doctors/complete-profile", {
        department: form.department,
        specialization: form.specialization.trim(),
        licenseNumber: form.licenseNumber.trim() || undefined,
        consultationFee: form.consultationFee
          ? Number(form.consultationFee)
          : 0,
        qualification: form.qualification
          .split(",")
          .map((q) => q.trim())
          .filter(Boolean),
        availability,
      });

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong saving your profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8"
      style={{ background: COLOR.paperDeep, fontFamily: "Inter, sans-serif" }}
    >
      <div
        className="w-full max-w-xl rounded-3xl p-8 sm:p-10"
        style={{
          background: COLOR.paper,
          boxShadow: "0 30px 60px -20px rgba(28,43,38,0.25)",
        }}
      >
        <div className="flex items-center gap-2.5 mb-6">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: COLOR.sage }}
          >
            <Stethoscope className="text-white" size={18} strokeWidth={2.25} />
          </div>
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: COLOR.ink }}
          >
            Riverside General Hospital
          </span>
        </div>

        <h2
          className="text-3xl leading-tight mb-1.5"
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 500,
            color: COLOR.ink,
          }}
        >
          Complete your doctor profile
        </h2>
        <p className="text-[13.5px] mb-6" style={{ color: COLOR.inkSoft }}>
          Patients will use this to find and book appointments with you.
        </p>

        <form onSubmit={handleSubmit} className="text-[14px]">
          {error && (
            <div
              className="mb-4 text-[13px] rounded-lg px-3.5 py-2.5 border"
              style={{
                color: COLOR.coral,
                background: "#FBEEEA",
                borderColor: "#F2D5CC",
              }}
            >
              {error}
            </div>
          )}

          <Field
            label="Department"
            icon={<Building2 size={17} style={{ color: COLOR.inkSoft }} />}
          >
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full appearance-none outline-none bg-transparent py-3 text-[14px]"
              style={{ color: COLOR.ink }}
            >
              {DEPARTMENT_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Specialization"
            icon={<Stethoscope size={17} style={{ color: COLOR.inkSoft }} />}
          >
            <input
              className="w-full outline-none bg-transparent py-3 placeholder:text-[#9AA6A0]"
              style={{ color: COLOR.ink }}
              type="text"
              name="specialization"
              placeholder="e.g. Interventional Cardiologist"
              value={form.specialization}
              onChange={handleChange}
              required
            />
          </Field>

          <Field
            label="License number"
            icon={<BadgeCheck size={17} style={{ color: COLOR.inkSoft }} />}
          >
            <input
              className="w-full outline-none bg-transparent py-3 placeholder:text-[#9AA6A0]"
              style={{ color: COLOR.ink }}
              type="text"
              name="licenseNumber"
              placeholder="e.g. MD-102938"
              value={form.licenseNumber}
              onChange={handleChange}
            />
          </Field>

          <Field
            label="Consultation fee ($)"
            icon={<DollarSign size={17} style={{ color: COLOR.inkSoft }} />}
          >
            <input
              className="w-full outline-none bg-transparent py-3 placeholder:text-[#9AA6A0]"
              style={{ color: COLOR.ink }}
              type="number"
              min="0"
              name="consultationFee"
              placeholder="50"
              value={form.consultationFee}
              onChange={handleChange}
            />
          </Field>

          <Field
            label="Qualifications (comma separated)"
            icon={<GraduationCap size={17} style={{ color: COLOR.inkSoft }} />}
            noMargin
          >
            <input
              className="w-full outline-none bg-transparent py-3 placeholder:text-[#9AA6A0]"
              style={{ color: COLOR.ink }}
              type="text"
              name="qualification"
              placeholder="MBBS, MD"
              value={form.qualification}
              onChange={handleChange}
            />
          </Field>

          <div className="mt-5 mb-2 flex items-center gap-2">
            <CalendarClock size={17} style={{ color: COLOR.inkSoft }} />
            <label
              className="text-[11.5px] font-medium"
              style={{
                color: COLOR.inkSoft,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Weekly availability
            </label>
          </div>

          <div className="space-y-2 mb-3">
            {availability.map((row, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border"
                style={{ borderColor: COLOR.line, background: COLOR.white }}
              >
                <select
                  value={row.day}
                  onChange={(e) =>
                    updateAvailabilityRow(index, "day", e.target.value)
                  }
                  className="outline-none bg-transparent text-[13px] shrink-0"
                  style={{ color: COLOR.ink }}
                >
                  {WEEKDAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) =>
                    updateAvailabilityRow(index, "startTime", e.target.value)
                  }
                  className="outline-none bg-transparent text-[13px]"
                  style={{ color: COLOR.ink }}
                />
                <span style={{ color: COLOR.inkSoft }}>–</span>
                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) =>
                    updateAvailabilityRow(index, "endTime", e.target.value)
                  }
                  className="outline-none bg-transparent text-[13px]"
                  style={{ color: COLOR.ink }}
                />
                <button
                  type="button"
                  onClick={() => removeAvailabilityRow(index)}
                  className="ml-auto shrink-0"
                  style={{ color: COLOR.coral }}
                  aria-label="Remove day"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addAvailabilityRow}
            className="flex items-center gap-1.5 text-[13px] font-medium mb-6"
            style={{ color: COLOR.sage }}
          >
            <Plus size={15} /> Add another day
          </button>

          <Field
            label="Experience (Years)"
            icon={<BadgeCheck size={17} style={{ color: COLOR.inkSoft }} />}
          >
            <input
              className="w-full outline-none bg-transparent py-3 placeholder:text-[#9AA6A0]"
              style={{ color: COLOR.ink }}
              type="number"
              min="0"
              name="experience"
              placeholder="e.g. 5"
              value={form.experience}
              onChange={handleChange}
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-[14px] transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: COLOR.sage, color: COLOR.white }}
          >
            {loading ? (
              "Saving…"
            ) : (
              <>
                Save and continue <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, icon, children, noMargin }) => (
  <div className={noMargin ? "mb-2" : "mb-3"}>
    <label
      className="block text-[11.5px] font-medium mb-1.5"
      style={{ color: "#5B6B64", fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {label}
    </label>
    <div
      className="flex items-center gap-2.5 px-3.5 rounded-lg border"
      style={{ borderColor: "#DBE2DA", background: "#FFFFFF" }}
    >
      {icon}
      {children}
    </div>
  </div>
);

export default DoctorsProfile;
