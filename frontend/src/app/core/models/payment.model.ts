export interface PaymentRecord {
  _id: string;
  transactionId: string;
  amount: number;
  method: 'stripe' | 'wire' | 'crypto';
  providerTxId?: string;
  stripePaymentIntentId?: string;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'failed';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  _id: string;
  transactionId: string;
  userId: { _id: string; name: string; email: string } | string;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  type: 'id' | 'proof' | 'contract';
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalRevenue: number;
  totalVolume: number;
}
