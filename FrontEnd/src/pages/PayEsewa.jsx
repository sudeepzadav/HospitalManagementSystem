import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function PayEsewa() {
  const { transactionUuid } = useParams();
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await api.get(`/payments/form/${transactionUuid}`);
        setFormData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "This payment link is no longer valid.");
      }
    }
    loadForm();
  }, [transactionUuid]);

  const payNow = () => {
    if (!formData) return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = formData.formAction;

    Object.entries(formData.fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-10 text-center shadow-sm">
        {error && (
          <>
            <h2 className="text-xl font-semibold text-slate-900">Payment link invalid</h2>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
          </>
        )}

        {!error && !formData && (
          <p className="text-sm text-slate-500">Loading payment details…</p>
        )}

        {!error && formData && (
          <>
            <h2 className="text-xl font-semibold text-slate-900">Confirm payment</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              NPR {formData.fields.total_amount}
            </p>
            <p className="mt-1 text-sm text-slate-500">Consultation fee</p>
            <button
              onClick={payNow}
              className="mt-6 w-full rounded-lg bg-[#60BB46] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Pay with eSewa
            </button>
          </>
        )}
      </div>
    </div>
  );
}