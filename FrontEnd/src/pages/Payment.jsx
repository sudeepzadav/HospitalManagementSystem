import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// eSewa's sandbox/test payment form endpoint (ePay v2).
// Set VITE_ESEWA_FORM_URL in your frontend .env (swap to eSewa's
// production URL there when you go live) — falls back to the test URL
// if it's not set.
const ESEWA_FORM_URL =
  import.meta.env.VITE_ESEWA_FORM_URL ||
  "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

const Payment = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [esewaFields, setEsewaFields] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingBooking");
    if (!stored) {
      // Nothing to pay for — send them back to search.
      navigate("/appointment");
      return;
    }
    setBooking(JSON.parse(stored));
  }, [navigate]);

  async function handlePay() {
    if (!booking) return;

    setLoading(true);
    setError("");

    try {
      // The backend generates the eSewa signature with the secret key
      // (never do this in the browser) and returns everything the
      // hidden form below needs.
      //
      // Expected response shape:
      // {
      //   transactionUuid, amount, taxAmount, totalAmount,
      //   productCode, serviceCharge, deliveryCharge,
      //   signature, signedFieldNames
      // }
      const res = await api.post("/payments/esewa/initiate", {
        doctorId: booking.doctorId,
        department: booking.department,
        date: booking.date,
        patient: booking.patient,
        amount: booking.consultationFee,
        reason: booking.reason,
      });

      setEsewaFields(res.data);
    } catch (err) {
      setError("Couldn't start the payment. Please try again.");
      setLoading(false);
    }
  }

  // Auto-submit the hidden form to eSewa the moment we have signed fields.
  useEffect(() => {
    if (esewaFields && formRef.current) {
      formRef.current.submit();
    }
  }, [esewaFields]);

  if (!booking) return null;

  return (
    <div className="max-w-2xl mx-auto mt-20 px-6 pb-20">
      <h1 className="text-2xl font-semibold mb-6">Confirm &amp; pay</h1>

      <div className="bg-[#F5F8F6] border border-[#DDE6E2] rounded-2xl p-6 mb-6">
        <h2 className="text-xs font-semibold text-[#4A6B62] uppercase tracking-wide mb-4">
          Appointment summary
        </h2>

        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-[#4A6B62]">Patient</dt>
          <dd className="font-medium">
            {booking.patient.name} ({booking.patient.age}, {booking.patient.gender})
          </dd>

          <dt className="text-[#4A6B62]">Doctor</dt>
          <dd className="font-medium">Dr. {booking.doctorName}</dd>

          <dt className="text-[#4A6B62]">Department</dt>
          <dd className="font-medium">{booking.department}</dd>

          <dt className="text-[#4A6B62]">Date</dt>
          <dd className="font-medium">
            {new Date(booking.date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </dd>

          <dt className="text-[#4A6B62]">Consultation fee</dt>
          <dd className="font-semibold">NPR {booking.consultationFee}</dd>

          {booking.reason && (
            <>
              <dt className="text-[#4A6B62]">Reason for visit</dt>
              <dd className="font-medium">{booking.reason}</dd>
            </>
          )}
        </dl>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-[#0F6E56] text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-[#0C5744] disabled:opacity-60"
      >
        {loading ? "Redirecting to eSewa…" : `Pay NPR ${booking.consultationFee} with eSewa`}
      </button>

      <p className="text-xs text-[#4A6B62] mt-3 text-center">
        You'll be redirected to eSewa's test gateway to complete payment.
      </p>

      {/* Hidden form that hands off to eSewa once the backend returns a signed payload */}
      {esewaFields && (
        <form ref={formRef} action={ESEWA_FORM_URL} method="POST" className="hidden">
          <input type="hidden" name="amount" value={esewaFields.amount} />
          <input type="hidden" name="tax_amount" value={esewaFields.taxAmount || 0} />
          <input type="hidden" name="total_amount" value={esewaFields.totalAmount} />
          <input type="hidden" name="transaction_uuid" value={esewaFields.transactionUuid} />
          <input type="hidden" name="product_code" value={esewaFields.productCode || "EPAYTEST"} />
          <input
            type="hidden"
            name="product_service_charge"
            value={esewaFields.serviceCharge || 0}
          />
          <input
            type="hidden"
            name="product_delivery_charge"
            value={esewaFields.deliveryCharge || 0}
          />
          <input
            type="hidden"
            name="success_url"
            value={`${window.location.origin}/appointment/success`}
          />
          <input
            type="hidden"
            name="failure_url"
            value={`${window.location.origin}/appointment/failure`}
          />
          <input
            type="hidden"
            name="signed_field_names"
            value={esewaFields.signedFieldNames || "total_amount,transaction_uuid,product_code"}
          />
          <input type="hidden" name="signature" value={esewaFields.signature} />
        </form>
      )}
    </div>
  );
};

export default Payment;