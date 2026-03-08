import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { githubLoginApi, googleLoginApi } from '../../api/auth';
import { Loader } from 'lucide-react';

const OAuthCallback = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { authenticate } = useAuth();
    const { success, error: showError } = useToast();
    const hasAttemptedLogin = useRef(false);

    useEffect(() => {
        if (hasAttemptedLogin.current) return;
        
        const processOAuthCallback = async () => {
            hasAttemptedLogin.current = true;
            const searchParams = new URLSearchParams(location.search);
            const code = searchParams.get('code');

            if (!code) {
                showError('Invalid OAuth callback parameter.');
                navigate('/login');
                return;
            }

            try {
                if (location.pathname.includes('/auth/github/callback')) {
                    const data = await githubLoginApi(code);
                    if (data.token) {
                        authenticate(data.user, data.token);
                        success('Authenticated with GitHub successfully!');
                        navigate('/');
                    }
                } else if (location.pathname.includes('/auth/google/callback')) {
                    const data = await googleLoginApi(code); // We're repurposing googleLoginApi to now take a code instead of an access_token!
                    if (data.token) {
                        authenticate(data.user, data.token);
                        success('Authenticated with Google successfully!');
                        navigate('/');
                    }
                }
            } catch (err: any) {
                showError(err.message || 'Authentication failed');
                navigate('/login');
            }
        };

        if (location.pathname.includes('/callback')) {
            processOAuthCallback();
        }
    }, [location, navigate, authenticate, success, showError]);

    return (
        <div className="auth-container flex justify-center items-center">
            <div className="auth-box glass-card text-center p-8 flex flex-col items-center gap-4">
                <Loader className="animate-spin text-primary" size={40} />
                <h2 className="text-xl font-bold">Authenticating...</h2>
                <p className="text-gray-400">Please wait while we automatically log you in.</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
