import { useSearchParams, Link } from "react-router-dom";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const status = params.get("status");

  const content = {
    success: {
      title: "Payment successful",
      message: "Your appointment is confirmed. You can close this tab and return to the chat.",
      color: "text-emerald-700",
    },
    payment_ok_booking_failed: {
      title: "Payment received, booking issue",
      message:
        "Your payment went through, but the slot filled up right before we could confirm it. Our team will contact you to reschedule or refund.",
      color: "text-amber-600",
    },
    failed: {
      title: "Payment failed",
      message: "Something went wrong or the payment was cancelled. No charge was made — please try again.",
      color: "text-red-600",
    },
  }[status] || {
    title: "Unknown status",
    message: "We couldn't determine the payment outcome. Please check your appointments list.",
    color: "text-slate-600",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-10 text-center shadow-sm">
        <h2 className={`text-xl font-semibold ${content.color}`}>{content.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{content.message}</p>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          Back to home
        </Link>
      </div>
    </div>
  );
}