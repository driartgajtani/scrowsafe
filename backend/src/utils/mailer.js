const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.get('SMTP_HOST') || 'smtp.gmail.com',
      port: env.get('SMTP_PORT'),
      secure: env.get('SMTP_PORT') === 465,
      auth: {
        user: env.get('SMTP_USER'),
        pass: env.get('SMTP_PASS'),
      },
    });
  }
  return transporter;
}

const sendMail = async (to, subject, html) => {
  const from = env.get('FROM_EMAIL');

  try {
    const info = await getTransporter().sendMail({ from, to, subject, html });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    throw error;
  }
};

module.exports = { sendMail };
