import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Attach access token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: any) => void }> = [];

function processQueue(error: any, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_BASE}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    apiClient.post('/auth/register', data).then((r) => r.data.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data).then((r) => r.data.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data.data),

  me: () => apiClient.get('/auth/me').then((r) => r.data.data),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }).then((r) => r.data.data),
};

// ─── Career API ───────────────────────────────────────────────────────────────

export const careerApi = {
  getProfile: () => apiClient.get('/profile').then((r) => r.data.data),
  updateProfile: (data: any) => apiClient.put('/profile', data).then((r) => r.data.data),

  getExperiences: () => apiClient.get('/experiences').then((r) => r.data.data),
  createExperience: (data: any) => apiClient.post('/experiences', data).then((r) => r.data.data),
  updateExperience: (id: string, data: any) => apiClient.put(`/experiences/${id}`, data).then((r) => r.data.data),
  deleteExperience: (id: string) => apiClient.delete(`/experiences/${id}`).then((r) => r.data.data),

  getEducation: () => apiClient.get('/education').then((r) => r.data.data),
  createEducation: (data: any) => apiClient.post('/education', data).then((r) => r.data.data),
  updateEducation: (id: string, data: any) => apiClient.put(`/education/${id}`, data).then((r) => r.data.data),
  deleteEducation: (id: string) => apiClient.delete(`/education/${id}`).then((r) => r.data.data),

  getProjects: () => apiClient.get('/projects').then((r) => r.data.data),
  createProject: (data: any) => apiClient.post('/projects', data).then((r) => r.data.data),
  updateProject: (id: string, data: any) => apiClient.put(`/projects/${id}`, data).then((r) => r.data.data),
  deleteProject: (id: string) => apiClient.delete(`/projects/${id}`).then((r) => r.data.data),

  getSkills: () => apiClient.get('/skills').then((r) => r.data.data),
  createSkill: (data: any) => apiClient.post('/skills', data).then((r) => r.data.data),
  updateSkill: (id: string, data: any) => apiClient.put(`/skills/${id}`, data).then((r) => r.data.data),
  deleteSkill: (id: string) => apiClient.delete(`/skills/${id}`).then((r) => r.data.data),

  getCertifications: () => apiClient.get('/certifications').then((r) => r.data.data),
  createCertification: (data: any) => apiClient.post('/certifications', data).then((r) => r.data.data),
  updateCertification: (id: string, data: any) => apiClient.put(`/certifications/${id}`, data).then((r) => r.data.data),
  deleteCertification: (id: string) => apiClient.delete(`/certifications/${id}`).then((r) => r.data.data),

  getAchievements: () => apiClient.get('/achievements').then((r) => r.data.data),
  createAchievement: (data: any) => apiClient.post('/achievements', data).then((r) => r.data.data),
  updateAchievement: (id: string, data: any) => apiClient.put(`/achievements/${id}`, data).then((r) => r.data.data),
  deleteAchievement: (id: string) => apiClient.delete(`/achievements/${id}`).then((r) => r.data.data),
};
