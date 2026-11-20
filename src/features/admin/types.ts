export type PendingCommission = {
  commission_id: string;
  agent_name: string;
  agent_phone_e164: string;
  agent_code: string;
  patient_name: string;
  patient_phone_e164: string;
  treatment_name: string;
  amount_minor_units: number;
  currency: string;
  tier_name: string;
  tier_percent: number;
  created_at: string;
};

export type ApprovalResponse = {
  commission_id: string;
  status: string;
  approved_at: string;
  approved_by_user_id: string;
};

export type BatchApprovalResponse = {
  approved_count: number;
  failed_count: number;
  approved_commission_ids: string[];
  approved_by_user_id: string;
};

export type AdminOverview = {
  patients: number;
  active_patients: number;
  active_agents: number;
  pending_commissions: number;
  active_branches: number;
  open_referrals: number;
  loyalty_points_issued: number;
  loyalty_points_redeemed: number;
  loyalty_points_available: number;
  approved_commissions_minor_units: number;
  verified_payments_minor_units: number;
  currency: string;
};

export type AdminReferral = {
  referral_id: string; patient_name: string; patient_phone_e164: string; status: string;
  service_interest: string | null; agent_code: string; agent_name: string;
  branch_name: string | null; created_at: string;
};

export type BranchFinancial = {
  branch_id: string; code: string; name: string; city: string; is_active: boolean;
  verified_payments: number; verified_revenue_minor_units: number; currency: string;
};

export type AdminPatient = {
  patient_id: string; full_name: string; phone_e164: string;
  total_points: number; credit_minor_units: number;
};
