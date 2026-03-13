const nodemailer = require('nodemailer');

/**
 * Email Service (Nodemailer)
 *
 * Features:
 * - SMTP transporter via Gmail (or any SMTP)
 * - Styled HTML OTP email
 * - Welcome email post-verification
 * - Console fallback in dev if SMTP_PASS is not set
 */

/**
 * Create Nodemailer transporter from env variables
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false // Allow self-signed certificates in dev
        }
    });
};

/**
 * Check if email is configured
 * @returns {Boolean} True if SMTP is configured
 */
const isEmailConfigured = () => {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
};

/**
 * Send OTP verification email
 *
 * @param {String} to - Recipient email
 * @param {String} otp - 6-digit OTP code
 * @param {String} username - User's display name (firstName or username)
 * @returns {Promise<void>}
 */
const sendOTPEmail = async (to, otp, username = 'User') => {
    // Dev mode fallback: log OTP to console if SMTP not configured
    if (!isEmailConfigured()) {
        console.log('\n================================================');
        console.log('[EMAIL SERVICE - DEV MODE] OTP Email Suppressed');
        console.log(`  To      : ${to}`);
        console.log(`  User    : ${username}`);
        console.log(`  OTP Code: ${otp}`);
        console.log('================================================\n');
        return;
    }

    const transporter = createTransporter();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OTP Verification - OpenSystems</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">OpenSystems</h1>
              <p style="margin:8px 0 0;color:#c4b5fd;font-size:14px;">Identity Verification</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:22px;font-weight:600;">Hello, ${username} 👋</h2>
              <p style="margin:0 0 28px;color:#94a3b8;font-size:15px;line-height:1.6;">
                Your one-time verification code is below. This code expires in <strong style="color:#f1f5f9;">10 minutes</strong>.
                Do not share this code with anyone.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background-color:#0f172a;border:2px solid #6366f1;border-radius:12px;padding:24px 40px;text-align:center;">
                      <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Verification Code</p>
                      <p style="margin:0;color:#a5b4fc;font-size:42px;font-weight:700;letter-spacing:12px;font-family:monospace;">${otp}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                If you did not create an account or request this code, please ignore this email.
                Your account will not be activated without verification.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">
                &copy; ${new Date().getFullYear()} OpenSystems. This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"OpenSystems" <${process.env.SMTP_USER}>`,
        to,
        subject: `${otp} is your OpenSystems verification code`,
        html: htmlContent,
        text: `Your OpenSystems verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] OTP email sent to ${to}`);
};

/**
 * Send welcome email after email verification
 *
 * @param {String} to - Recipient email
 * @param {String} username - User's display name
 * @returns {Promise<void>}
 */
const sendWelcomeEmail = async (to, username = 'User') => {
    if (!isEmailConfigured()) {
        console.log(`[EMAIL SERVICE - DEV MODE] Welcome email suppressed for ${to}`);
        return;
    }

    const transporter = createTransporter();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Welcome to OpenSystems</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <tr>
            <td style="background:linear-gradient(135deg,#10b981,#059669);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Welcome to OpenSystems! 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:20px;">Hey ${username},</h2>
              <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.6;">
                Your account has been verified and is now active. Welcome to OpenSystems — a platform to collaborate, build, and share ideas.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:15px;line-height:1.6;">
                Start exploring, join projects, and connect with the community.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">&copy; ${new Date().getFullYear()} OpenSystems</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"OpenSystems" <${process.env.SMTP_USER}>`,
        to,
        subject: `Welcome to OpenSystems, ${username}!`,
        html: htmlContent,
        text: `Hey ${username}, your OpenSystems account is now active. Welcome to the platform!`
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Welcome email sent to ${to}`);
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    isEmailConfigured
};
