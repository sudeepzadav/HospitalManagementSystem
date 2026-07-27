import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // verifying | confirmed | error
  const [appointment, setAppointment] = useState(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPdf() {
    if (!appointment?.appointmentId) return;

    setDownloading(true);
    try {
      const res = await api.get(
        `/appointments/${appointment.appointmentId}/pdf`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `appointment-${appointment.appointmentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    async function confirm() {
      // eSewa appends a base64-encoded `data` query param to success_url.
      const data = searchParams.get("data");
      const stored = sessionStorage.getItem("pendingBooking");

      if (!data || !stored) {
        setStatus("error");
        return;
      }

      const booking = JSON.parse(stored);

      try {
        // Backend should: decode `data`, call eSewa's transaction status-check
        // API to confirm it really succeeded, then create the appointment
        // and return it.
        const res = await api.post("/payments/esewa/verify", {
          data,
          doctorId: booking.doctorId,
          date: booking.date,
          patient: booking.patient,
        });

        setAppointment(res.data);
        setStatus("confirmed");
        sessionStorage.removeItem("pendingBooking");
      } catch (err) {
        setStatus("error");
      }
    }

    confirm();
  }, [searchParams]);

  return (
    <div className="max-w-xl mx-auto mt-24 px-6 pb-20 text-center">
      {status === "verifying" && (
        <p className="text-sm text-[#4A6B62]">Confirming your payment…</p>
      )}

      {status === "error" && (
        <>
          <h1 className="text-xl font-semibold mb-2">
            We couldn't confirm this payment
          </h1>
          <p className="text-sm text-[#4A6B62] mb-6">
            If eSewa took payment but this page shows an error, contact
            support with your transaction ID before trying again.
          </p>
          <button
            onClick={() => navigate("/appointment")}
            className="bg-[#0F6E56] text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-[#0C5744]"
          >
            Back to search
          </button>
        </>
      )}

      {status === "confirmed" && appointment && (
        <>
          <span className="inline-block text-[11px] font-semibold tracking-wide text-[#0F6E56] bg-[#E1F5EE] rounded-full px-3 py-1.5 mb-5">
            Payment successful
          </span>

          <h1 className="text-2xl font-semibold mb-4">You're booked</h1>

          <div className="bg-[#F5F8F6] border border-[#DDE6E2] rounded-2xl p-6 text-left">
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-[#4A6B62]">Token number</dt>
              <dd className="font-semibold">{appointment.tokenNumber}</dd>

              <dt className="text-[#4A6B62]">Patient</dt>
              <dd className="font-medium">{appointment.patient?.name}</dd>

              <dt className="text-[#4A6B62]">Doctor</dt>
              <dd className="font-medium">Dr. {appointment.doctorName}</dd>

              <dt className="text-[#4A6B62]">Date</dt>
              <dd className="font-medium">
                {new Date(appointment.date).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </dl>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="mt-6 w-full bg-[#0F6E56] text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-[#0C5744] disabled:opacity-60"
          >
            {downloading ? "Preparing PDF…" : "Download appointment PDF"}
          </button>

          <button
            onClick={() => navigate("/")}
            className="mt-3 w-full border border-[#DDE6E2] text-[#12312B] rounded-lg px-5 py-3 text-sm font-semibold hover:bg-[#F5F8F6]"
          >
            Done
          </button>
        </>
      )}
    </div>
  );
};

export default PaymentSuccess;