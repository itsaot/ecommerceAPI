// controllers/contactController.js
const nodemailer = require("nodemailer");

// Create the transporter using your domain.co.za SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // e.g., mail.wisetenengeneering.co.za
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true", // true for 465
  auth: {
    user: process.env.SMTP_USER,    // sales@wisetenengeneering.co.za
    pass: process.env.SMTP_PASS,
  },
});

// POST /api/contact
exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    console.log("📩 Contact form received:", req.body);

    const mailOptions = {
      from: `"${name}" <${email}>`,  // sender from form
      to: process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER,
      subject: `Contact Form: ${subject}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Message: ${message}
      `,
    };

    console.log("✉️ Sending email with options:", mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);

    res.status(200).json({ message: "Contact form submitted successfully" });
  } catch (err) {
    console.error("❌ Contact form error:", err);
    res.status(500).json({ message: "Failed to send contact form", error: err.message });
  }
};
