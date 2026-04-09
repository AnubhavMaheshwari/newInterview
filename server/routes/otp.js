const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Force load env variables for this route
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configure NodeMailer with generic SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// @route   POST /api/otp/send
// @desc    Send OTP to user's email
// @access  Private
router.post('/send', auth, async (req, res) => {
    // Debug log (remove in production)
    console.log('OTP Send Request. EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'MISSING', 'EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'MISSING');

    // Validate config
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(500).json({
            msg: `Server email configuration missing. Env check: USER=${process.env.EMAIL_USER ? 'ok' : 'missing'}, PASS=${process.env.EMAIL_PASS ? 'ok' : 'missing'}`
        });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set OTP and expiration (10 minutes)
        user.otpCode = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Send Email
        const mailOptions = {
            from: `"Interview Hub" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Verification OTP for Interview Sharing Platform',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #4f46e5; text-align: center;">Verification OTP</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>The system received a request to verify your email for sharing an interview experience.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 2rem; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
          </div>
          <p>This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 0.8rem; color: #6b7280; text-align: center;">© 2026 Interview Sharing Platform</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        res.json({ msg: 'OTP sent successfully' });
    } catch (error) {
        console.error('OTP Send Error:', error);
        res.status(500).json({ msg: 'Failed to send OTP. Please check server logs.' });
    }
});

// @route   POST /api/otp/verify
// @desc    Verify OTP
// @access  Private
router.post('/verify', auth, async (req, res) => {
    const { otp } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (!user.otpCode || user.otpCode !== otp) {
            return res.status(400).json({ msg: 'Invalid OTP code' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'OTP has expired' });
        }

        // Success
        user.isOtpVerified = true;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ msg: 'Email verified successfully', isOtpVerified: true });
    } catch (error) {
        console.error('OTP Verify Error:', error);
        res.status(500).json({ msg: 'Verification failed' });
    }
});

module.exports = router;
