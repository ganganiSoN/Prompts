const API_URL = 'http://localhost:5000/api/notifications';

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

export const getNotifications = async (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch notifications');
    }
    return response.json();
};

export const getUnreadCount = async () => {
    const response = await fetch(`${API_URL}/unread-count`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch unread count');
    }
    return response.json();
};

export const markAsRead = async (id: string) => {
    const response = await fetch(`${API_URL}/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark notification as read');
    }
    return response.json();
};

export const markAllAsRead = async () => {
    const response = await fetch(`${API_URL}/read-all`, {
        method: 'PUT',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark all notifications as read');
    }
    return response.json();
};
