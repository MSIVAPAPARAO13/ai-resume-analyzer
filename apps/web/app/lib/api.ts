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
let failedQueue: Array<{
  resolve: (v: string) => void;
  reject: (e: any) => void;
}> = [];

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
        const res = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {
          refreshToken,
        });
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
  updateProfile: (data: any) =>
    apiClient.put('/profile', data).then((r) => r.data.data),

  getExperiences: () => apiClient.get('/experiences').then((r) => r.data.data),
  createExperience: (data: any) =>
    apiClient.post('/experiences', data).then((r) => r.data.data),
  updateExperience: (id: string, data: any) =>
    apiClient.put(`/experiences/${id}`, data).then((r) => r.data.data),
  deleteExperience: (id: string) =>
    apiClient.delete(`/experiences/${id}`).then((r) => r.data.data),

  getEducation: () => apiClient.get('/education').then((r) => r.data.data),
  createEducation: (data: any) =>
    apiClient.post('/education', data).then((r) => r.data.data),
  updateEducation: (id: string, data: any) =>
    apiClient.put(`/education/${id}`, data).then((r) => r.data.data),
  deleteEducation: (id: string) =>
    apiClient.delete(`/education/${id}`).then((r) => r.data.data),

  getProjects: () => apiClient.get('/projects').then((r) => r.data.data),
  createProject: (data: any) =>
    apiClient.post('/projects', data).then((r) => r.data.data),
  updateProject: (id: string, data: any) =>
    apiClient.put(`/projects/${id}`, data).then((r) => r.data.data),
  deleteProject: (id: string) =>
    apiClient.delete(`/projects/${id}`).then((r) => r.data.data),

  getSkills: () => apiClient.get('/skills').then((r) => r.data.data),
  createSkill: (data: any) =>
    apiClient.post('/skills', data).then((r) => r.data.data),
  updateSkill: (id: string, data: any) =>
    apiClient.put(`/skills/${id}`, data).then((r) => r.data.data),
  deleteSkill: (id: string) =>
    apiClient.delete(`/skills/${id}`).then((r) => r.data.data),

  getCertifications: () =>
    apiClient.get('/certifications').then((r) => r.data.data),
  createCertification: (data: any) =>
    apiClient.post('/certifications', data).then((r) => r.data.data),
  updateCertification: (id: string, data: any) =>
    apiClient.put(`/certifications/${id}`, data).then((r) => r.data.data),
  deleteCertification: (id: string) =>
    apiClient.delete(`/certifications/${id}`).then((r) => r.data.data),

  getAchievements: () =>
    apiClient.get('/achievements').then((r) => r.data.data),
  createAchievement: (data: any) =>
    apiClient.post('/achievements', data).then((r) => r.data.data),
  updateAchievement: (id: string, data: any) =>
    apiClient.put(`/achievements/${id}`, data).then((r) => r.data.data),
  deleteAchievement: (id: string) =>
    apiClient.delete(`/achievements/${id}`).then((r) => r.data.data),
};

// ─── Resume Intelligence API ──────────────────────────────────────────────────

