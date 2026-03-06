const API_URL = 'http://localhost:5000/api/posts';

// Helper to get auth token
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

export const createPost = async (postData: any) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(postData)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
    }
    return response.json();
};

export const getFeed = async (page = 1, limit = 20, community?: string) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });
    if (community) {
        params.append('community', community);
    }

    const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch feed');
    }
    return response.json();
};

export const engageWithPost = async (postId: string, type: string, content?: string) => {
    const response = await fetch(`${API_URL}/${postId}/engage`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type, content })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to engage with post');
    }
    return response.json();
};
