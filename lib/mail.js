import nodemailer from 'nodemailer';

let cachedTransporter = null;

function getTransporter() {
  if (!process.env.EMAIL_SERVER_HOST) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  }

  return cachedTransporter;
}

// Sends an email if EMAIL_SERVER_HOST is configured; otherwise logs it (dev fallback).
// Never throws - callers should not have to special-case missing email config.
export async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[mail] EMAIL_SERVER_HOST not set, skipping send. To: ${to} Subject: ${subject}\n${html}`);
    return { sent: false };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_SERVER_USER,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error('[mail] Email sending failed:', error);
    console.log(`[mail] Fallback log - To: ${to} Subject: ${subject}\n${html}`);
    return { sent: false, error };
  }
}
