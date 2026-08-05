import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PaymentFailure = () => {
  const navigate = useNavigate();

  const hasOpener = typeof window !== "undefined" && !!window.opener;

  useEffect(() => {
    if (!hasOpener) return;
    try {
      window.opener.postMessage(
        { type: "appointment-payment-result", status: "failed" },
        window.location.origin
      );
    } catch (err) {
      
    }
    
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-24 px-6 pb-20 text-center">
      <span className="inline-block text-[11px] font-semibold tracking-wide text-red-500 bg-red-50 rounded-full px-3 py-1.5 mb-5">
        Payment not completed
      </span>

      <h1 className="text-2xl font-semibold mb-3">
        Your payment didn't go through
      </h1>
      <p className="text-sm text-[#4A6B62] mb-6">
        Nothing was booked and nothing was charged. You can try again with
        the same details.
      </p>

      <button
        onClick={() => navigate("/appointment/payment")}
        className="bg-[#0F6E56] text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-[#0C5744]"
      >
        Try payment again
      </button>

      {hasOpener && (
        <p className="mt-4 text-xs text-[#4A6B62]">
          The assistant tab has been notified — you can also close this tab and try again from there.
        </p>
      )}
    </div>
  );
};

export default PaymentFailure;