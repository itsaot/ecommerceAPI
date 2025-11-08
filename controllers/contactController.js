const nodemailer = require("nodemailer");

// Create transporter using your cPanel email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mail.wisetenengeneering.co.za",
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // SSL for port 465
  auth: {
    user: process.env.SMTP_USER || "sales@wisetenengeneering.co.za",
    pass: process.env.SMTP_PASS, // put your email password in .env
  },
});

// POST /api/contact
exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    console.log("📩 Contact form received:", req.body);

    const mailOptions = {
      from: `"${name}" <${email}>`, // sender address
      to: process.env.CONTACT_RECEIVER_EMAIL || "sales@wisetenengeneering.co.za",
      subject: `Contact Form: ${subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log("✅ Contact email sent successfully!");
    res.status(200).json({ message: "Contact form submitted successfully" });
  } catch (err) {
    console.error("❌ Contact email error:", err);
    res.status(500).json({ message: "Failed to send contact form", error: err.message });
  }
};
