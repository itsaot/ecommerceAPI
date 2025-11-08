const nodemailer = require("nodemailer");

// Configure your email transporter (example using Gmail, replace with your service)
const transporter = nodemailer.createTransport({
  service: "Gmail", // or "SendGrid", "SMTP", etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/contact
exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      console.log("❌ Contact form submission missing fields:", req.body);
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create the email options
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.CONTACT_RECEIVER_EMAIL, // your email or admin email
      subject: `[Contact Page] ${subject}`,
      text: message,
      html: `<p>${message}</p><p>From: ${name} (${email})</p>`,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Contact email sent:", info.response);

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("❌ Error sending contact email:", err);
    return res.status(500).json({ message: "Failed to send email", error: err.message });
  }
};
