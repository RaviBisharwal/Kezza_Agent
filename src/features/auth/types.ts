export type AgentProfileResponse = {
  id: string;
  phone_e164: string;
  full_name: string;
  email?: string | null;
  role: 'agent' | 'patient' | 'admin';
  agent_id: string | null;
  agent_code: string | null;
};

export type OtpRequestResponse = { status: string; message: string; dev_code?: string };
export type OtpVerifyResponse = {
  status: 'success' | 'needs_registration';
  access_token?: string;
  phone_e164?: string;
  user?: AgentProfileResponse;
  message?: string;
};
export type AgentAuthResponse = { access_token: string; user: AgentProfileResponse };
