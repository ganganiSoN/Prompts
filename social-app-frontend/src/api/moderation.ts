const API_URL = 'http://localhost:5000/api/moderation';

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

export interface ModerationFilters {
    page?: number;
    limit?: number;
    status?: string;
}

export const getReports = async (filters: ModerationFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${API_URL}/reports?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch reports');
    }
    return response.json();
};

export const updateReport = async (reportId: string, data: { status?: string; decision?: string; moderatorNotes?: string }) => {
    const response = await fetch(`${API_URL}/reports/${reportId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update report');
    }
    return response.json();
};

export const getUserModerationGrid = async (userId: string, filters: any = {}) => {
    const params = new URLSearchParams();
    if (filters.minRisk !== undefined) params.append('minRisk', filters.minRisk.toString());
    if (filters.maxRisk !== undefined) params.append('maxRisk', filters.maxRisk.toString());
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters.community && filters.community !== 'ALL') params.append('community', filters.community);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.dateRange && filters.dateRange !== 'ALL') params.append('dateRange', filters.dateRange);

    const response = await fetch(`${API_URL}/user/${userId}/reports?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch user moderation grid');
    }
    return response.json();
};
