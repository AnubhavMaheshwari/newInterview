import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const CompanyVerification = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Email input, 2: OTP input
    const [companyEmail, setCompanyEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Check if already verified
    useEffect(() => {
        const checkVerificationStatus = async () => {
            try {
                const res = await API.get('/api/company-verification/status');
                if (res.data.isVerified) {
                    toast.success('You are already verified!');
                    navigate('/create-interview');
                }
            } catch (error) {
                console.error('Error checking status:', error);
            } finally {
                setCheckingStatus(false);
            }
        };

        checkVerificationStatus();
    }, [navigate]);

    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!companyEmail) {
            toast.error('Please enter your company email');
            return;
        }

        setLoading(true);

        try {
            const res = await API.post('/api/company-verification/send-otp', {
                companyEmail
            });

            toast.success('OTP sent to your company email!');
            setCompanyInfo({
                domain: res.data.companyDomain,
                name: res.data.companyName
            });
            setStep(2);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to send OTP';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error('Please enter the 6-digit OTP');
            return;
        }

        setLoading(true);

        try {
            await API.post('/api/company-verification/verify-otp', {
                otp
            });

            toast.success('Company email verified successfully! 🎉');
            setTimeout(() => {
                navigate('/create-interview');
            }, 1500);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to verify OTP';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            await API.post('/api/company-verification/send-otp', {
                companyEmail
            });
            toast.success('OTP resent!');
        } catch (error) {
            toast.error('Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-600 font-semibold">
                <div className="h-10 w-10 rounded-full border-4 border-slate-300 border-t-slate-900 animate-spin" />
                Checking verification status...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black">🏢</div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Verify Your Company Email</h1>
                    <p className="mt-2 text-slate-600 font-medium">To maintain quality and authenticity, we require company email verification before sharing interviews.</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="companyEmail" className="text-sm font-extrabold text-slate-700">Company Email Address</label>
                            <input
                                type="email"
                                id="companyEmail"
                                value={companyEmail}
                                onChange={(e) => setCompanyEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                                disabled={loading}
                                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10"
                            />
                            <div className="text-sm font-semibold text-slate-600">
                                ⚠️ Use your official company email (e.g., john@google.com).<br />
                                Free email providers (Gmail, Yahoo, etc.) are not allowed.
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-slate-900 py-3 text-white font-extrabold disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 transition"
                            disabled={loading}
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700 font-medium">
                            <p>✉️ OTP sent to: <strong className="font-black">{companyEmail}</strong></p>
                            {companyInfo && (
                                <p className="mt-1">🏢 Company: <strong className="font-black">{companyInfo.name}</strong></p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="otp" className="text-sm font-extrabold text-slate-700">Enter 6-Digit OTP</label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength="6"
                                required
                                disabled={loading}
                                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10 text-lg font-black tracking-widest"
                            />
                            <div className="text-sm font-semibold text-slate-600">Check your email inbox (and spam folder)</div>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-slate-900 py-3 text-white font-extrabold disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 transition"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                className="rounded-xl border border-slate-200 bg-white py-3 font-extrabold text-slate-800 hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                Resend OTP
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setOtp('');
                                }}
                                className="rounded-xl border border-slate-200 bg-white py-3 font-extrabold text-slate-800 hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                Change Email
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-black text-slate-900">✅ Why verify?</p>
                    <ul className="mt-2 list-disc pl-5 text-slate-700 font-medium space-y-1">
                        <li>Ensures authenticity of interview experiences</li>
                        <li>Builds trust in the community</li>
                        <li>Prevents spam and fake interviews</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CompanyVerification;
