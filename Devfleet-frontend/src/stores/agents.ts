import { defineStore } from "pinia";
import { ref } from "vue";
import { agentAPI } from "../api/apis";

export interface Agent {
  id: string;
  hostname: string;
  os: string;
  arch?: string;
  isOnline: boolean;
  lastSeen: string;
  concurrency?: number;
  tags?: string[];
  totalmem?: string | number;
  latestHealth?: {
    cpuUsage: number;
    memUsage: number;
    diskUsage?: number | null;
    timestamp: string;
  } | null;
  totalExecutions?: number;
}

export const useAgentsStore = defineStore("agents", () => {
  const agents = ref<Agent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchAgents = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await agentAPI.getAgents();
      const data: any = response.data;
      agents.value = Array.isArray(data)
        ? data
        : Array.isArray(data?.agents)
        ? data.agents
        : Object.values(data || {});
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const getAgent = async (id: string) => {
    try {
      const response = await agentAPI.getAgent(id);
      const data: any = response.data;
      return data?.agent ?? data;
    } catch (err: any) {
      error.value = err.message;
      return null;
    }
  };

  const getAgentHealthHistory = async (id: string, range: string) => {
    try {
      const response = await agentAPI.getAgentHealthHistory(id, range);
      const data: any = response.data;
      return data?.history ?? [];
    } catch (err: any) {
      error.value = err.message;
      return [];
    }
  };

  return {
    agents,
    loading,
    error,
    fetchAgents,
    getAgent,
    getAgentHealthHistory,
  };
});
