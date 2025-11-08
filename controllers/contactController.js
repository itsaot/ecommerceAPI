const nodemailer = require("nodemailer");
require("dotenv").config();

// ✅ Create transporter (matches verified working setup)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465, // 465 = true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed/strict SSL
  },
});

// Verify transporter on startup
(async () => {
  try {
    console.log("🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP transporter ready");
  } catch (err) {
    console.error("❌ SMTP transporter verification failed:", err);
  }
})();

// POST /api/contact
exports.sendContactEmail = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📩 [${timestamp}] Contact form received:`, req.body);

  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate fields
    if (!name || !email || !subject || !message) {
      console.warn(`⚠️ [${timestamp}] Missing required fields`);
      return res.status(400).json({ message: "Missing required fields" });
    }

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER,
      subject: `Contact Form: ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone || "N/A"}
Message: ${message}
      `,
    };

    console.log(`✉️ [${timestamp}] Attempting to send email...`);
    console.log("Mail options:", mailOptions);

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ [${timestamp}] Email sent successfully!`);
    console.log("Message ID:", info.messageId);
    console.log("Envelope:", info.envelope);
    console.log("Response:", info.response);

    res.status(200).json({
      message: "Contact form submitted successfully",
      messageId: info.messageId,
    });
  } catch (err) {
    console.error(`❌ [${timestamp}] Failed to send contact email:`, err);
    res.status(500).json({
      message: "Failed to send contact form",
      error: err.message,
      code: err.code,
      stack: err.stack,
    });
  }
};
