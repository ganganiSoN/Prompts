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

export const createModerator = async (data: { email: string; name: string; password?: string }) => {
    const response = await fetch(`${API_URL}/moderator`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create moderator');
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

export const getUserPosts = async (userId: string, page = 1, limit = 20) => {
    const response = await fetch(`${API_URL}/${userId}/posts?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch user posts');
    }
    return response.json();
};

export const getUserBookmarks = async (userId: string, page = 1, limit = 20) => {
    const response = await fetch(`${API_URL}/${userId}/bookmarks?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch user bookmarks');
    }
    return response.json();
};

export const getAccessHistory = async () => {
    const response = await fetch(`${API_URL}/access-history`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch access history');
    }
    return response.json();
};

export const getAuditLogs = async () => {
    const response = await fetch(`${API_URL}/audit-logs`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch audit logs');
    }
    return response.json();
};

export interface ExportOptions {
    posts?: boolean;
    comments?: boolean;
    messages?: boolean;
    profile?: boolean;
    activity?: boolean;
    format?: string;
}

export const exportUserData = async (options?: ExportOptions) => {
    let query = '';
    if (options) {
        const params = new URLSearchParams();
        if (options.posts !== undefined) params.append('posts', String(options.posts));
        if (options.comments !== undefined) params.append('comments', String(options.comments));
        if (options.messages !== undefined) params.append('messages', String(options.messages));
        if (options.profile !== undefined) params.append('profile', String(options.profile));
        if (options.activity !== undefined) params.append('activity', String(options.activity));
        if (options.format !== undefined) params.append('format', String(options.format));

        const queryString = params.toString();
        if (queryString) query = `?${queryString}`;
    }

    const response = await fetch(`${API_URL}/export${query}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to export user data');
    }
    return response.json();
};

export const deleteAccount = async (password: string) => {
    const response = await fetch(`${API_URL}/delete-request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
    }
    return response.json();
};
