export type TransactionType = 'sbp' | 'visa' | 'deposit' | 'withdraw';

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  category: string;
  amountRub?: number;
  amountUsdt: number;
  rate?: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  icon: string;
}

export interface UserProfile {
  name: string;
  username: string;
  avatar: string;
  isKycVerified: boolean;
  kycTier: string;
}

export interface CardInfo {
  panMasked: string;
  panFull: string;
  cardholder: string;
  expiry: string;
  cvv: string;
  isFrozen: boolean;
  type: 'visa_platinum';
}
