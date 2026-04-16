import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const FALLBACK_API_URL = import.meta.env.VITE_API_FALLBACK_URL || 'https://sikonav2-production.up.railway.app/api';
const PUBLIC_AUTH_API_URL = import.meta.env.VITE_PUBLIC_AUTH_API_URL || '/api';

const publicAuthApi = axios.create({
  baseURL: PUBLIC_AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    const originalRequest = error.config || {};
    const isGatewayTimeout = error.response?.status === 504;
    const isNetworkError = !error.response && (
      error.code === 'ERR_NETWORK'
      || /network\s*error/i.test(error.message || '')
    );
    const currentBaseURL = originalRequest.baseURL || API_URL;
    const hasFallback = typeof FALLBACK_API_URL === 'string' && FALLBACK_API_URL.length > 0;
    const canRetry = !originalRequest.__retriedWithFallback && hasFallback && FALLBACK_API_URL !== currentBaseURL;
    const shouldRetryWithFallback = canRetry && (isGatewayTimeout || isNetworkError);

    if (shouldRetryWithFallback) {
      originalRequest.__retriedWithFallback = true;
      originalRequest.baseURL = FALLBACK_API_URL;
      return api.request(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (payload) => publicAuthApi.post('/login', payload),
  loginOptions: () => publicAuthApi.get('/login-options'),
  register: (data) => publicAuthApi.post('/register', data),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  updateProfile: (data) => api.put('/profile', data),
  updatePassword: (data) => api.put('/password', data),
  toggleOnline: () => api.post('/toggle-online'),
};

// User API
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleActive: (id) => api.post(`/users/${id}/toggle-active`),
  resetPassword: (id, password) => api.post(`/users/${id}/reset-password`, { password }),
  getAuditors: () => api.get('/auditors'),
  getAuditees: () => api.get('/auditees'),
  getStatistics: () => api.get('/users-stats'),
};

// Conversation API
export const conversationAPI = {
  getAll: (params = {}) => api.get('/conversations', { params: { ...params, _t: Date.now() } }),
  getById: (id) => api.get(`/conversations/${id}`),
  create: (auditorId, subject, options = {}) => api.post('/conversations', {
    auditor_id: auditorId,
    subject,
    is_anonymous: !!options.is_anonymous,
  }),
  updateStatus: (id, status) => api.put(`/conversations/${id}/status`, { status }),
  getAvailableAuditors: () => api.get('/available-auditors'),
  getAvailableAuditees: () => api.get('/available-auditees'),
};

// Message API
export const messageAPI = {
  getAll: (conversationId) => api.get(`/conversations/${conversationId}/messages`),
  send: (conversationId, content, attachment, options = {}) => {
    if (attachment) {
      const formData = new FormData();
      formData.append('content', content || '');
      formData.append('attachment', attachment);
      formData.append('is_anonymous', options.is_anonymous ? '1' : '0');
      return api.post(`/conversations/${conversationId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post(`/conversations/${conversationId}/messages`, {
      content,
      is_anonymous: !!options.is_anonymous,
    });
  },
  downloadAttachment: (messageId) => api.get(`/messages/${messageId}/download`, { responseType: 'blob' }),
};

// Audit Process API
export const auditAPI = {
  getAll: (params = {}) => api.get('/audit-processes', { params: { ...params, _t: Date.now() } }),
  getById: (id) => api.get(`/audit-processes/${id}`),
  create: (data) => api.post('/audit-processes', data),
  updateTahap: (id, tahap, status) => api.put(`/audit-processes/${id}/tahap`, { tahap, status }),
  uploadDokumen: (id, file, tahapNo) => {
    const formData = new FormData();
    formData.append('dokumen', file);
    formData.append('tahap_no', tahapNo);
    return api.post(`/audit-processes/${id}/dokumen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDokumen: (id) => api.get(`/audit-processes/${id}/dokumen`),
  downloadDokumen: (id, tahapNo) => api.get(`/audit-processes/${id}/dokumen/${tahapNo}/download`, { responseType: 'blob' }),
  deleteDokumen: (id, tahapNo) => api.delete(`/audit-processes/${id}/dokumen/${tahapNo}`),
  updateCatatan: (id, catatan) => api.put(`/audit-processes/${id}/catatan`, { catatan_auditor: catatan }),
  updateLhkStage: (id, stage) => api.put(`/audit-processes/${id}/lhk-stage`, { stage }),
  updateLhkReview: (id, reviewNote, reviewApproved) => api.put(`/audit-processes/${id}/lhk-review`, {
    review_note: reviewNote,
    review_approved: reviewApproved,
  }),
  updateStatus: (id, status) => api.put(`/audit-processes/${id}/status`, { status }),
  getNotes: (id, type) => api.get(`/audit-processes/${id}/notes`, { params: { type } }),
  addNote: (id, type, message) => api.post(`/audit-processes/${id}/notes`, { type, message }),
  getStatistics: () => api.get('/audit-stats', { params: { _t: Date.now() } }),
};

// SPI Profile API
export const spiAPI = {
  get: () => api.get('/spi-profile'),
  save: (data) => api.post('/spi-profile', data),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/spi-profile/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const backupAPI = {
  getAll: () => api.get('/backups'),
  create: () => api.post('/backups'),
  restore: (filename) => api.post(`/backups/${encodeURIComponent(filename)}/restore`),
  download: (filename) => api.get(`/backups/${encodeURIComponent(filename)}/download`, { responseType: 'blob' }),
  remove: (filename) => api.delete(`/backups/${encodeURIComponent(filename)}`),
};

export const systemSettingsAPI = {
  get: () => api.get('/system-settings'),
  update: (data) => api.put('/system-settings', data),
};

export const rolePermissionsAPI = {
  get: () => api.get('/role-permissions'),
  upsert: (roleKey, permissions) => api.put('/role-permissions', { role_key: roleKey, permissions }),
};

// Activity Log API
export const activityLogAPI = {
  getAll: (params = {}) => api.get('/activity-logs', { params: { ...params, _t: Date.now() } }),
  getStats: () => api.get('/activity-logs/stats', { params: { _t: Date.now() } }),
};

// ═══════════════════════════════════════════════════════
// AUDITOR STATUS API (Backend realtime)
// Source of truth comes from backend user online status
// ═══════════════════════════════════════════════════════

export function getAuditorStatusLocal() {
  return {};
}

export async function getAuditorStatus() {
  const response = await userAPI.getAuditors();
  const auditors = response.data?.data || response.data?.users || response.data || [];

  return auditors.reduce((acc, auditor) => {
    const biroName = auditor?.biro;
    if (!biroName) return acc;
    acc[biroName] = !!acc[biroName] || !!auditor?.is_online;
    return acc;
  }, {});
}

export async function setAuditorOnlineStatus(_biro, _online) {
  await authAPI.toggleOnline();
  return getAuditorStatus();
}

export async function sendAuditorHeartbeat() {
  return authAPI.me();
}

export default api;