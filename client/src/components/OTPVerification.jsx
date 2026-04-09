import React, { useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const OTPVerification = ({ onVerified }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSendOTP = async () => {
        setSending(true);
        try {
            await API.post('/api/otp/send');
            toast.success('OTP sent to your email!');
            setIsSent(true);
        } catch (error) {
            console.error('Error sending OTP:', error);
            toast.error(error.response?.data?.msg || 'Failed to send OTP');
        } finally {
            setSending(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('Please enter a 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            await API.post('/api/otp/verify', { otp });
            toast.success('Email verified successfully! 🎉');
            onVerified(true);
        } catch (error) {
            console.error('Error verifying OTP:', error);
            toast.error(error.response?.data?.msg || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {!isSent ? (
                <div className="space-y-3">
                    <h2 className="text-xl font-black text-slate-900">Email Verification Required</h2>
                    <p className="text-slate-600 font-medium">To share your interview experience, please verify your email address first.</p>
                    <button
                        onClick={handleSendOTP}
                        className="w-full rounded-xl bg-slate-900 py-3 text-white font-extrabold disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 transition"
                        disabled={sending}
                    >
                        {sending ? 'Sending OTP...' : 'Send OTP to Email'}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-3">
                    <h2 className="text-xl font-black text-slate-900">Verify Your Email</h2>
                    <p className="text-slate-600 font-medium">Enter the 6-digit code sent to your email.</p>
                    <div>
                        <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            maxLength="6"
                            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10 text-lg font-black tracking-widest"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button type="submit" className="rounded-xl bg-slate-900 py-3 text-white font-extrabold disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 transition" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSendOTP}
                            className="rounded-xl border border-slate-200 bg-white py-3 font-extrabold text-slate-800 hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={sending}
                        >
                            Resend OTP
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default OTPVerification;
