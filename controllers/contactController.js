const nodemailer = require("nodemailer");

// Use SendGrid SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // e.g., smtp.sendgrid.net
  port: Number(process.env.SMTP_PORT), // usually 587
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,      // SendGrid username
    pass: process.env.SMTP_PASS,      // SendGrid password / API key
  },
});

// Verify SMTP connection at startup
transporter.verify()
  .then(() => console.log("✅ SMTP server ready"))
  .catch(err => console.error("❌ SMTP connection failed:", err));

exports.sendContactEmail = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  console.log("📩 Contact form received:", req.body);

  const emailDetails = {
    from: `"${name}" <${email}>`,
    to: process.env.CONTACT_RECEIVER_EMAIL,
    subject: `Contact Form: ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
    html: `<p><strong>Name:</strong> ${name}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Phone:</strong> ${phone}</p>
           <p><strong>Message:</strong><br/>${message}</p>`,
  };

  try {
    const info = await transporter.sendMail(emailDetails);
    console.log("✅ Contact email sent:", info.messageId);
    res.status(200).json({ message: "Contact form submitted successfully", info });
  } catch (err) {
    console.error("❌ Failed to send contact email:", err);
    res.status(500).json({ message: "Failed to send contact form", error: err.message });
  }
};
