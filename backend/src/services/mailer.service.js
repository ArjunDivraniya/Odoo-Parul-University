const nodemailer = require('nodemailer');

function getTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  if (emailUser && emailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  if (process.env.ALLOW_EMAIL_MOCK === 'true') {
    return null;
  }

  throw new Error('Email service is not configured. Set EMAIL_USER and EMAIL_PASS, or SMTP_HOST/SMTP_PORT.');
}

const sendUserCredentialsEmail = async ({ to, name, email, password, role, shopName }) => {
  const subject = `Your The Coffe Concept account credentials`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <h2 style="color: #1A4D2E;">Welcome to The Coffe Concept </h2>
      <p>Hello ${name},</p>
      <p>Your account has been created with the following credentials:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Role:</strong> ${role}</li>
        <li><strong>Temporary Password:</strong> ${password}</li>
      </ul>
      <p>Please sign in and change your password after the first login.</p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MAIL MOCK] User credentials email');
      console.log({ to, subject, email, password, role, shopName });
    }
    return { mocked: true };
  }

  try {
    await transporter.verify();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    throw new Error(`Failed to send user credentials email: ${error.message}`);
  }

  return { mocked: false };
};

const sendPasswordResetEmail = async ({ to, name, resetLink, shopName = 'The Coffe Concept' }) => {
  const subject = `The Coffe Concept : password reset request`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <h2 style="color: #1A4D2E;">Reset your ${shopName} password</h2>
      <p>Hello ${name || 'there'},</p>
      <p>We received a request to reset your password. Click the button below to choose a new password.</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}" style="display: inline-block; background: #1A4D2E; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 999px; font-weight: 700;">Reset Password</a>
      </p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MAIL MOCK] Password reset email');
      console.log({ to, subject, resetLink, shopName });
    }
    return { mocked: true };
  }

  try {
    await transporter.verify();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  return { mocked: false };
};

module.exports = {
  sendUserCredentialsEmail,
  sendPasswordResetEmail,
};