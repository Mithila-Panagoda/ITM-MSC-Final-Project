// User Types
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  CUSTOMER = 'CUSTOMER',
  CHARITY_MANAGER = 'CHARITY_MANAGER',
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  role: UserRole;
  wallet_address?: string;
  auth_type?: 'EMAIL' | 'WALLET';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  message: string;
}

export interface WalletLoginRequest {
  wallet_address: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

// Charity Types
export interface Charity {
  id: string;
  name: string;
  description: string;
  website?: string;
  contact_email: string;
  contract_address?: string;
  deployment_hash?: string;
  created_at: string;
  updated_at: string;
  campaigns_count: number;
  total_raised: number;
}

// Campaign Types
export enum CampaignStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ENDED = 'ENDED',
}

export interface Campaign {
  id: string;
  contract_address: string;
  charity: Charity;
  charity_id: string;
  title: string;
  description: string;
  goal_amount: number;
  raised_amount: number;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  deployment_hash?: string;
  created_at: string;
  updated_at: string;
  donations_count: number;
  progress_percentage: number;
  recent_donations?: Donation[];
}

export interface CampaignList {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  raised_amount: number;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  charity_name: string;
  donations_count: number;
  progress_percentage: number;
  created_at: string;
}

// Donation Types
export interface Donation {
  id: string;
  user: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  campaign: string;
  campaign_title: string;
  charity_name: string;
  amount?: number;
  token?: string;
  token_details?: Token;
  token_quantity?: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  donation_timestamp?: string;
  created_at: string;
}

export interface DonationCreate {
  campaign: string;
  amount?: number;
  token?: string;
  token_quantity?: number;
}

// Token Types
export interface Token {
  id: string;
  token_id: string;
  name: string;
  description?: string;
  value_fiat_lkr: number;
  charity: string;
}

// Transaction Types
export interface OnChainTransaction {
  id: string;
  transaction_hash: string;
  token: Token;
  from_address: string;
  to_address: string;
  amount: number;
  timestamp: string;
}

// Statistics Types
export interface CharityStats {
  total_campaigns: number;
  active_campaigns: number;
  total_raised: number;
  total_goal: number;
  progress_percentage: number;
  total_donations: number;
}

export interface CampaignStats {
  total_donations: number;
  unique_donors: number;
  goal_amount: number;
  raised_amount: number;
  progress_percentage: number;
  status: 'upcoming' | 'active' | 'ended';
  days_remaining: number;
}

export interface DonationStats {
  total_donations: number;
  total_amount_donated: number;
  campaigns_supported: number;
  charities_supported: number;
  first_donation?: string;
  latest_donation?: string;
}

export interface TransactionStats {
  total_transactions: number;
  total_volume: number;
  unique_addresses: number;
  top_tokens_by_transactions: Array<{
    token__name: string;
    count: number;
    volume: number;
  }>;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
