const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const Appointment = require("../model/appointmentSchema");
const Doctor = require("../model/doctorSchema");


// GET /api/appointments/:id/pdf
async function generateAppointmentPdf(req, res) {
  try {
    const { id } = req.params;
 
    const appointment = await Appointment.findById(id).populate("patientId");
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }
 
    
    const requesterId = req.user?._id || req.user?.id;
    const bookingUserId = appointment.patientId?.userId;
    if (!bookingUserId || String(bookingUserId) !== String(requesterId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this appointment." });
    }
 
    const doctor = await Doctor.findById(appointment.doctorId).populate(
      "userId",
      "name"
    );
    const doctorName = doctor?.userId?.name || "Doctor";
 
    // Encode the key details so front-desk staff can scan and pull up the
    // appointment instantly instead of asking the patient to spell things out.
    const qrPayload = JSON.stringify({
      appointmentId: appointment._id.toString(),
      token: appointment.tokenNumber,
      date: new Date(appointment.date).toISOString().split("T")[0],
    });
    const qrDataUrl = await QRCode.toDataURL(qrPayload);
    const qrImageBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
 
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=appointment-${appointment._id}.pdf`
    );
 
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);
 
    // ---- Header ----
    doc
      .fontSize(20)
      .fillColor("#0F6E56")
      .text("Cedar Grove Health", { align: "left" });
    doc
      .fontSize(12)
      .fillColor("#4A6B62")
      .text("Appointment Confirmation")
      .moveDown(1.5);
 
    // ---- Appointment details ----
    doc.fillColor("#12312B").fontSize(11);
 
    function row(label, value) {
      doc.font("Helvetica-Bold").text(label, { continued: true });
      doc.font("Helvetica").text(`  ${value}`);
      doc.moveDown(0.4);
    }
 
    row("Token Number:", appointment.tokenNumber);
    row("Patient Name:", appointment.patientDetails.name);
    row("Age:", appointment.patientDetails.age);
    row("Gender:", appointment.patientDetails.gender);
    row("Problem / Reason for Visit:", appointment.reason || "Not specified");
    row("Doctor:", `Dr. ${doctorName}`);
    row("Department:", appointment.department);
    row(
      "Date:",
      new Date(appointment.date).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    row("Consultation Fee:", `NPR ${appointment.consultationFee}`);
    row("Status:", appointment.status);
 
    doc.moveDown(1);
 
    // ---- QR code ----
    doc
      .fontSize(10)
      .fillColor("#4A6B62")
      .text("Show this QR code at the front desk on arrival:");
    doc.moveDown(0.5);
    doc.image(qrImageBuffer, { width: 120 });
 
    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor("#8A9A94")
      .text(
        "This is a system-generated confirmation. Please arrive 15 minutes before your scheduled time.",
        { align: "center" }
      );
 
    doc.end();
  } catch (err) {
    console.error("Appointment PDF error:", err);
    res.status(500).json({ message: "Could not generate appointment PDF." });
  }
}
 
module.exports = { generateAppointmentPdf };