import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateLeadPayload, Referral, ReferralCodeInfo } from './types';

export const referralKeys = {
  list: ['agent-referrals'] as const,
  code: ['agent-referral-code'] as const,
};

export function useAgentReferrals() {
  return useQuery({ queryKey: referralKeys.list, queryFn: async () => (await api.get<Referral[]>('/referrals')).data });
}

export function useAgentReferralCode() {
  return useQuery({ queryKey: referralKeys.code, queryFn: async () => (await api.get<ReferralCodeInfo>('/referrals/my-code')).data });
}

export function useCreateReferralLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateLeadPayload) => (await api.post<Referral>('/referrals/lead', payload)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: referralKeys.list });
      void queryClient.invalidateQueries({ queryKey: referralKeys.code });
    },
  });
}
