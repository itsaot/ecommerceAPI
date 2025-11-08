const nodemailer = require("nodemailer");

// Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "false", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify().then(() => console.log("✅ SMTP transporter verified")).catch(console.error);

exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    console.log("📩 Contact form received:", req.body);

    if (!process.env.CONTACT_RECEIVER_EMAIL) {
      throw new Error("CONTACT_RECEIVER_EMAIL not set in environment variables");
    }

    const mailOptions = {
      from: email, // user submitting the form
      to: process.env.CONTACT_RECEIVER_EMAIL, // support email
      subject: `Contact Form: ${subject}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Contact email sent:", info.messageId);
    res.status(200).json({ message: "Contact form submitted successfully" });
  } catch (err) {
    console.error("❌ Contact form error:", err);
    res.status(500).json({ message: "Failed to send contact form", error: err.message });
  }
};
