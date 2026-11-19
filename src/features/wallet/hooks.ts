import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AgentEarnings } from './types';

export function useAgentEarnings() {
  return useQuery({
    queryKey: ['agent-earnings'],
    queryFn: async () => (await api.get<AgentEarnings>('/wallet/agent')).data,
  });
}
