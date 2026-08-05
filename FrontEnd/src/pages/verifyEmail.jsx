import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";


export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Verification link is missing a token.");
        return;
      }

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/user/verify-email/${token}`
        );

        if (!isMounted) return;
        setStatus("success");
        setMessage(res.data?.message || "Email verified successfully.");
      } catch (err) {
        if (!isMounted) return;
        const serverMessage = err.response?.data?.message;

        if (serverMessage === "Email already verified") {
          setStatus("already");
          setMessage(serverMessage);
        } else {
          setStatus("error");
          setMessage(serverMessage || "Invalid or expired verification link.");
        }
      }
    }

    verify();
    return () => {
      isMounted = false;
    };
  }, [token]);

  
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-10 text-center shadow-sm">
        {status === "verifying" && (
          <>
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-700" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Verifying your email…
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              This will only take a moment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-700">
              ✓
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Email verified
            </h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <p className="mt-2 text-xs text-slate-400">
              Redirecting you to the home page…
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
            >
              Go to Home
            </button>
          </>
        )}

        {status === "already" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-xl font-bold text-emerald-700">
              i
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Already verified
            </h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <button
              onClick={() => navigate("/signin")}
              className="mt-6 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
            >
              Go to login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600">
              ✕
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Verification failed
            </h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <Link
              to="/signin"
              className="mt-6 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}