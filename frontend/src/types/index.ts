export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UpscaleJob {
  job_id: string;
  status: JobStatus;
  message: string;
  input_url?: string;
  output_url?: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  input_url: string;
  output_url?: string;
  created_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface CreditsResponse {
  user_id: string;
  credits: number;
}
