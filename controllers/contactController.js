const nodemailer = require("nodemailer");

// Create the transporter using Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "false", // false for 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // allows TLS on shared hosts
  },
});

// Verify transporter on startup
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP transporter verification failed:", err);
  } else {
    console.log("✅ SMTP transporter ready to send emails");
  }
});

// POST /api/contact
exports.sendContactEmail = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📩 [${timestamp}] Contact form received:`);
  console.log(req.body);

  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.warn(`⚠️ [${timestamp}] Missing required fields`);
      return res.status(400).json({ message: "Missing required fields" });
    }

    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_FROM}>`, // Your domain email
      replyTo: email, // So replies go to user
      to: process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_FROM,
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
    console.log("Response:", info.response);

    res.status(200).json({
      message: "Contact form submitted successfully",
      messageId: info.messageId,
    });
  } catch (err) {
    console.error(`❌ [${timestamp}] Failed to send contact email:`);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    console.error("Stack trace:", err.stack);

    res.status(500).json({
      message: "Failed to send contact form",
      error: err.message,
      code: err.code,
    });
  }
};
