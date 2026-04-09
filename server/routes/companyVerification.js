const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isCompanyEmail, extractDomain, extractCompanyName } = require('../utils/emailValidator');
const nodemailer = require('nodemailer');

// Email transporter (reusing existing SMTP config)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * @route   POST /api/company-verification/send-otp
 * @desc    Send OTP to company email for verification
 * @access  Private
 */
router.post('/send-otp', auth, async (req, res) => {
    try {
        const { companyEmail } = req.body;

        if (!companyEmail) {
            return res.status(400).json({ error: 'Company email is required' });
        }

        // Validate company email
        const validation = isCompanyEmail(companyEmail);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Check if email is already verified by another user
        const existingUser = await User.findOne({
            companyEmail: companyEmail.toLowerCase(),
            isCompanyVerified: true,
            _id: { $ne: req.user.id } // Exclude current user
        });

        if (existingUser) {
            return res.status(400).json({
                error: 'This company email is already verified by another user'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with OTP
        await User.findByIdAndUpdate(req.user.id, {
            otpCode: otp,
            otpExpires,
            companyEmail: companyEmail.toLowerCase(),
            companyDomain: validation.domain,
            companyName: validation.companyName,
            isCompanyVerified: false // Reset verification status
        });

        console.log('✅ OTP saved for user ID:', req.user.id);

        // Send OTP email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: companyEmail,
            subject: 'Verify Your Company Email - Interview Platform',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Company Email Verification</h2>
                    <p>Hello ${req.user.name},</p>
                    <p>You requested to verify your company email for the Interview Sharing Platform.</p>
                    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #2d3748; text-align: center; font-size: 32px; letter-spacing: 5px; margin: 0;">
                            ${otp}
                        </h1>
                    </div>
                    <p>This OTP will expire in <strong>10 minutes</strong>.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    <p style="color: #718096; font-size: 12px;">
                        Interview Sharing Platform - Helping you prepare for your dream job
                    </p>
                </div>
            `
        };

        console.log('📧 Attempting to send OTP email to:', companyEmail);
        console.log('   OTP Code:', otp);
        console.log('   SMTP Config:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.EMAIL_USER?.substring(0, 5) + '...'
        });

        try {
            const emailResult = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully!', emailResult.messageId);
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            throw new Error('Failed to send email. Please check your email configuration.');
        }

        res.json({
            success: true,
            message: 'OTP sent to your company email',
            companyDomain: validation.domain,
            companyName: validation.companyName
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: error.message || 'Failed to send OTP. Please try again.' });
    }
});

/**
 * @route   POST /api/company-verification/verify-otp
 * @desc    Verify OTP and mark company email as verified
 * @access  Private
 */
router.post('/verify-otp', auth, async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ error: 'OTP is required' });
        }

        // Trim and convert to string
        const submittedOTP = String(otp).trim();

        const user = await User.findById(req.user.id);

        console.log('🔍 Verifying OTP for user:', req.user.id);

        if (!user.otpCode) {
            return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
        }

        if (new Date() > user.otpExpires) {
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Trim stored OTP as well
        const storedOTP = String(user.otpCode).trim();

        console.log('OTP Verification Debug:');
        console.log('  Submitted OTP:', submittedOTP, '(length:', submittedOTP.length, ')');
        console.log('  Stored OTP:', storedOTP, '(length:', storedOTP.length, ')');
        console.log('  Match:', submittedOTP === storedOTP);

        if (storedOTP !== submittedOTP) {
            return res.status(400).json({
                error: 'Invalid OTP. Please try again.',
                debug: process.env.NODE_ENV === 'development' ? {
                    submitted: submittedOTP,
                    stored: storedOTP
                } : undefined
            });
        }

        // OTP is valid - mark company as verified
        user.isCompanyVerified = true;
        user.companyVerifiedAt = new Date();
        user.otpCode = undefined; // Clear OTP
        user.otpExpires = undefined;
        await user.save();

        console.log('✅ Company email verified successfully for user:', user.email);

        res.json({
            success: true,
            message: 'Company email verified successfully!',
            user: {
                companyEmail: user.companyEmail,
                companyDomain: user.companyDomain,
                companyName: user.companyName,
                isCompanyVerified: user.isCompanyVerified
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
    }
});

/**
 * @route   GET /api/company-verification/status
 * @desc    Get company verification status for current user
 * @access  Private
 */
router.get('/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            'companyEmail companyDomain companyName isCompanyVerified companyVerifiedAt'
        );

        res.json({
            success: true,
            isVerified: user.isCompanyVerified || false,
            companyEmail: user.companyEmail || null,
            companyDomain: user.companyDomain || null,
            companyName: user.companyName || null,
            verifiedAt: user.companyVerifiedAt || null
        });

    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ error: 'Failed to get verification status' });
    }
});

module.exports = router;
