import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AgentAuthResponse, OtpRequestResponse, OtpVerifyResponse } from './types';

export function useRequestOtp() {
  return useMutation({
    mutationFn: async (phone_e164: string) => (await api.post<OtpRequestResponse>('/auth/otp/request', { phone_e164 })).data,
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (payload: { phone_e164: string; otp_code: string }) => (await api.post<OtpVerifyResponse>('/auth/otp/verify', payload)).data,
  });
}

export function useRegisterAgent() {
  return useMutation({
    mutationFn: async (payload: { phone_e164: string; full_name: string; role: 'agent' }) =>
      (await api.post<AgentAuthResponse>('/auth/register', payload)).data,
  });
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) =>
      (await api.post<AgentAuthResponse>('/auth/admin/login', payload)).data,
  });
}
