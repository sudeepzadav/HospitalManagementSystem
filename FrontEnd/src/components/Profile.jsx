import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { FaCheckCircle, FaExclamationTriangle, FaCamera } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const INK = "#122A2A";
const MUTED = "#5B7373";
const FAINT = "#8AA0A0";
const BORDER = "#E1E8E7";
const SURFACE = "#F6F8F8";
const BRAND = "#0E6E66";
const BRAND_SOFT = "#E4F1EF";
const DANGER = "#D64545";
const DANGER_SOFT = "#FCEBEB";

const SERVER_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

function imageUrl(path) {
  if (!path) return null;
  return `${SERVER_ORIGIN}${path}`;
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

function Field({ label, value, onChange, type = "text", error }) {
  return (
    <div>
      <label
        className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5"
        style={{ color: FAINT }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#0E6E66]"
        style={{ borderColor: error ? DANGER : BORDER, color: INK }}
      />
      {error && (
        <p className="text-xs mt-1" style={{ color: DANGER }}>
          {error}
        </p>
      )}
    </div>
  );
}

const ProfilePage = () => {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "success" | "error" | null
  const [saveMessage, setSaveMessage] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    api
      .get("/user/me")
      .then((res) => {
        const user = res.data?.user || res.data;
        setProfile(user);
        setForm({
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
        });
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const hasChanges =
    profile &&
    (form.name !== (profile.name || "") ||
      form.email !== (profile.email || "") ||
      form.phone !== (profile.phone || ""));

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name can't be empty.";
    if (!form.email.trim()) {
      errors.email = "Email can't be empty.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "That doesn't look like a valid email.";
    }
    if (form.phone && !/^[0-9+\-\s()]{7,15}$/.test(form.phone)) {
      errors.phone = "That doesn't look like a valid phone number.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    setSaveStatus(null);
    if (!validate()) return;

    setSaving(true);
    try {
      const userId = profile._id || profile.id;

      const res = await api.put(`/user/update/${userId}`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      const updated = res.data?.user || res.data;
      setProfile(updated);

      // Keep Navbar and everywhere else that reads the logged-in user
      // in sync immediately, without needing a refresh.
      updateUser({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
      });

      setSaveStatus("success");
      setSaveMessage("Profile updated.");
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(
        err.response?.data?.message ||
          "Couldn't save changes. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
    });
    setFieldErrors({});
    setSaveStatus(null);
  }

  async function handleImageSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Please choose a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/user/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile((p) => ({ ...p, profileImage: res.data.profileImage }));

      // Push the new picture into context so the Navbar (and anywhere
      // else showing the avatar) updates immediately, no refresh needed.
      updateUser({ profileImage: res.data.profileImage });
    } catch (err) {
      setUploadError(
        err.response?.data?.message ||
          "Couldn't upload image. Please try again.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen" style={{ background: SURFACE }}>
      <style>{`.brand-font { font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; }`}</style>

      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <h1
          className="brand-font text-2xl font-semibold mb-1"
          style={{ color: INK }}
        >
          Profile
        </h1>
        <p className="text-sm mb-8" style={{ color: MUTED }}>
          Manage your account details.
        </p>

        {loading && (
          <div
            className="border rounded-2xl p-8 bg-white animate-pulse"
            style={{ borderColor: BORDER }}
          />
        )}

        {!loading && loadError && (
          <div
            className="border rounded-2xl p-6 bg-white flex items-start gap-3"
            style={{ borderColor: BORDER }}
          >
            <FaExclamationTriangle
              size={16}
              style={{ color: DANGER }}
              className="mt-0.5 shrink-0"
            />
            <p className="text-sm" style={{ color: DANGER }}>
              Couldn't load your profile. Make sure you're logged in and try
              refreshing.
            </p>
          </div>
        )}

        {!loading && !loadError && profile && (
          <div
            className="border rounded-2xl bg-white overflow-hidden"
            style={{ borderColor: BORDER }}
          >
            {/* Header strip */}
            <div
              className="p-6 flex items-center gap-4 border-b"
              style={{ borderColor: BORDER }}
            >
              <div className="relative shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold overflow-hidden relative group disabled:opacity-70"
                  style={{ background: BRAND }}
                  title="Change profile picture"
                >
                  {profile.profileImage ? (
                    <img
                      src={imageUrl(profile.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials(form.name)
                  )}
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                    <FaCamera
                      size={14}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelected}
                  className="hidden"
                />
                {uploading && (
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white animate-pulse"
                    style={{ background: BRAND }}
                  />
                )}
              </div>
              <div>
                <p className="font-semibold" style={{ color: INK }}>
                  {form.name || "—"}
                </p>
                <p className="text-xs" style={{ color: MUTED }}>
                  {profile.role
                    ? profile.role.charAt(0).toUpperCase() +
                      profile.role.slice(1)
                    : "Patient"}
                </p>
                {uploadError && (
                  <p className="text-xs mt-1" style={{ color: DANGER }}>
                    {uploadError}
                  </p>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="p-6 flex flex-col gap-5">
              <Field
                label="Full name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                error={fieldErrors.name}
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                error={fieldErrors.email}
              />
              <Field
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                error={fieldErrors.phone}
              />

              {saveStatus && (
                <div
                  className="flex items-center gap-2 text-sm rounded-lg px-3 py-2.5"
                  style={{
                    background:
                      saveStatus === "success" ? BRAND_SOFT : DANGER_SOFT,
                    color: saveStatus === "success" ? BRAND : DANGER,
                  }}
                >
                  {saveStatus === "success" ? (
                    <FaCheckCircle size={13} />
                  ) : (
                    <FaExclamationTriangle size={13} />
                  )}
                  {saveMessage}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ background: BRAND }}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                {hasChanges && (
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold border"
                    style={{ borderColor: BORDER, color: MUTED }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
