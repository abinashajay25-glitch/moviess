import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export const CineDubAPI = {
  // Languages & Voices
  getLanguages: async () => {
    const res = await api.get('/languages');
    return res.data;
  },

  getVoices: async (targetLang = 'ta') => {
    const res = await api.get(`/voices?target_lang=${targetLang}`);
    return res.data;
  },

  previewVoice: async (payload) => {
    const res = await api.post('/voice-preview', payload, {
      responseType: 'blob'
    });
    return URL.createObjectURL(res.data);
  },

  // Project CRUD & Upload
  getProjects: async () => {
    const res = await api.get('/projects');
    return res.data.data;
  },

  getProject: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data.data;
  },

  createProject: async (projectData) => {
    const res = await api.post('/projects', projectData);
    return res.data.data;
  },

  uploadMovie: async (projectId, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/projects/${projectId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          const pct = Math.round((evt.loaded * 100) / evt.total);
          onProgress(pct);
        }
      }
    });
    return res.data;
  },

  startProcessing: async (projectId) => {
    const res = await api.post(`/projects/${projectId}/start`);
    return res.data;
  },

  getProjectStatus: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/status`);
    return res.data.data;
  },

  cancelProcessing: async (projectId) => {
    const res = await api.post(`/projects/${projectId}/cancel`);
    return res.data;
  },

  retryProcessing: async (projectId) => {
    const res = await api.post(`/projects/${projectId}/retry`);
    return res.data;
  },

  deleteProject: async (projectId) => {
    const res = await api.delete(`/projects/${projectId}`);
    return res.data;
  },

  // Transcript & Subtitles
  getTranscript: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/transcript`);
    return res.data.data;
  },

  updateTranscript: async (projectId, segments) => {
    const res = await api.put(`/projects/${projectId}/transcript`, { segments });
    return res.data;
  },

  // Speakers & Casting
  getSpeakers: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/speakers`);
    return res.data.data;
  },

  updateSpeakers: async (projectId, speakers) => {
    const res = await api.put(`/projects/${projectId}/speakers`, { speakers });
    return res.data;
  },

  // Download & Media URLs
  getDownloadUrl: (projectId) => `/api/projects/${projectId}/download`,
  getSubtitleDownloadUrl: (projectId, format = 'target') => `/api/projects/${projectId}/subtitles?format_type=${format}`,
  getMediaStreamUrl: (projectId, mediaType = 'dubbed_video') => `/api/projects/${projectId}/media/${mediaType}`,

  // System
  getHardware: async () => {
    const res = await api.get('/system/hardware');
    return res.data;
  }
};

export default CineDubAPI;
