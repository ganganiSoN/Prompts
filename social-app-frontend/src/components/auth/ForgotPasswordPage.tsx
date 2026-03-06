import React, { useState } from 'react';
import { Mail, CheckCircle, Lock, ArrowRight, KeyRound } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { forgotPasswordApi, resetPasswordApi } from '../../api/auth';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [isResetStep, setIsResetStep] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: showError } = useToast();

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsSubmitting(true);

        try {
            const data = await forgotPasswordApi({ email });
            // For dev purposes, notify of mock token if provided
            if (data.mockResetToken) {
                console.log('Mock Token:', data.mockResetToken);
            }
            success(data.message || 'Reset token sent');
            setTimeout(() => {
                setIsSubmitting(false);
                setIsResetStep(true);
            }, 1000);
        } catch (err: any) {
            showError(err.message || 'Failed to request password reset');
            setIsSubmitting(false);
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetToken || !newPassword) return;
        setIsSubmitting(true);

        try {
            const data = await resetPasswordApi({ token: resetToken, newPassword });
            success(data.message || 'Password successfully reset');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            showError(err.message || 'Failed to reset password');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box glass-card animate-fade-in">
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <div style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: '50%', border: '1px solid var(--border)' }}>
                            <KeyRound size={28} style={{ color: 'var(--primary)' }} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold">{isResetStep ? 'Create New Password' : 'Forgot Password'}</h2>
                    <p className="mt-2 text-sm">
                        {isResetStep
                            ? 'Enter the reset token we sent you and choose a new password.'
                            : 'No worries! Enter your email and we will send you a reset link.'}
                    </p>
                </div>

                {!isResetStep ? (
                    <form onSubmit={handleEmailSubmit}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="email">Email address</label>
                            <Mail className="input-icon" size={20} />
                            <input
                                id="email"
                                type="email"
                                className="input-field"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary mt-4" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                            {!isSubmitting && <ArrowRight size={18} />}
                        </button>

                        <div className="text-center mt-6">
                            <Link to="/login" className="btn btn-outline text-sm" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                                Back to log in
                            </Link>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleResetSubmit} className="animate-fade-in">
                        <div className="input-group">
                            <label className="input-label" htmlFor="resetToken">Reset Token</label>
                            <CheckCircle className="input-icon" size={20} />
                            <input
                                id="resetToken"
                                type="text"
                                className="input-field"
                                placeholder="Paste token here"
                                value={resetToken}
                                onChange={(e) => setResetToken(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="newPassword">New Password</label>
                            <Lock className="input-icon" size={20} />
                            <input
                                id="newPassword"
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary mt-4" disabled={isSubmitting}>
                            {isSubmitting ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
