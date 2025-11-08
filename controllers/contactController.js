const nodemailer = require("nodemailer");

// Create the transporter using your SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true", // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// POST /api/contact
exports.sendContactEmail = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📧 [${timestamp}] Contact form submission received:`);
  console.log(req.body);

  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
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

    console.log(`✉️ [${timestamp}] Sending email with options:`, mailOptions);

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ [${timestamp}] Email sent successfully, messageId: ${info.messageId}`);

    res.status(200).json({ message: "Contact form submitted successfully", messageId: info.messageId });
  } catch (err) {
    console.error(`❌ [${timestamp}] Failed to send contact email:`, err);
    res.status(500).json({
      message: "Failed to send contact form",
      error: err.message,
      stack: err.stack, // include stack trace for debugging
    });
  }
};
