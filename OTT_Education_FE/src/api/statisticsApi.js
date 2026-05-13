import axios from 'axios';

const API_BASE_URL = '/api/statistics';

// Get token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
};

export const getOverview = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/overview`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error('Error fetching overview statistics:', error);
        throw error;
    }
};

export const getUserStatistics = async (startDate, endDate) => {
    try {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        
        const response = await axios.get(`${API_BASE_URL}/users`, {
            ...getAuthHeaders(),
            params,
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user statistics:', error);
        throw error;
    }
};

export const getMessageStatistics = async (startDate, endDate) => {
    try {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        
        const response = await axios.get(`${API_BASE_URL}/messages`, {
            ...getAuthHeaders(),
            params,
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching message statistics:', error);
        throw error;
    }
};

export const getGroupStatistics = async (startDate, endDate) => {
    try {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        
        const response = await axios.get(`${API_BASE_URL}/groups`, {
            ...getAuthHeaders(),
            params,
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching group statistics:', error);
        throw error;
    }
};

export const getInteractionStatistics = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/interactions`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error('Error fetching interaction statistics:', error);
        throw error;
    }
};
