const API_URL = 'http://localhost:5000/api/analytics';

const getAuthHeaders = () => {
    const userStr = localStorage.getItem('user');
    let token = '';
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            token = user.token || '';
        } catch (e) { }
    }
    if (!token) {
        token = localStorage.getItem('token') || '';
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getCreatorAnalytics = async () => {
    const response = await fetch(`${API_URL}/creator`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch analytics');
    }
    
    return response.json();
};
