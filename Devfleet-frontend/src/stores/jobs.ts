import { defineStore } from "pinia";
import { ref } from "vue";
import { jobAPI } from "../api/apis";

export interface Job {
  id: string;
  title: string;
  description?: string;
  script: string;
  status: "pending" | "running" | "completed" | "failed";
  agentId: string;
  env?: Record<string, string>;
  tags: string[];
  cron?: string;
  createdAt: Date;
  updatedAt: Date;
  logs?: any[];
  exitCode?: number;
  finishedAt?: Date;
}

export const useJobsStore = defineStore("jobs", () => {
  const jobs = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchJobs = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await jobAPI.getJobs();
      const data: any = response.data;
      const raw = data?.data ?? data;
      jobs.value = Array.isArray(raw) ? raw : Object.values(raw || {});
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const getJob = async (id: string) => {
    try {
      const response = await jobAPI.getJob(id);
      return response.data;
    } catch (err: any) {
      error.value = err.message;
      return null;
    }
  };

  const createJob = async (jobData: any) => {
    try {
      const response = await jobAPI.createJob(jobData);
      // Refresh the job list so the dashboard updates immediately
      await fetchJobs();
      return response.data;
    } catch (err: any) {
      error.value = err.message;
      return null;
    }
  };

  const getJobExecutions = async (jobDefinitionId: string): Promise<any[]> => {
    try {
      const response = await jobAPI.getJobExecutions(jobDefinitionId);
      const data: any = response.data;
      return data?.data ?? [];
    } catch (err: any) {
      error.value = err.message;
      return [];
    }
  };

  const reRunJob = async (executionId: string): Promise<any> => {
    try {
      const response = await jobAPI.reRunJob(executionId);
      const data: any = response.data;
      // Refresh the list after creating new execution
      await fetchJobs();
      return data?.data ?? null;
    } catch (err: any) {
      error.value = err.message;
      return null;
    }
  };

  const cancelJob = async (executionId: string): Promise<boolean> => {
    try {
      await jobAPI.cancelJob(executionId);
      // Refresh the job list or the specific job to reflect status
      await fetchJobs();
      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    }
  };

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    getJob,
    createJob,
    getJobExecutions,
    reRunJob,
    cancelJob,
  };

});
