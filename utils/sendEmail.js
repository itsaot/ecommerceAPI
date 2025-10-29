const nodemailer = require('nodemailer');
require('dotenv').config();
const Order = require('../models/Order');

async function sendEmail({ to, subject, html, orderId }) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: +process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully:', info.messageId);

    // Save receipt in Order document
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        receipt: {
          html,
          sentAt: new Date()
        }
      });
      console.log('Receipt saved in order');
    }

    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
}

module.exports = sendEmail;
