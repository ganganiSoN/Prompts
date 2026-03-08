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

export const getFeed = async (page = 1, limit = 20, community?: string, followingOnly = false) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });
    if (community) {
        params.append('community', community);
    }
    if (followingOnly) {
        params.append('followingOnly', 'true');
    }

    const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
    }
    return response.json();
};

export interface ExploreFilters {
    search?: string;
    timeRange?: string;
    language?: string;
    minEngagement?: string;
}

export const getExplore = async (page = 1, limit = 20, filters?: ExploreFilters) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.timeRange) params.append('timeRange', filters.timeRange);
        if (filters.language) params.append('language', filters.language);
        if (filters.minEngagement) params.append('minEngagement', filters.minEngagement);
    }

    // Add a cache bust to ensure trending scores are immediately fresh
    params.append('_t', Date.now().toString());

    const response = await fetch(`${API_URL}/explore?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch explore feed');
    }
    return response.json();
};

export const getDrafts = async () => {
    const response = await fetch(`${API_URL}/drafts`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch drafts');
    }
    return response.json();
};

export const engageWithPost = async (postId: string, type: string, content?: string, parentEngagementId?: string) => {
    const response = await fetch(`${API_URL}/${postId}/engage`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type, content, parentEngagementId })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to engage with post');
    }
    return response.json();
};

export const voteOnPoll = async (postId: string, optionIndex: number) => {
    const response = await fetch(`${API_URL}/${postId}/vote`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ optionIndex })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to vote on poll');
    }
    return response.json();
};

export const repostPost = async (postId: string, content?: string) => {
    const response = await fetch(`${API_URL}/${postId}/repost`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to repost');
    }
    return response.json();
};

export const getPostComments = async (postId: string) => {
    const response = await fetch(`${API_URL}/${postId}/comments`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch comments');
    }
    return response.json();
};

export const deletePost = async (postId: string) => {
    const response = await fetch(`${API_URL}/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete post');
    }
    return response.json();
};

export const updatePost = async (postId: string, content: string, status?: string) => {
    const payload: any = { content };
    if (status) payload.status = status;

    const response = await fetch(`${API_URL}/${postId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update post');
    }
    return response.json();
};

export const reportPost = async (postId: string, reason: string) => {
    const response = await fetch(`${API_URL}/${postId}/report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to report post');
    }
    return response.json();
};

export const getTrendingHashtags = async (limit: number = 10) => {
    const response = await fetch(`${API_URL}/trending/hashtags?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        throw new Error('Failed to fetch trending hashtags');
    }
    return response.json();
};

export const getPostById = async (postId: string) => {
    const response = await fetch(`${API_URL}/${postId}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch post');
    }
    return response.json();
};
