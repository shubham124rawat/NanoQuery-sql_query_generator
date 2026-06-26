import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Health check
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

// Get database schema
export const getSchema = async () => {
  const response = await apiClient.get('/api/query/schema');
  return response.data;
};

// Generate SQL query from natural language
export const generateQuery = async (prompt) => {
  const response = await apiClient.post('/api/query/generate', {
    prompt: prompt
  });
  return response.data;
};

// Refine existing SQL query with conversational feedback
export const refineQuery = async (previousSql, refinementPrompt) => {
  const response = await apiClient.post('/api/query/refine', {
    previous_sql: previousSql,
    refinement_prompt: refinementPrompt
  });
  return response.data;
};

// Validate query
export const validateQuery = async (query) => {
  const response = await apiClient.post('/api/validate-query', { query });
  return response.data;
};

// Execute query
export const executeQuery = async (sql, confirmed = false) => {
  const response = await apiClient.post('/api/query/execute', {
    sql,
    confirmed,
  });
  return response.data;
};

// Save query to history
export const saveHistory = async (historyData) => {
  const response = await apiClient.post('/api/history/save', historyData);
  return response.data;
};

// Get query history
export const getHistory = async (limit = 20) => {
  const response = await apiClient.get('/api/history', {
    params: { limit }
  });
  return response.data;
};

// Clear history
export const clearHistory = async () => {
  const response = await apiClient.delete('/api/history/clear');
  return response.data;
};

// Delete specific history record
export const deleteHistoryRecord = async (recordId) => {
  const response = await apiClient.delete(`/api/history/${recordId}`);
  return response.data;
};

// Connect to custom database
export const connectCustomDatabase = async (connectionData) => {
  const response = await apiClient.post('/api/schema/connect', connectionData);
  return response.data;
};

// Switch to sample database
export const useSampleDatabase = async () => {
  const response = await apiClient.post('/api/schema/use-sample');
  return response.data;
};

export default apiClient;
