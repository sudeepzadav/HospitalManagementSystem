const { transporter } = require("./transporter");

async function sendVerificationEmail(to, token) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "Email verification",
    text: "Please Verify Your Account",
    html: `<h1>Click on the link to verify your email</h1> <a href="${process.env.FRONTEND_URL}/verify-email/${token}">Verify Email</a>`,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
