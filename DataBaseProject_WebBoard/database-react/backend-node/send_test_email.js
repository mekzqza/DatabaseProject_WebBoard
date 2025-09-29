require('dotenv').config();
const { transporter } = require('./src/utils/mailer');

async function main() {
  try {
    await transporter.verify();
    console.log('SMTP verified ok');
  } catch (e) {
    console.error('SMTP verify failed', e);
    process.exit(1);
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.TEST_TO || process.env.SMTP_USER,
      subject: 'Test email from WebBoard',
      html: `<p>ทดสอบการส่งอีเมลจาก WebBoard — ถ้าคุณได้รับ แปลว่า SMTP ทำงานแล้ว</p>`,
    });
    console.log('Message sent:', info.messageId || info);
    process.exit(0);
  } catch (e) {
    console.error('send failed', e);
    process.exit(1);
  }
}

main();
