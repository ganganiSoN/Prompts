import React, { useState } from 'react';
import { Mail, Lock, Github, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { loginApi, verifyMfaApi } from '../../api/auth';

const LoginPage = () => {
    const { authenticate } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isMfaStep, setIsMfaStep] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [tempMfaToken, setTempMfaToken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: showError } = useToast();

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setIsSubmitting(true);

        try {
            const data = await loginApi({ email, password });
            if (data.mfaRequired) {
                setTempMfaToken(data.tempToken);
                setIsMfaStep(true);
            } else if (data.token) {
                authenticate(data.user, data.token);
                success('Logged in successfully!');
                navigate('/');
            }
        } catch (err: any) {
            showError(err.message || 'Login failed');
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

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mfaCode.length < 6) return;
        setIsSubmitting(true);

        try {
            const data = await verifyMfaApi({ tempToken: tempMfaToken, mfaCode });
            if (data.token) {
                authenticate(data.user, data.token);
                success('MFA verified successfully!');
                navigate('/');
            }
        } catch (err: any) {
            showError(err.message || 'MFA Verification failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box glass-card">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">{isMfaStep ? 'Two-Factor Authentication' : 'Welcome Back'}</h2>
                    <p className="mt-2">{isMfaStep ? 'Enter the code sent to your device' : 'Enter your details to access your account'}</p>
                </div>

                {!isMfaStep ? (
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
                                <div className="flex justify-between items-center mb-2">
                                    <label className="input-label m-0" htmlFor="password">Password</label>
                                    <Link to="/forgot-password" className="link text-sm">Forgot password?</Link>
                                </div>
                                <Lock className="input-icon" size={20} />
                                <input
                                    id="password"
                                    type="password"
                                    className="input-field"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary mt-4" disabled={isSubmitting}>
                                {isSubmitting ? 'Verifying...' : 'Sign in'}
                                {!isSubmitting && <ArrowRight size={18} />}
                            </button>
                        </form>

                        <div className="divider">or continue with</div>

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
                            Don't have an account? <Link to="/signup" className="link">Sign up</Link>
                        </p>
                    </>
                ) : (
                    <form onSubmit={handleMfaSubmit} className="animate-fade-in">
                        <div className="input-group">
                            <label className="input-label" htmlFor="mfaCode">6-Digit Code</label>
                            <div style={{ position: 'relative' }}>
                                <CheckCircle className="input-icon" size={20} style={{ top: '0.875rem' }} />
                                <input
                                    id="mfaCode"
                                    type="text"
                                    className="input-field"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                    required
                                    style={{ letterSpacing: '0.5em', textAlign: 'center', paddingLeft: '1rem' }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary mt-4" disabled={isSubmitting || mfaCode.length < 6}>
                            {isSubmitting ? 'Verifying...' : 'Verify & Login'}
                        </button>

                        <button type="button" className="btn mt-4 text-sm" onClick={() => setIsMfaStep(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                            Back to Login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
