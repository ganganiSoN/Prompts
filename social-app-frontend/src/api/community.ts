const API_URL = 'http://localhost:5000/api/communities';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
    };
};

export const createCommunity = async (data: { name: string, description: string, tags: string }) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create community');
    }

    return response.json();
};

export const getCommunities = async (searchQuery: string = '') => {
    const timestamp = Date.now();
    const url = searchQuery
        ? `${API_URL}?search=${encodeURIComponent(searchQuery)}&_t=${timestamp}`
        : `${API_URL}?_t=${timestamp}`;
    const response = await fetch(url, {
        headers: getAuthHeaders(),
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error('Failed to load communities');
    }

    return response.json();
};

export const getCommunityById = async (id: string) => {
    const response = await fetch(`${API_URL}/${id}?_t=${Date.now()}`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error('Failed to load community details');
    }

    return response.json();
};

export const toggleJoinCommunity = async (id: string) => {
    const response = await fetch(`${API_URL}/${id}/join`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle community membership');
    }

    return response.json();
};

