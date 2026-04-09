// Test email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('🧪 Testing Email Configuration...\n');

    console.log('Environment Variables:');
    console.log('  EMAIL_USER:', process.env.EMAIL_USER);
    console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
    console.log('  SMTP_HOST:', process.env.SMTP_HOST);
    console.log('  SMTP_PORT:', process.env.SMTP_PORT);
    console.log('  SMTP_SECURE:', process.env.SMTP_SECURE);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    console.log('\n📧 Sending test email...');

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: 'Test Email - Interview Platform',
            html: `
                <h2>Test Email</h2>
                <p>If you received this, your email configuration is working correctly!</p>
                <p>Test OTP: <strong>123456</strong></p>
            `
        });

        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('\n✨ Email configuration is working correctly!');

    } catch (error) {
        console.error('\n❌ Email sending failed!');
        console.error('Error:', error.message);

        if (error.code === 'EAUTH') {
            console.error('\n💡 Authentication failed. Possible issues:');
            console.error('   1. Wrong email or password');
            console.error('   2. "Less secure app access" not enabled (for Gmail)');
            console.error('   3. Need to use App Password instead of regular password');
            console.error('\n   For Gmail:');
            console.error('   - Go to: https://myaccount.google.com/apppasswords');
            console.error('   - Generate an App Password');
            console.error('   - Use that instead of your regular password');
        }

        process.exit(1);
    }
}

testEmail();
