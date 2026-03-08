const API_URL = 'http://localhost:5000/api/auth';

export const signupApi = async (data: { name: string; email: string; password?: string; hasAcceptedTerms: boolean; hasVerifiedAge: boolean }) => {
    const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
    }
    return response.json();
};

export const verifyEmailApi = async (data: { token: string; email: string }) => {
    const response = await fetch(`${API_URL}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Email verification failed');
    }
    return response.json();
};

export const loginApi = async (data: { email: string; password?: string; authProvider?: string }) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
    }
    return response.json();
};

export const verifyMfaApi = async (data: { tempToken: string; mfaCode: string }) => {
    const response = await fetch(`${API_URL}/verify-mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'MFA verification failed');
    }
    return response.json();
};

export const forgotPasswordApi = async (data: { email: string }) => {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request password reset');
    }
    return response.json();
};

export const resetPasswordApi = async (data: { token: string; newPassword: string }) => {
    const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
    }
    return response.json();
};

export const googleLoginApi = async (code: string) => {
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const response = await fetch(`${API_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google login failed');
    }
    return response.json();
};

export const githubLoginApi = async (code: string) => {
    const response = await fetch(`${API_URL}/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'GitHub login failed');
    }
    return response.json();
};

const getAuthHeaders = () => {
    let token = localStorage.getItem('token') || '';
    if (!token) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                token = user.token || '';
            } catch (e) { }
        }
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_URL}/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
    }
    return response.json();
};

export const setupMfa = async () => {
    const response = await fetch(`${API_URL}/mfa/setup`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to setup MFA');
    }
    return response.json();
};

export const enableMfa = async (token: string) => {
    const response = await fetch(`${API_URL}/mfa/enable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ token })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to enable MFA');
    }
    return response.json();
};

export const disableMfa = async () => {
    const response = await fetch(`${API_URL}/mfa/disable`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to disable MFA');
    }
    return response.json();
};
