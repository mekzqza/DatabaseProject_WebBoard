const nodemailer = require('nodemailer');

require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: (String(process.env.SMTP_SECURE || 'true') === 'true' || Number(process.env.SMTP_PORT || 465) === 465),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetEmail(toEmail, resetLink, username) {
  const html = `
    <p>สวัสดี ${username || ''},</p>
    <p>คุณได้รับอีเมลนี้เพราะมีการร้องขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ.</p>
    <p><a href="${resetLink}" style="padding:10px 14px;background:#0f1724;color:#fff;border-radius:6px;text-decoration:none;">รีเซ็ตรหัสผ่าน</a></p>
    <p>ลิงก์นี้จะใช้งานได้ภายใน ${process.env.RESET_TOKEN_EXPIRES_MINUTES || 60} นาที หากคุณไม่ได้ร้องขอ โปรดเพิกเฉย</p>
  `;
  try {
    console.log('Sending reset email to:', toEmail);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: 'รีเซ็ตรหัสผ่าน — WebBoard',
      html,
    });
    console.log('sendMail result:', {
      messageId: info && info.messageId,
      accepted: info && info.accepted,
      rejected: info && info.rejected,
      response: info && info.response,
    });
    return info;
  } catch (err) {
    console.error('sendResetEmail error:', err && (err.message || err));
    throw err;
  }
}

module.exports = { transporter, sendResetEmail };
