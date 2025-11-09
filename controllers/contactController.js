const SibApiV3Sdk = require('sib-api-v3-sdk');

// Configure Brevo SDK
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const brevo = new SibApiV3Sdk.TransactionalEmailsApi();

// POST /api/contact
exports.sendContactEmail = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📩 [${timestamp}] Contact form received:`);
  console.log(req.body);

  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      console.warn(`⚠️ [${timestamp}] Missing required fields`);
      return res.status(400).json({ message: "Missing required fields" });
    }

    const emailData = {
      sender: { email: process.env.SMTP_FROM, name: "Website Contact" },
      to: [{ email: process.env.CONTACT_RECEIVER_EMAIL }],
      cc: [{ email: process.env.CONTACT_CC_EMAIL }],
      subject: `Contact Form: ${subject}`,
      htmlContent: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || "N/A"}</p>
        <p><b>Message:</b><br>${message}</p>
      `,
      replyTo: { email },
    };

    console.log(`✉️ [${timestamp}] Sending email via Brevo API...`);
    const response = await brevo.sendTransacEmail(emailData);

    console.log(`✅ [${timestamp}] Email sent successfully!`);
    console.log("Response:", response);

    res.status(200).json({
      message: "Contact form submitted successfully",
      messageId: response.messageId,
    });
  } catch (err) {
    console.error(`❌ [${timestamp}] Failed to send email:`, err);
    res.status(500).json({
      message: "Failed to send contact form",
      error: err.message,
    });
  }
};