export const resumeApi = {
  listResumes: () => apiClient.get('/resumes').then((r) => r.data.data),
  getResume: (id: string) =>
    apiClient.get(`/resumes/${id}`).then((r) => r.data.data),
  uploadResume: (formData: FormData) =>
    apiClient
      .post('/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data),
  deleteResume: (id: string) =>
    apiClient.delete(`/resumes/${id}`).then((r) => r.data.data),
  analyzeResume: (id: string, versionId?: string) =>
    apiClient
      .post(`/resumes/${id}/analyze`, { versionId })
      .then((r) => r.data.data),
  getAnalysis: (id: string) =>
    apiClient.get(`/resumes/${id}/analysis`).then((r) => r.data.data),
  listVersions: (id: string) =>
    apiClient.get(`/resumes/${id}/versions`).then((r) => r.data.data),
  getVersion: (id: string, versionId: string) =>
    apiClient
      .get(`/resumes/${id}/versions/${versionId}`)
      .then((r) => r.data.data),
};

// ─── Job Intelligence & Matching API ──────────────────────────────────────────

export const jobApi = {
  listJobs: () => apiClient.get('/jobs').then((r) => r.data.data),
  getJob: (id: string) => apiClient.get(`/jobs/${id}`).then((r) => r.data.data),
  createJob: (data: {
    title: string;
    company: string;
    location?: string | null;
    employmentType?: string | null;
    sourceUrl?: string | null;
    description: string;
  }) => apiClient.post('/jobs', data).then((r) => r.data.data),
  updateJob: (id: string, data: any) =>
    apiClient.put(`/jobs/${id}`, data).then((r) => r.data.data),
  deleteJob: (id: string) =>
    apiClient.delete(`/jobs/${id}`).then((r) => r.data.data),
  analyzeJob: (id: string) =>
    apiClient.post(`/jobs/${id}/analyze`).then((r) => r.data.data),
  getAnalysis: (id: string) =>
    apiClient.get(`/jobs/${id}/analysis`).then((r) => r.data.data),
  matchResume: (jobId: string, resumeId: string) =>
    apiClient.post(`/jobs/${jobId}/match/${resumeId}`).then((r) => r.data.data),
  getMatches: (jobId: string) =>
    apiClient.get(`/jobs/${jobId}/matches`).then((r) => r.data.data),
  getMatchById: (jobId: string, matchId: string) =>
    apiClient.get(`/jobs/${jobId}/matches/${matchId}`).then((r) => r.data.data),
};

// ─── Phase 5: AI Resume Tailoring API ──────────────────────────────────────────

export const tailoringApi = {
  generateTailoring: (
    resumeId: string,
    jobId: string,
    options?: { forceRefresh?: boolean; provider?: 'GEMINI' | 'MOCK' },
  ) =>
    apiClient
      .post(`/resumes/${resumeId}/tailor/${jobId}`, options)
      .then((r) => r.data.data),
  getSession: (sessionId: string) =>
    apiClient.get(`/tailoring/${sessionId}`).then((r) => r.data.data),
  acceptSuggestion: (sessionId: string, suggestionId: string) =>
    apiClient
      .post(`/tailoring/${sessionId}/suggestions/${suggestionId}/accept`)
      .then((r) => r.data.data),
  rejectSuggestion: (sessionId: string, suggestionId: string) =>
    apiClient
      .post(`/tailoring/${sessionId}/suggestions/${suggestionId}/reject`)
      .then((r) => r.data.data),
  completeSession: (sessionId: string) =>
    apiClient.post(`/tailoring/${sessionId}/complete`).then((r) => r.data.data),
};

// ─── Phase 5: Adzuna Job Discovery API ────────────────────────────────────────

export const jobSearchApi = {
  searchJobs: (params: {
    q?: string;
    location?: string;
    page?: number;
    resultsPerPage?: number;
    category?: string;
    salaryMin?: number;
    fullTime?: boolean;
    permanent?: boolean;
    country?: string;
  }) => apiClient.get('/job-search', { params }).then((r) => r.data.data),
  importJob: (data: {
    title: string;
    company: string;
    location?: string | null;
    employmentType?: string | null;
    sourceUrl?: string | null;
    description: string;
  }) => apiClient.post('/job-search/import', data).then((r) => r.data.data),
  getSalaryEstimate: (params: {
    title: string;
    location?: string;
    country?: string;
  }) =>
    apiClient
      .get('/job-search/salary-estimate', { params })
      .then((r) => r.data.data),
};

// ─── Phase 6: Application CRM API ─────────────────────────────────────────────

export const applicationApi = {
  listApplications: (params?: { status?: string; search?: string }) =>
    apiClient.get('/applications', { params }).then((r) => r.data.data),
  getAnalytics: () =>
    apiClient.get('/applications/analytics').then((r) => r.data.data),
  getApplication: (id: string) =>
    apiClient.get(`/applications/${id}`).then((r) => r.data.data),
  createApplication: (data: {
    jobId?: string | null;
    resumeVersionId?: string | null;
    tailoringSessionId?: string | null;
    company: string;
    role: string;
    jobUrl?: string | null;
    status?: string;
    appliedAt?: string | null;
    followUpAt?: string | null;
    recruiterName?: string | null;
    recruiterEmail?: string | null;
    notes?: string | null;
  }) => apiClient.post('/applications', data).then((r) => r.data.data),
  updateApplication: (id: string, data: any) =>
    apiClient.put(`/applications/${id}`, data).then((r) => r.data.data),
  deleteApplication: (id: string) =>
    apiClient.delete(`/applications/${id}`).then((r) => r.data.data),
  updateStatus: (
    id: string,
    status: string,
    notes?: string | null,
    eventDate?: string | null,
  ) =>
    apiClient
      .patch(`/applications/${id}/status`, { status, notes, eventDate })
      .then((r) => r.data.data),
  getEvents: (id: string) =>
    apiClient.get(`/applications/${id}/events`).then((r) => r.data.data),
  createEvent: (
    id: string,
    data: {
      type: string;
      description: string;
      eventDate?: string | null;
      metadata?: any;
    },
  ) =>
    apiClient.post(`/applications/${id}/events`, data).then((r) => r.data.data),
};

// ─── Phase 6: GitHub Career Evidence API ──────────────────────────────────────

export const githubApi = {
  getConnectUrl: () =>
    apiClient.get('/github/connect').then((r) => r.data.data),
  getConnectionStatus: () =>
    apiClient.get('/github/me').then((r) => r.data.data),
  disconnect: () =>
    apiClient.post('/github/disconnect').then((r) => r.data.data),
  listRepositories: (refresh?: boolean) =>
    apiClient
      .get('/github/repositories', {
        params: { refresh: refresh ? 'true' : undefined },
      })
      .then((r) => r.data.data),
  getRepository: (id: string) =>
    apiClient.get(`/github/repositories/${id}`).then((r) => r.data.data),
  getLanguages: (id: string) =>
    apiClient
      .get(`/github/repositories/${id}/languages`)
      .then((r) => r.data.data),
  getReadme: (id: string) =>
    apiClient.get(`/github/repositories/${id}/readme`).then((r) => r.data.data),
  importProject: (
    id: string,
    data: {
      name?: string;
      description?: string;
      technologies?: string[];
      projectUrl?: string;
      repoUrl?: string;
      startDate?: string;
      endDate?: string;
    },
  ) =>
    apiClient
      .post(`/github/repositories/${id}/import`, data)
      .then((r) => r.data.data),
  getEvidence: () => apiClient.get('/github/evidence').then((r) => r.data.data),
};

// ─── Phase 7: Interview Intelligence API ──────────────────────────────────────

export const interviewApi = {
  createSession: (data: {
    title: string;
    mode?: 'PREPARATION' | 'MOCK_INTERVIEW';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    applicationId?: string | null;
    jobId?: string | null;
    resumeVersionId?: string | null;
    tailoringSessionId?: string | null;
  }) => apiClient.post('/interviews', data).then((r) => r.data.data),

  listSessions: () => apiClient.get('/interviews').then((r) => r.data.data),

  getSession: (id: string) =>
    apiClient.get(`/interviews/${id}`).then((r) => r.data.data),

  updateSession: (id: string, data: any) =>
    apiClient.patch(`/interviews/${id}`, data).then((r) => r.data.data),

  deleteSession: (id: string) =>
    apiClient.delete(`/interviews/${id}`).then((r) => r.data.data),

  generateQuestions: (
    id: string,
    options?: {
      questionCount?: number;
      targetRole?: string;
      targetCompany?: string;
    },
  ) =>
    apiClient
      .post(`/interviews/${id}/generate-questions`, options || {})
      .then((r) => r.data.data),

  listQuestions: (id: string) =>
    apiClient.get(`/interviews/${id}/questions`).then((r) => r.data.data),

  submitAnswer: (
    id: string,
    questionId: string,
    data: { answerText: string; isDraft?: boolean },
  ) =>
    apiClient
      .post(`/interviews/${id}/questions/${questionId}/answer`, data)
      .then((r) => r.data.data),

  listAnswers: (id: string, questionId: string) =>
    apiClient
      .get(`/interviews/${id}/questions/${questionId}/answers`)
      .then((r) => r.data.data),

  evaluateAnswer: (id: string, questionId: string, answerId?: string) =>
    apiClient
      .post(`/interviews/${id}/questions/${questionId}/evaluate`, { answerId })
      .then((r) => r.data.data),

  getPrepPlan: (id: string) =>
    apiClient.get(`/interviews/${id}/prep-plan`).then((r) => r.data.data),

  completeSession: (id: string) =>
    apiClient.post(`/interviews/${id}/complete`).then((r) => r.data.data),

  getFinalReport: (id: string) =>
    apiClient.get(`/interviews/${id}/report`).then((r) => r.data.data),

  scheduleCalendarEvent: (
    id: string,
    eventData: {
      summary?: string;
      description?: string;
      startTime: string;
      endTime: string;
      timeZone?: string;
      includeNotes?: boolean;
    },
  ) =>
    apiClient
      .post(`/interviews/${id}/calendar-event`, eventData)
      .then((r) => r.data.data),
};

// ─── Phase 7: Calendar Integration API ────────────────────────────────────────

export const calendarApi = {
  getConnectUrl: () =>
    apiClient.get('/calendar/connect').then((r) => r.data.data),
  getStatus: () => apiClient.get('/calendar/status').then((r) => r.data.data),
  disconnect: () =>
    apiClient.post('/calendar/disconnect').then((r) => r.data.data),
};

// ─── Phase 8: Career Analytics API ───────────────────────────────────────────

export const analyticsApi = {
  getOverview: () =>
    apiClient.get('/analytics/overview').then((r) => r.data.data),
  getSkills: () => apiClient.get('/analytics/skills').then((r) => r.data.data),
  getSkillGaps: () =>
    apiClient.get('/analytics/skills/gaps').then((r) => r.data.data),
  getSkillDetail: (skill: string) =>
    apiClient
      .get(`/analytics/skills/${encodeURIComponent(skill)}`)
      .then((r) => r.data.data),
  getRoles: () => apiClient.get('/analytics/roles').then((r) => r.data.data),
  getJobs: () => apiClient.get('/analytics/jobs').then((r) => r.data.data),
  getApplications: () =>
    apiClient.get('/analytics/applications').then((r) => r.data.data),
  getInterviews: () =>
    apiClient.get('/analytics/interviews').then((r) => r.data.data),
  getResumes: () =>
    apiClient.get('/analytics/resumes').then((r) => r.data.data),
  getEvidence: () =>
    apiClient.get('/analytics/evidence').then((r) => r.data.data),
  getProgress: () =>
    apiClient.get('/analytics/progress').then((r) => r.data.data),
  createSnapshot: () =>
    apiClient.post('/analytics/snapshots').then((r) => r.data.data),
};

// ─── Phase 8: Learning Plan API ──────────────────────────────────────────────

export const learningApi = {
  listPlans: () => apiClient.get('/learning-plans').then((r) => r.data.data),
  createPlan: (data: {
    title: string;
    targetRole?: string;
    description?: string;
    targetDate?: string;
  }) => apiClient.post('/learning-plans', data).then((r) => r.data.data),
  getPlan: (id: string) =>
    apiClient.get(`/learning-plans/${id}`).then((r) => r.data.data),
  updatePlan: (id: string, data: any) =>
    apiClient.patch(`/learning-plans/${id}`, data).then((r) => r.data.data),
  deletePlan: (id: string) =>
    apiClient.delete(`/learning-plans/${id}`).then((r) => r.data.data),
  generatePlan: (id: string) =>
    apiClient.post(`/learning-plans/${id}/generate`).then((r) => r.data.data),
  getGoals: (id: string) =>
    apiClient.get(`/learning-plans/${id}/goals`).then((r) => r.data.data),
  addGoal: (id: string, data: any) =>
    apiClient
      .post(`/learning-plans/${id}/goals`, data)
      .then((r) => r.data.data),
  updateGoal: (goalId: string, data: any) =>
    apiClient.patch(`/learning-goals/${goalId}`, data).then((r) => r.data.data),
  addTask: (data: {
    goalId: string;
    title: string;
    description?: string;
    type?: string;
    dueDate?: string;
  }) => apiClient.post('/learning-tasks', data).then((r) => r.data.data),
  updateTask: (taskId: string, data: any) =>
    apiClient.patch(`/learning-tasks/${taskId}`, data).then((r) => r.data.data),
  deleteTask: (taskId: string) =>
    apiClient.delete(`/learning-tasks/${taskId}`).then((r) => r.data.data),
  completePlan: (id: string) =>
    apiClient.post(`/learning-plans/${id}/complete`).then((r) => r.data.data),
};
