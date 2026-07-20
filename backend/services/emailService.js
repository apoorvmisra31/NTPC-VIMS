const nodemailer = require('nodemailer');
const config = require('../config/env');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"NTPC VIMS" <${config.email.from}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

exports.sendRegistrationEmail = async (email, tempPassword, resetLink) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A6B3C;">Welcome to NTPC VIMS</h2>
      <p>Your account has been created. Please use the following credentials to login:</p>
      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <p>Please click the link below to set your password:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #1A6B3C; color: white; text-decoration: none; border-radius: 5px;">Set Password</a>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">This link will expire in 15 minutes.</p>
    </div>
  `;
  return this.sendEmail({ to: email, subject: 'NTPC VIMS - Account Registration', html });
};

exports.sendPasswordResetEmail = async (email, resetLink) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A6B3C;">Password Reset Request</h2>
      <p>You have requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #1A6B3C; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
      <p style="color: #666; font-size: 12px;">This link will expire in 15 minutes.</p>
    </div>
  `;
  return this.sendEmail({ to: email, subject: 'NTPC VIMS - Password Reset', html });
};

exports.sendRTVEmail = async (vendorEmail, invoiceNumber, reason) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Invoice Returned to Vendor</h2>
      <p>Your invoice <strong>${invoiceNumber}</strong> has been returned.</p>
      <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      <p>Please log in to the portal to review and resubmit.</p>
    </div>
  `;
  return this.sendEmail({ to: vendorEmail, subject: 'NTPC VIMS - Invoice Returned', html });
};
