const SibApiV3Sdk = require("@getbrevo/brevo");

// Initialize Brevo client
const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

exports.sendContactEmail = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`📩 [${timestamp}] Contact form received:`);
  console.log(req.body);

  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      console.warn(`⚠️ [${timestamp}] Missing required fields`);
      return res.status(400).json({ message: "Missing required fields" });
    }

    const emailData = {
      sender: {
        name: "Wisten Engineering Website",
        email: process.env.SMTP_FROM,
      },
      to: [
        { email: process.env.CONTACT_RECEIVER_EMAIL, name: "Sales Team" },
      ],
      cc: [
        { email: process.env.CONTACT_CC_EMAIL, name: "Admin" },
      ],
      replyTo: { email, name },
      subject: `Contact Form: ${subject}`,
      textContent: `
Name: ${name}
Email: ${email}
Phone: ${phone || "N/A"}
Message: ${message}
      `,
    };

    console.log(`✉️ [${timestamp}] Sending via Brevo API...`);
    console.log(emailData);

    const result = await client.sendTransacEmail(emailData);

    console.log(`✅ [${timestamp}] Email sent successfully!`);
    console.log("Message ID:", result.messageId);

    res.status(200).json({
      message: "Contact form submitted successfully",
      messageId: result.messageId,
    });
  } catch (err) {
    console.error(`❌ [${timestamp}] Failed to send email:`);
    console.error(err.response?.text || err.message);

    res.status(500).json({
      message: "Failed to send contact form",
      error: err.message,
      details: err.response?.text || null,
    });
  }
};
