import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchSensorData = async (page = 1, limit = 10, startDate, endDate) => {
  try {
    const params = {
      page,
      limit,
    };

    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${API_BASE_URL}/data`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadCSV = async (startDate, endDate) => {
  try {
    const params = {};

    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${API_BASE_URL}/data/export`, {
      params,
      responseType: 'blob', // Important for file download
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
