export type Platform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'twitter'
  | 'snapchat'
  | 'spotify'
  | 'gaming';

export type TransactionStatus =
  | 'pending'
  | 'payment_received'
  | 'credentials_received'
  | 'takeover_in_progress'
  | 'completed'
  | 'refunded'
  | 'disputed';

export type PaymentMethod = 'stripe' | 'wire' | 'crypto';

export interface Transaction {
  _id: string;
  transactionId: string;
  buyerId: { _id: string; name: string; email: string } | string;
  sellerId: { _id: string; name: string; email: string } | string;
  platform: Platform;
  accountUsername?: string;
  accountDescription?: string;
  amount: number;
  escrowFee: number;
  totalToPay: number;
  status: TransactionStatus;
  progressStep: number;
  paymentMethod?: PaymentMethod;
  buyerCredentialsReceived: boolean;
  adminNotes?: string;
  completedAt?: string;
  refundedAt?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeCalculation {
  platform: Platform;
  amount: number;
  feeRate: number;
  escrowFee: number;
  totalToPay: number;
  minFee: number;
}

export interface CreateTransactionRequest {
  counterpartyEmail: string;
  platform: Platform;
  amount: number;
  role: 'buyer' | 'seller';
  accountUsername?: string;
  accountDescription?: string;
  paymentMethod?: PaymentMethod;
}

export interface SubmitCredentialsRequest {
  credentials: string;
  payoutInfo: string;
  recoveryEmail?: string;
}

export const PLATFORMS: { value: Platform; label: string; icon: string }[] = [
  { value: 'instagram', label: 'Instagram', icon: 'photo_camera' },
  { value: 'tiktok', label: 'TikTok', icon: 'music_video' },
  { value: 'youtube', label: 'YouTube', icon: 'play_circle' },
  { value: 'facebook', label: 'Facebook', icon: 'facebook' },
  { value: 'twitter', label: 'Twitter / X', icon: 'tag' },
  { value: 'snapchat', label: 'Snapchat', icon: 'chat_bubble' },
  { value: 'spotify', label: 'Spotify', icon: 'headphones' },
  { value: 'gaming', label: 'Gaming', icon: 'sports_esports' },
];
