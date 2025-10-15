// Performance Optimization Schema
// This file contains performance enhancements: optimized indexes, caching tables, and analytics views

import { sqliteTable, text, integer, real, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Performance Enhancement: Account Balance Cache
// Pre-calculated account balances to avoid real-time computation
export const accountBalanceCache = sqliteTable('account_balance_cache', {
  accountId: text('account_id').primaryKey(),
  accountCode: text('account_code').notNull(),
  accountName: text('account_name').notNull(),
  accountType: text('account_type', { enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] }).notNull(),
  periodId: text('period_id').notNull(),
  totalDebit: real('total_debit').notNull().default(0),
  totalCredit: real('total_credit').notNull().default(0),
  balance: real('balance').notNull().default(0),
  lastTransactionId: text('last_transaction_id'),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  accountPeriodIdx: index('account_balance_account_period_idx').on(table.accountId, table.periodId),
  accountTypeIdx: index('account_balance_type_idx').on(table.accountType),
  lastUpdatedIdx: index('account_balance_last_updated_idx').on(table.lastUpdated),
}));

// Performance Enhancement: Transaction Summary Cache
// Pre-calculated transaction summaries for dashboard and reporting
export const transactionSummaryCache = sqliteTable('transaction_summary_cache', {
  id: text('id').primaryKey(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  periodId: text('period_id').notNull(),
  totalTransactions: integer('total_transactions').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  totalDebit: real('total_debit').notNull().default(0),
  totalCredit: real('total_credit').notNull().default(0),
  draftCount: integer('draft_count').notNull().default(0),
  postedCount: integer('posted_count').notNull().default(0),
  approvedCount: integer('approved_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  dateIdx: index('transaction_summary_date_idx').on(table.date),
  periodIdx: index('transaction_summary_period_idx').on(table.periodId),
  datePeriodIdx: unique('transaction_summary_date_period_unique').on(table.date, table.periodId),
}));

// Performance Enhancement: User Activity Cache
// Track user activity patterns for performance optimization
export const userActivityCache = sqliteTable('user_activity_cache', {
  userId: text('user_id').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  transactionCount: integer('transaction_count').notNull().default(0),
  loginCount: integer('login_count').notNull().default(0),
  lastActivity: integer('last_activity', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userDateIdx: unique('user_activity_user_date_unique').on(table.userId, table.date),
  userIdx: index('user_activity_user_idx').on(table.userId),
  lastActivityIdx: index('user_activity_last_activity_idx').on(table.lastActivity),
}));

// Performance Enhancement: Composite Indexes for Common Queries
// These are additional indexes that will improve query performance

// Index for transaction lines with account and transaction (common reporting query)
export const transactionLinesCompositeIdx = index('transaction_lines_composite_idx')
  .on(sql`(transaction_id)`, sql`(account_id)`);

// Index for transactions by date and status (common dashboard query)
export const transactionsDateStatusIdx = index('transactions_date_status_idx')
  .on(sql`(date)`, sql`(status)`);

// Index for accounts by type and active status (common chart of accounts query)
export const accountsTypeActiveIdx = index('accounts_type_active_idx')
  .on(sql`(type)`, sql`(is_active)`);

// Index for transaction lines by account and date (for account statements)
export const transactionLinesAccountDateIdx = index('transaction_lines_account_date_idx')
  .on(sql`(account_id)`, sql`(created_at)`);

// Performance Enhancement: Query Optimization Hints
// These tables store optimization metadata for query planning

export const queryOptimizationHints = sqliteTable('query_optimization_hints', {
  id: text('id').primaryKey(),
  queryPattern: text('query_pattern').notNull(),
  optimalIndex: text('optimal_index').notNull(),
  estimatedRows: integer('estimated_rows').notNull(),
  actualRows: integer('actual_rows'),
  executionTime: real('execution_time'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  lastUsed: integer('last_used', { mode: 'timestamp' }),
}, (table) => ({
  queryPatternIdx: unique('query_optimization_pattern_unique').on(table.queryPattern),
  optimalIndexIdx: index('query_optimization_index_idx').on(table.optimalIndex),
}));

// Performance Enhancement: Database Statistics
// Track database performance metrics
export const databaseStatistics = sqliteTable('database_statistics', {
  id: text('id').primaryKey(),
  metricName: text('metric_name').notNull(),
  metricValue: real('metric_value').notNull(),
  metricUnit: text('metric_unit'),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  metricNameIdx: index('database_stats_metric_name_idx').on(table.metricName),
  recordedAtIdx: index('database_stats_recorded_at_idx').on(table.recordedAt),
  metricRecordedIdx: unique('database_stats_metric_recorded_unique').on(table.metricName, table.recordedAt),
}));

// Performance Enhancement: Cache Invalidation Log
// Track when cache entries need to be refreshed
export const cacheInvalidationLog = sqliteTable('cache_invalidation_log', {
  id: text('id').primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation', { enum: ['insert', 'update', 'delete'] }).notNull(),
  invalidatedAt: integer('invalidated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  processed: integer('processed', { mode: 'boolean' }).notNull().default(false),
  processedAt: integer('processed_at', { mode: 'timestamp' }),
}, (table) => ({
  tableRecordIdx: index('cache_invalidation_table_record_idx').on(table.tableName, table.recordId),
  processedIdx: index('cache_invalidation_processed_idx').on(table.processed),
  invalidatedAtIdx: index('cache_invalidation_invalidated_at_idx').on(table.invalidatedAt),
}));

// Export types for performance schema
export type AccountBalanceCache = typeof accountBalanceCache.$inferSelect;
export type NewAccountBalanceCache = typeof accountBalanceCache.$inferInsert;

export type TransactionSummaryCache = typeof transactionSummaryCache.$inferSelect;
export type NewTransactionSummaryCache = typeof transactionSummaryCache.$inferInsert;

export type UserActivityCache = typeof userActivityCache.$inferSelect;
export type NewUserActivityCache = typeof userActivityCache.$inferInsert;

export type QueryOptimizationHints = typeof queryOptimizationHints.$inferSelect;
export type NewQueryOptimizationHints = typeof queryOptimizationHints.$inferInsert;

export type DatabaseStatistics = typeof databaseStatistics.$inferSelect;
export type NewDatabaseStatistics = typeof databaseStatistics.$inferInsert;

export type CacheInvalidationLog = typeof cacheInvalidationLog.$inferSelect;
export type NewCacheInvalidationLog = typeof cacheInvalidationLog.$inferInsert;