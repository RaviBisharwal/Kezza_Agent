import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminOverview, AdminPatient, AdminReferral, ApprovalResponse, BatchApprovalResponse, BranchFinancial, PendingCommission } from './types';

export function useAdminOverview() {
  return useQuery<AdminOverview>({
    queryKey: ['admin', 'overview'],
    queryFn: async () => (await api.get('/admin/overview')).data,
    refetchInterval: 60_000,
  });
}

export function usePendingCommissions() {
  return useQuery<PendingCommission[]>({
    queryKey: ['admin', 'commissions', 'pending'],
    queryFn: async () => {
      const { data } = await api.get('/admin/commissions/pending');
      return data;
    },
  });
}

export function useAdminReferrals() {
  return useQuery<AdminReferral[]>({ queryKey: ['admin', 'referrals'], queryFn: async () => (await api.get('/admin/referrals')).data });
}

export function useBranchFinancials() {
  return useQuery<BranchFinancial[]>({ queryKey: ['admin', 'branches'], queryFn: async () => (await api.get('/admin/reports/branches')).data });
}

export function useAdminPatientSearch(query: string) {
  return useQuery<AdminPatient[]>({
    queryKey: ['admin', 'patients', query], enabled: query.trim().length >= 2,
    queryFn: async () => (await api.get('/admin/patients/search', { params: { query: query.trim() } })).data,
  });
}

export function useGrantPatientPoints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { patientId: string; points: number; reason: string }) =>
      (await api.post(`/admin/patients/${payload.patientId}/points`, { points: payload.points, reason: payload.reason })).data,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'patients'] }); void qc.invalidateQueries({ queryKey: ['admin', 'overview'] }); },
  });
}

export function useApproveCommission() {
  const qc = useQueryClient();
  return useMutation<ApprovalResponse, Error, string>({
    mutationFn: async (commissionId: string) => {
      const { data } = await api.post(`/admin/commissions/${commissionId}/approve`);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
}

export function useApproveAllCommissions() {
  const qc = useQueryClient();
  return useMutation<BatchApprovalResponse, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post('/admin/commissions/approve-all');
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
}
