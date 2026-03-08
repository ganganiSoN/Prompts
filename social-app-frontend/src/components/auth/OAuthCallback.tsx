import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { githubLoginApi } from '../../api/auth';
import { Loader } from 'lucide-react';

const OAuthCallback = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { authenticate } = useAuth();
    const { success, error: showError } = useToast();

    useEffect(() => {
        const processGitHubCallback = async () => {
            const searchParams = new URLSearchParams(location.search);
            const code = searchParams.get('code');

            if (!code) {
                showError('Invalid OAuth callback parameter.');
                navigate('/login');
                return;
            }

            try {
                const data = await githubLoginApi(code);
                if (data.token) {
                    authenticate(data.user, data.token);
                    success('Authenticated with GitHub successfully!');
                    navigate('/');
                }
            } catch (err: any) {
                showError(err.message || 'GitHub Authentication failed');
                navigate('/login');
            }
        };

        if (location.pathname.includes('/auth/github/callback')) {
            processGitHubCallback();
        }
    }, [location]);

    return (
        <div className="auth-container flex justify-center items-center">
            <div className="auth-box glass-card text-center p-8 flex flex-col items-center gap-4">
                <Loader className="animate-spin text-primary" size={40} />
                <h2 className="text-xl font-bold">Authenticating...</h2>
                <p className="text-gray-400">Please wait while we log you in via GitHub.</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
