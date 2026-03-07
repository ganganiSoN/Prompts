import React, { useState } from 'react';
import { Mail, Lock, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { signupApi, verifyEmailApi } from '../../api/auth';

const SignupPage = () => {
    const { authenticate } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    const [hasVerifiedAge, setHasVerifiedAge] = useState(false);

    const [isVerificationStep, setIsVerificationStep] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: showError } = useToast();

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !hasAcceptedTerms || !hasVerifiedAge) return;
        setIsSubmitting(true);
        try {
            await signupApi({
                email,
                password,
                hasAcceptedTerms,
                hasVerifiedAge
            });
            success('Account created! Please check your email.');
            setIsVerificationStep(true);
        } catch (err: any) {
            showError(err.message || 'Failed to register');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificationCode) return;

        setIsSubmitting(true);
        try {
            const data = await verifyEmailApi({ token: verificationCode, email });
            if (data.token) {
                authenticate({ id: 'temp', email: email, name: email.split('@')[0], role: 'user' }, data.token); // Mock user obj for now
                success('Email verified successfully!');
                navigate('/');
            } else {
                success('Verification successful! Please log in.');
                navigate('/login');
            }
        } catch (err: any) {
            showError(err.message || 'Invalid verification code');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box glass-card">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">{isVerificationStep ? 'Verify Your Email' : 'Create an Account'}</h2>
                    <p className="mt-2">{isVerificationStep ? `We sent a code to ${email}` : 'Join our community today'}</p>
                </div>

                {!isVerificationStep ? (
                    <>
                        <form onSubmit={handleInitialSubmit}>
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

                            <div className="input-group">
                                <label className="input-label" htmlFor="password">Password</label>
                                <Lock className="input-icon" size={20} />
                                <input
                                    id="password"
                                    type="password"
                                    className="input-field"
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="checkbox-group mt-6">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={hasAcceptedTerms}
                                    onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                                    required
                                />
                                <label htmlFor="terms">
                                    I accept the <a href="#" className="link">Terms of Service</a> and <a href="#" className="link">Privacy Policy</a>
                                </label>
                            </div>

                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="age"
                                    checked={hasVerifiedAge}
                                    onChange={(e) => setHasVerifiedAge(e.target.checked)}
                                    required
                                />
                                <label htmlFor="age" className="flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-primary" />
                                    I confirm that I am over 18 years old
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary mt-4"
                                disabled={isSubmitting || !hasAcceptedTerms || !hasVerifiedAge}
                            >
                                {isSubmitting ? 'Creating account...' : 'Create account'}
                                {!isSubmitting && <ArrowRight size={18} />}
                            </button>
                        </form>

                        <p className="text-center mt-6 text-sm text-gray-400">
                            Already have an account? <Link to="/login" className="link">Sign in</Link>
                        </p>
                    </>
                ) : (
                    <form onSubmit={handleVerificationSubmit} className="animate-fade-in">
                        <div className="input-group">
                            <label className="input-label" htmlFor="verificationCode">Verification Token</label>
                            <div style={{ position: 'relative' }}>
                                <CheckCircle className="input-icon" size={20} style={{ top: '0.875rem' }} />
                                <input
                                    id="verificationCode"
                                    type="text"
                                    className="input-field"
                                    placeholder="Token"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    required
                                    style={{ textAlign: 'center', paddingLeft: '1rem' }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary mt-4" disabled={isSubmitting || !verificationCode}>
                            {isSubmitting ? 'Verifying...' : 'Complete Signup'}
                        </button>

                        <button type="button" className="btn mt-4 text-sm" onClick={() => setIsVerificationStep(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                            Change Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SignupPage;
