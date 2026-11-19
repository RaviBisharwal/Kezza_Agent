export type CommissionEntry = {
  id: string;
  tier_name: string | null;
  tier_percent: number;
  amount_minor_units: number;
  currency: string;
  status: string;
  created_at: string;
  treatment_name: string | null;
};

export type CurrencyTotals = {
  pending_minor_units: number;
  approved_minor_units: number;
  paid_minor_units: number;
  total_earned_minor_units: number;
};

export type AgentEarnings = {
  agent_code: string;
  commission_tier: string;
  tier_percent: number;
  eligible_direct_agents: number;
  pending_minor_units: number;
  approved_minor_units: number;
  paid_minor_units: number;
  total_earned_minor_units: number;
  earnings_by_currency: Record<string, CurrencyTotals>;
  ledger: CommissionEntry[];
};
