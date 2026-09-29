import nodemailer from 'nodemailer';

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

export async function sendOtpEmail(toEmail: string, name: string, otp: string) {
  if (!emailUser || !emailPass) {
    console.warn('EMAIL_USER or EMAIL_PASS environment variables are not set in .env.local.');
    throw new Error('Email service is not configured. Please add EMAIL_USER and EMAIL_PASS to .env.local');
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e11d48; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">CINETRACK</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Verification Code</p>
      </div>
      
      <div style="background-color: #1e293b; padding: 24px; border-radius: 10px; border: 1px solid #334155; margin-bottom: 24px;">
        <p style="margin-top: 0; font-size: 16px; color: #cbd5e1;">Hello <strong style="color: #ffffff;">${name}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.5; font-size: 14px;">Welcome to CineTrack! Please use the 6-digit verification code below to activate your account:</p>
        
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f43f5e; background-color: #0f172a; padding: 12px 24px; border-radius: 8px; border: 1px dashed #f43f5e; display: inline-block;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0; text-align: center;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>

      <div style="text-align: center; color: #475569; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} CineTrack. All rights reserved.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"CineTrack Support" <${emailUser}>`,
    to: toEmail,
    subject: `Your CineTrack Verification Code: ${otp}`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetOtpEmail(toEmail: string, name: string, otp: string) {
  if (!emailUser || !emailPass) {
    console.warn('EMAIL_USER or EMAIL_PASS environment variables are not set in .env.local.');
    throw new Error('Email service is not configured. Please add EMAIL_USER and EMAIL_PASS to .env.local');
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e11d48; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">CINETRACK</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Password Reset Code</p>
      </div>
      
      <div style="background-color: #1e293b; padding: 24px; border-radius: 10px; border: 1px solid #334155; margin-bottom: 24px;">
        <p style="margin-top: 0; font-size: 16px; color: #cbd5e1;">Hello <strong style="color: #ffffff;">${name}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.5; font-size: 14px;">You requested to reset your password. Please use the 6-digit code below to set a new password:</p>
        
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f43f5e; background-color: #0f172a; padding: 12px 24px; border-radius: 8px; border: 1px dashed #f43f5e; display: inline-block;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0; text-align: center;">This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
      </div>

      <div style="text-align: center; color: #475569; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} CineTrack. All rights reserved.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"CineTrack Support" <${emailUser}>`,
    to: toEmail,
    subject: `Reset Your CineTrack Password Code: ${otp}`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
}
