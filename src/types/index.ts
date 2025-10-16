// Global type definitions for the accounting application

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'accountant' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  date: Date;
  reference: string;
  description: string;
  status: 'draft' | 'posted' | 'approved';
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionLine {
  id: string;
  transactionId: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
  createdAt: Date;
}

export interface DashboardData {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  recentTransactions: Transaction[];
}