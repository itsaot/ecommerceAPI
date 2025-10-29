require('dotenv').config(); // Must be first line
const sendEmail = require('./utils/sendEmail');


(async () => {
  try {
    await sendEmail({
      to: 'sales@wisetenengeneering.co.za',
      subject: 'Test Email from Backend',
      html: '<h3>✅ This is a test email</h3><p>If you received this, SMTP works!</p>'
    });
    console.log('Email sent successfully!');
  } catch (err) {
    console.error('Error sending email:', err);
  }
})();
