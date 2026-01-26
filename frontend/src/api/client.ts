import axios from 'axios';
import type { UpscaleJob, JobStatusResponse, CreditsResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export const uploadAndUpscale = async (file: File): Promise<UpscaleJob> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UpscaleJob>('/api/test/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const getJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
  const response = await api.get<JobStatusResponse>(`/api/jobs/${jobId}`);
  return response.data;
};

export const getCredits = async (): Promise<CreditsResponse> => {
  const response = await api.get<CreditsResponse>('/api/credits');
  return response.data;
};

export const getDownloadUrl = (jobId: string): string => {
  return `${API_BASE}/api/download/${jobId}`;
};

export default api;
