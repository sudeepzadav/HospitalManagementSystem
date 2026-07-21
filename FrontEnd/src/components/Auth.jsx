import { useState } from "react";
import api from "../api/axios";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  HeartPulse,
  ShieldCheck,
  Phone,
  CalendarClock,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROLE_OPTIONS } from "../constant/roles";

const HOSPITAL_IMAGE =
  "https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=1200&auto=format&fit=crop";
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

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,340..600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');";

const Auth = ({ type = "signin", onSubmit }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("patient");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    agree: false,
  });

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: inputType === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim()) {
      setError("Enter your email.");
      return;
    }

    if (!form.password) {
      setError("Enter your password.");
      return;
    }

    if (isSignup) {
      if (!form.name.trim()) {
        setError("Enter your full name.");
        return;
      }
      if (!form.agree) {
        setError("Please agree to the patient privacy policy to continue.");
        return;
      }
    }

    setLoading(true);

    try {
      let res;

      if (isSignup) {
        res = await api.post("/user/register", {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role,
        });
      } else {
        res = await api.post("/user/login", {
          email: form.email,
          password: form.password,
        });
      }

      console.log(isSignup ? "Signup success:" : "Login success:", res.data);

      // Save JWT
      localStorage.setItem("token", res.data.token);

      // Save user data
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Redirect
      if (isSignup) {
        navigate("/signin");
      } else {
        await redirectAfterLogin(res.data.user);
      }
    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.message ||
          (isSignup
            ? "Signup failed. Please try again."
            : "Login failed. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  // Doctors need a completed Doctor profile (department, specialization,
  // availability, etc.) before patients can find/book them. If they don't
  // have one yet, send them to the setup page instead of the homepage.
  const redirectAfterLogin = async (user) => {
    if (user?.role !== "doctor") {
      navigate("/");
      return;
    }

    try {
      const profileRes = await api.get("/doctors/my-profile");
      if (!profileRes.data?.doctor) {
        navigate("/doctor/complete-profile");
      } else {
        navigate("/");
      }
    } catch (err) {
      // If the check itself fails, don't block login — just go home.
      // The doctor can be prompted again next time.
      console.log("Could not check doctor profile status:", err);
      navigate("/");
    }
  };

  const isSignup = type === "signup";

  return (
    <div
      className="h-screen w-full flex items-center justify-center p-4 sm:p-8 lg:p-10 overflow-hidden"
      style={{ background: COLOR.paperDeep, fontFamily: "Inter, sans-serif" }}
    >
      <div
        className="w-full max-w-5xl h-full flex rounded-3xl overflow-hidden"
        style={{
          background: COLOR.paper,
          boxShadow: "0 30px 60px -20px rgba(28,43,38,0.25)",
        }}
      >
        {/* Image panel */}
        <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden items-end">
          <img
            src={HOSPITAL_IMAGE}
            alt="Clinician reviewing a patient's chart"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(190deg, ${COLOR.sageDark}00 30%, ${COLOR.sageDark}E6 100%)`,
            }}
          />
          {/* faint grid, like chart paper */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />

          <div className="relative w-full px-8 pb-9">
            <p
              className="text-[12px] mb-4"
              style={{
                color: "#CFE3D6",
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.02em",
              }}
            >
              RIVERSIDE / PATIENT PORTAL
            </p>

            {/* Signature pulse line */}
            <svg
              viewBox="0 0 320 70"
              className="w-full h-auto mb-5"
              fill="none"
            >
              <path
                d="M0 35 H95 L115 35 L128 8 L145 62 L159 35 H320"
                stroke="#EFE7DA"
                strokeOpacity="0.2"
                strokeWidth="2"
              />
              <path
                className="pulse-path"
                d="M0 35 H95 L115 35 L128 8 L145 62 L159 35 H320"
                stroke={COLOR.coral}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDasharray: 500 }}
              />
              <circle
                className="glow-dot"
                cx="159"
                cy="35"
                r="4.5"
                fill={COLOR.coral}
              />
            </svg>

            {/* Floating appointment card */}
            <div
              className="float-card rounded-2xl p-4 shadow-2xl"
              style={{ background: COLOR.white, maxWidth: "260px" }}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: COLOR.sageLight }}
                >
                  <CalendarClock size={14} style={{ color: COLOR.sage }} />
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: COLOR.inkSoft,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  NEXT APPOINTMENT
                </span>
              </div>
              <p
                className="text-[14px] font-semibold"
                style={{ color: COLOR.ink }}
              >
                Dr. Alina Cho — Cardiology
              </p>
              <p
                className="text-[12px] mt-0.5"
                style={{ color: COLOR.inkSoft }}
              >
                Tue, July 21 · 10:30 AM
              </p>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="w-full lg:w-[54%] flex items-center justify-center px-6 sm:px-12 lg:px-16 py-8 overflow-y-auto">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2.5 mb-7">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: COLOR.sage }}
              >
                <HeartPulse
                  className="text-white"
                  size={18}
                  strokeWidth={2.25}
                />
              </div>
              <span
                className="text-[15px] font-semibold tracking-tight"
                style={{ color: COLOR.ink }}
              >
                Riverside General Hospital
              </span>
            </div>

            <div className="mb-5">
              <h2
                className="text-3xl leading-tight"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 500,
                  color: COLOR.ink,
                }}
              >
                {isSignup ? "Create your account" : "Welcome back"}
              </h2>
            </div>

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

              {isSignup && (
                <Field label="Full name">
                  <User size={17} style={{ color: COLOR.inkSoft }} />
                  <input
                    className="w-full outline-none bg-transparent py-3 placeholder:text-[#9AA6A0]"
                    style={{ color: COLOR.ink }}
                    type="text"
                    name="name"
                    placeholder="Jordan Reyes"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </Field>
              )}

              {isSignup && (
                <div className="mb-3">
                  <label
                    className="block text-[11.5px] font-medium mb-1.5"
                    style={{
                      color: COLOR.inkSoft,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    Role
                  </label>
                  <div
                    className="relative flex items-center gap-2.5 px-3.5 rounded-lg border"
                    style={{ borderColor: COLOR.line, background: COLOR.white }}
                  >
                    <ShieldCheck
                      size={17}
                      style={{ color: COLOR.inkSoft }}
                      className="shrink-0"
                    />
                    <select
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full appearance-none outline-none bg-transparent py-3 pr-6 text-[14px]"
                      style={{ color: COLOR.ink }}
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      style={{ color: COLOR.inkSoft }}
                      className="absolute right-3.5 pointer-events-none"
                    />
                  </div>
                </div>
              )}

              <Field label="Email">
                <Mail size={17} style={{ color: COLOR.inkSoft }} />
                <input
                  className="w-full outline-none bg-transparent py-3 placeholder:text-[#9AA6A0]"
                  style={{ color: COLOR.ink }}
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </Field>

              {isSignup && (
                <Field label="Phone">
                  <Phone size={17} style={{ color: COLOR.inkSoft }} />
                  <input
                    className="w-full outline-none bg-transparent py-3 placeholder:text-[#9AA6A0]"
                    style={{ color: COLOR.ink }}
                    type="tel"
                    name="phone"
                    placeholder="(555) 123-4567"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </Field>
              )}

              <Field label="Password" noMargin>
                <Lock size={17} style={{ color: COLOR.inkSoft }} />
                <input
                  className="w-full outline-none bg-transparent py-3 placeholder:text-[#9AA6A0]"
                  style={{ color: COLOR.ink }}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="shrink-0"
                  style={{ color: COLOR.inkSoft }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </Field>

              {!isSignup ? (
                <div className="text-right text-[13px] mt-3 mb-7">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="font-medium hover:underline"
                    style={{ color: COLOR.sage }}
                  >
                    Forgot password?
                  </button>
                </div>
              ) : (
                <label
                  className="flex items-start gap-2.5 mt-2 mb-5 text-[12.5px] leading-relaxed"
                  style={{ color: COLOR.inkSoft }}
                >
                  <input
                    type="checkbox"
                    name="agree"
                    checked={form.agree}
                    onChange={handleChange}
                    className="mt-0.5"
                    style={{ accentColor: COLOR.sage }}
                  />
                  I agree to the patient privacy policy and consent to being
                  contacted about my care.
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-[14px] transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: COLOR.sage, color: COLOR.white }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = COLOR.sageDark)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = COLOR.sage)
                }
              >
                {loading ? (
                  "Please wait…"
                ) : (
                  <>
                    {isSignup ? "Create account" : "Sign in"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p
                className="text-center mt-4 text-[13.5px]"
                style={{ color: COLOR.inkSoft }}
              >
                {isSignup ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/signin")}
                      className="font-medium hover:underline"
                      style={{ color: COLOR.sage }}
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    New patient?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/signup")}
                      className="font-medium hover:underline"
                      style={{ color: COLOR.sage }}
                    >
                      Create an account
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children, noMargin }) => (
  <div className={noMargin ? "mb-2" : " "}>
    <label
      className="block text-[11.5px] font-medium mb-1.5"
      style={{ color: "#5B6B64", fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {label}
    </label>
    <div
      className="flex items-center gap-2.5 px-3.5 rounded-lg border transition-all"
      style={{ borderColor: "#DBE2DA", background: "#FFFFFF" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#3F6B57")}
    >
      {children}
    </div>
  </div>
);

export default Auth;