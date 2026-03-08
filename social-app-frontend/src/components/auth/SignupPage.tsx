import React, { useState } from 'react';
import { Mail, Lock, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { signupApi, verifyEmailApi } from '../../api/auth';
import { Github } from 'lucide-react';

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

    const handleGoogleLogin = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const scope = 'openid email profile';
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}`;
    };

    const handleGitHubLogin = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/github/callback`;
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    };

    return (
        <div className="auth-container">
            <div className="auth-box glass-card">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-primary">{isVerificationStep ? 'Verify Your Email' : 'Create an Account'}</h2>
                    <p className="mt-2 text-muted">{isVerificationStep ? `We sent a code to ${email}` : 'Join our community today'}</p>
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

                        <div className="divider">or sign up with</div>

                        <div className="social-grid">
                            <button type="button" className="btn btn-outline" onClick={handleGoogleLogin}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                            <button type="button" className="btn btn-outline" onClick={handleGitHubLogin}>
                                <Github size={20} />
                                GitHub
                            </button>
                        </div>

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
