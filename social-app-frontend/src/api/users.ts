const API_URL = 'http://localhost:5000/api/users';

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

export const getUserSuggestions = async () => {
    const response = await fetch(`${API_URL}/suggestions`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch suggestions');
    }
    return response.json();
};

export const getProfile = async () => {
    const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch profile');
    }
    return response.json();
};

export const getUsers = async (page = 1, limit = 10, search = '', sort = 'createdAt_desc') => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sort
    });

    const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch users');
    }
    return response.json();
};

export const getUserById = async (id: string) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch user');
    }
    return response.json();
};

export const updateUserRole = async (id: string, role: string) => {
    const response = await fetch(`${API_URL}/${id}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user role');
    }
    return response.json();
};

export const followUser = async (userId: string) => {
    // Standardizing to the engagement format used in the backend if needed, or specific follow route
    const response = await fetch(`${API_URL}/${userId}/follow`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to follow user');
    }
    return response.json();
};

export const getFollowers = async (userId: string) => {
    const response = await fetch(`${API_URL}/${userId}/followers`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch followers');
    }
    return response.json();
};

export const getFollowing = async (userId: string) => {
    const response = await fetch(`${API_URL}/${userId}/following`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch following');
    }
    return response.json();
};
