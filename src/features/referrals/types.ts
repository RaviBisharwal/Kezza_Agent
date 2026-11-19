export type ReferralStatus = 'registered' | 'contacted' | 'consultation_booked' | 'converted' | 'not_converted' | 'rejected';

export type Referral = {
  id: string;
  patient_name: string;
  patient_phone_e164: string;
  referring_agent_id: string;
  status: ReferralStatus;
  service_interest: string | null;
  created_at: string;
  converted_at: string | null;
};

export type ReferralCodeInfo = {
  agent_code: string;
  referral_link: string;
  total_referrals: number;
  converted_count: number;
};

export type CreateLeadPayload = {
  patient_name: string;
  patient_phone_e164: string;
  service_interest?: string;
};
