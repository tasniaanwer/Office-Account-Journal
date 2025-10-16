// Business Logic Enhancement Schema
// This file contains business features: validation, reporting, period management, backup/recovery

import { sqliteTable, text, integer, real, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Business Logic: Trial Balance Validation
// Ensure accounting equation balances and detect discrepancies
export const trialBalanceValidation = sqliteTable('trial_balance_validation', {
  id: text('id').primaryKey(),
  periodId: text('period_id').notNull(),
  validationDate: integer('validation_date', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),

  // Balance calculations
  totalAssets: real('total_assets').notNull().default(0),
  totalLiabilities: real('total_liabilities').notNull().default(0),
  totalEquity: real('total_equity').notNull().default(0),
  totalRevenue: real('total_revenue').notNull().default(0),
  totalExpenses: real('total_expenses').notNull().default(0),

  // Debit/Credit totals
  totalDebits: real('total_debits').notNull().default(0),
  totalCredits: real('total_credits').notNull().default(0),

  // Validation results
  isBalanced: integer('is_balanced', { mode: 'boolean' }).notNull().default(false),
  debitCreditDifference: real('debit_credit_difference').notNull().default(0),
  accountingEquationDifference: real('accounting_equation_difference').notNull().default(0),

  // Status and tracking
  status: text('status', { enum: ['pending', 'validated', 'failed', 'warning'] }).notNull().default('pending'),
  validatedBy: text('validated_by'),
  validatedAt: integer('validated_at', { mode: 'timestamp' }),

  // Discrepancy details
  discrepancyDetails: text('discrepancy_details'), // JSON string with detailed breakdown
  recommendedActions: text('recommended_actions'), // JSON string with suggested fixes

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  periodIdx: index('trial_balance_period_idx').on(table.periodId),
  validationDateIdx: index('trial_balance_validation_date_idx').on(table.validationDate),
  statusIdx: index('trial_balance_status_idx').on(table.status),
  isBalancedIdx: index('trial_balance_is_balanced_idx').on(table.isBalanced),
}));

// Business Logic: Financial Reports
// Store generated financial reports for historical tracking
export const financialReports = sqliteTable('financial_reports', {
  id: text('id').primaryKey(),
  reportType: text('report_type', {
    enum: ['balance_sheet', 'income_statement', 'cash_flow', 'trial_balance', 'general_ledger', 'custom']
  }).notNull(),
  reportName: text('report_name').notNull(),
  description: text('description'),

  // Report parameters
  periodId: text('period_id').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),

  // Report data
  reportData: text('report_data').notNull(), // JSON string with complete report data
  reportFormat: text('report_format', { enum: ['json', 'pdf', 'excel', 'csv'] }).notNull().default('json'),

  // Generation details
  generatedBy: text('generated_by').notNull(),
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  generationTime: real('generation_time'), // Time taken to generate in seconds

  // Status and validation
  status: text('status', { enum: ['generating', 'completed', 'failed', 'archived'] }).notNull().default('generating'),
  isValid: integer('is_valid', { mode: 'boolean' }).notNull().default(false),
  validatedAt: integer('validated_at', { mode: 'timestamp' }),
  validatedBy: text('validated_by'),

  // File information
  filePath: text('file_path'),
  fileSize: integer('file_size'),
  checksum: text('checksum'),

  // Access control
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  accessLevel: text('access_level', { enum: ['viewer', 'accountant', 'admin'] }).notNull().default('accountant'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  reportTypeIdx: index('financial_reports_report_type_idx').on(table.reportType),
  periodIdx: index('financial_reports_period_idx').on(table.periodId),
  generatedByIdx: index('financial_reports_generated_by_idx').on(table.generatedBy),
  statusIdx: index('financial_reports_status_idx').on(table.status),
  generatedAtIdx: index('financial_reports_generated_at_idx').on(table.generatedAt),
  isPublicIdx: index('financial_reports_is_public_idx').on(table.isPublic),
  accessLevelIdx: index('financial_reports_access_level_idx').on(table.accessLevel),
}));

// Business Logic: Enhanced Period Management
// Advanced accounting period controls and validation
export const accountingPeriodControls = sqliteTable('accounting_period_controls', {
  id: text('id').primaryKey(),
  periodId: text('period_id').notNull().unique(),

  // Period status and controls
  canPostTransactions: integer('can_post_transactions', { mode: 'boolean' }).notNull().default(true),
  canApproveTransactions: integer('can_approve_transactions', { mode: 'boolean' }).notNull().default(true),
  canModifyAccounts: integer('can_modify_accounts', { mode: 'boolean' }).notNull().default(true),

  // Closing controls
  closingInProgress: integer('closing_in_progress', { mode: 'boolean' }).notNull().default(false),
  closedBy: text('closed_by'),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  closingNotes: text('closing_notes'),

  // Validation requirements
  requireTrialBalance: integer('require_trial_balance', { mode: 'boolean' }).notNull().default(true),
  requireReconciliation: integer('require_reconciliation', { mode: 'boolean' }).notNull().default(true),
  requireApproval: integer('require_approval', { mode: 'boolean' }).notNull().default(false),

  // Validation status
  trialBalanceValidated: integer('trial_balance_validated', { mode: 'boolean' }).notNull().default(false),
  reconciliationCompleted: integer('reconciliation_completed', { mode: 'boolean' }).notNull().default(false),
  allApproved: integer('all_approved', { mode: 'boolean' }).notNull().default(false),

  // Restrictions
  allowedUserRoles: text('allowed_user_roles'), // JSON array of roles that can work in this period
  restrictedAccountTypes: text('restricted_account_types'), // JSON array of account types that are restricted

  // Audit trail
  lastModifiedBy: text('last_modified_by'),
  lastModifiedAt: integer('last_modified_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  periodIdx: unique('accounting_period_controls_period_unique').on(table.periodId),
  closingInProgressIdx: index('accounting_period_controls_closing_idx').on(table.closingInProgress),
  canPostTransactionsIdx: index('accounting_period_controls_can_post_idx').on(table.canPostTransactions),
  trialBalanceValidatedIdx: index('accounting_period_controls_trial_balance_idx').on(table.trialBalanceValidated),
}));

// Business Logic: Account Reconciliation
// Track account reconciliation status and details
export const accountReconciliation = sqliteTable('account_reconciliation', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  periodId: text('period_id').notNull(),

  // Reconciliation amounts
  bookBalance: real('book_balance').notNull().default(0),
  statementBalance: real('statement_balance').notNull().default(0),
  difference: real('difference').notNull().default(0),

  // Reconciliation status
  status: text('status', { enum: ['pending', 'in_progress', 'reconciled', 'discrepancy_found', 'failed'] }).notNull().default('pending'),
  reconciledBy: text('reconciled_by'),
  reconciledAt: integer('reconciled_at', { mode: 'timestamp' }),

  // Reconciliation details
  reconciliationDate: integer('reconciliation_date', { mode: 'timestamp' }),
  statementDate: integer('statement_date', { mode: 'timestamp' }),
  statementReference: text('statement_reference'),

  // Discrepancy tracking
  discrepancyItems: text('discrepancy_items'), // JSON array of discrepancy details
  adjustmentTransactions: text('adjustment_transactions'), // JSON array of adjustment transaction IDs

  // Review and approval
  reviewedBy: text('reviewed_by'),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  approvedBy: text('approved_by'),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  reviewNotes: text('review_notes'),

  // Supporting documents
  supportingDocuments: text('supporting_documents'), // JSON array of document references

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  accountPeriodIdx: unique('account_reconciliation_account_period_unique').on(table.accountId, table.periodId),
  accountIdIdx: index('account_reconciliation_account_idx').on(table.accountId),
  periodIdx: index('account_reconciliation_period_idx').on(table.periodId),
  statusIdx: index('account_reconciliation_status_idx').on(table.status),
  reconciledAtIdx: index('account_reconciliation_reconciled_at_idx').on(table.reconciledAt),
}));

// Business Logic: Backup and Recovery Tracking
// Monitor database backups and recovery operations
export const backupOperations = sqliteTable('backup_operations', {
  id: text('id').primaryKey(),
  backupType: text('backup_type', { enum: ['full', 'incremental', 'differential', 'transaction_log'] }).notNull(),
  backupName: text('backup_name').notNull(),
  description: text('description'),

  // Backup details
  startTime: integer('start_time', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  endTime: integer('end_time', { mode: 'timestamp' }),
  duration: real('duration'), // Duration in seconds

  // Backup data
  filePath: text('file_path'),
  fileSize: integer('file_size'),
  checksum: text('checksum'),
  compressionRatio: real('compression_ratio'),

  // Backup scope
  tablesIncluded: text('tables_included'), // JSON array of table names
  dateRange: text('date_range'), // JSON object with start/end dates
  recordCount: integer('record_count'),

  // Status and results
  status: text('status', { enum: ['running', 'completed', 'failed', 'cancelled', 'verifying'] }).notNull().default('running'),
  success: integer('success', { mode: 'boolean' }),
  errorMessage: text('error_message'),
  errorDetails: text('error_details'),

  // Verification
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }),
  verifiedBy: text('verified_by'),
  verificationChecksum: text('verification_checksum'),

  // Retention and lifecycle
  retentionDays: integer('retention_days').notNull().default(90),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),

  // initiated by
  initiatedBy: text('initiated_by').notNull(),
  initiatedByRole: text('initiated_by_role', { enum: ['admin', 'accountant', 'viewer', 'system'] }).notNull(),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  backupTypeIdx: index('backup_operations_type_idx').on(table.backupType),
  statusIdx: index('backup_operations_status_idx').on(table.status),
  startTimeIdx: index('backup_operations_start_time_idx').on(table.startTime),
  initiatedByIdx: index('backup_operations_initiated_by_idx').on(table.initiatedBy),
  verifiedIdx: index('backup_operations_verified_idx').on(table.verified),
  expiresAtIdx: index('backup_operations_expires_at_idx').on(table.expiresAt),
  archivedIdx: index('backup_operations_archived_idx').on(table.archived),
}));

// Business Logic: Recovery Operations
// Track database recovery and restore operations
export const recoveryOperations = sqliteTable('recovery_operations', {
  id: text('id').primaryKey(),
  recoveryType: text('recovery_type', { enum: ['full_restore', 'partial_restore', 'point_in_time', 'transaction_rollback'] }).notNull(),
  recoveryName: text('recovery_name').notNull(),
  description: text('description'),

  // Source backup
  backupId: text('backup_id').notNull(),
  backupName: text('backup_name').notNull(),
  backupDate: integer('backup_date', { mode: 'timestamp' }).notNull(),

  // Recovery details
  startTime: integer('start_time', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  endTime: integer('end_time', { mode: 'timestamp' }),
  duration: real('duration'),

  // Recovery scope
  targetTables: text('target_tables'), // JSON array of tables to restore
  pointInTime: integer('point_in_time', { mode: 'timestamp' }),
  transactionIds: text('transaction_ids'), // JSON array of specific transaction IDs

  // Status and results
  status: text('status', { enum: ['preparing', 'running', 'completed', 'failed', 'rolled_back'] }).notNull().default('preparing'),
  success: integer('success', { mode: 'boolean' }),
  recordsRestored: integer('records_restored'),
  tablesRestored: integer('tables_restored'),

  // Error handling
  errorMessage: text('error_message'),
  errorDetails: text('error_details'),
  rollbackReason: text('rollback_reason'),

  // Verification
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }),
  verifiedBy: text('verified_by'),
  verificationResults: text('verification_results'), // JSON with verification details

  // Impact assessment
  dataLossRisk: text('data_loss_risk', { enum: ['none', 'low', 'medium', 'high', 'critical'] }).notNull().default('none'),
  affectedUsers: text('affected_users'), // JSON array of affected user IDs
  downtimeMinutes: integer('downtime_minutes'),

  // Approval and authorization
  requestedBy: text('requested_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  approvalNotes: text('approval_notes'),

  // Post-recovery
  postRecoveryNotes: text('post_recovery_notes'),
  followUpRequired: integer('follow_up_required', { mode: 'boolean' }).notNull().default(false),
  followUpCompleted: integer('follow_up_completed', { mode: 'boolean' }).notNull().default(false),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  recoveryTypeIdx: index('recovery_operations_type_idx').on(table.recoveryType),
  backupIdIdx: index('recovery_operations_backup_idx').on(table.backupId),
  statusIdx: index('recovery_operations_status_idx').on(table.status),
  startTimeIdx: index('recovery_operations_start_time_idx').on(table.startTime),
  requestedByIdx: index('recovery_operations_requested_by_idx').on(table.requestedBy),
  dataLossRiskIdx: index('recovery_operations_data_loss_risk_idx').on(table.dataLossRisk),
}));

// Business Logic: Business Rules Engine
// Define and enforce business rules for financial operations
export const businessRules = sqliteTable('business_rules', {
  id: text('id').primaryKey(),
  ruleName: text('rule_name').notNull().unique(),
  ruleType: text('rule_type', {
    enum: ['validation', 'approval', 'restriction', 'notification', 'automation']
  }).notNull(),
  category: text('category', {
    enum: ['transaction', 'account', 'period', 'user', 'report', 'system']
  }).notNull(),

  // Rule definition
  description: text('description').notNull(),
  condition: text('condition').notNull(), // JSON or SQL condition
  action: text('action').notNull(), // JSON object describing action to take

  // Rule configuration
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  priority: integer('priority').notNull().default(0), // Higher number = higher priority
  severity: text('severity', { enum: ['info', 'warning', 'error', 'critical'] }).notNull().default('warning'),

  // Execution details
  triggerEvents: text('trigger_events'), // JSON array of events that trigger this rule
  executionCount: integer('execution_count').notNull().default(0),
  lastExecuted: integer('last_executed', { mode: 'timestamp' }),

  // Scope and applicability
  appliesToRoles: text('applies_to_roles'), // JSON array of roles this rule applies to
  appliesToAccountTypes: text('applies_to_account_types'), // JSON array of account types
  appliesToTransactionTypes: text('applies_to_transaction_types'), // JSON array of transaction types

  // Exceptions and overrides
  exceptions: text('exceptions'), // JSON array of exception conditions
  canBeOverridden: integer('can_be_overridden', { mode: 'boolean' }).notNull().default(false),
  overrideRoles: text('override_roles'), // JSON array of roles that can override this rule

  // Maintenance
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: text('updated_by'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),

  // Testing and validation
  testCases: text('test_cases'), // JSON array of test cases
  lastTested: integer('last_tested', { mode: 'timestamp' }),
  testResults: text('test_results'), // JSON with test results
}, (table) => ({
  ruleNameIdx: unique('business_rules_name_unique').on(table.ruleName),
  ruleTypeIdx: index('business_rules_type_idx').on(table.ruleType),
  categoryIdx: index('business_rules_category_idx').on(table.category),
  isActiveIdx: index('business_rules_is_active_idx').on(table.isActive),
  priorityIdx: index('business_rules_priority_idx').on(table.priority),
  severityIdx: index('business_rules_severity_idx').on(table.severity),
  lastExecutedIdx: index('business_rules_last_executed_idx').on(table.lastExecuted),
}));

// Business Logic: Rule Execution Log
// Track when business rules are executed and their outcomes
export const businessRuleExecutions = sqliteTable('business_rule_executions', {
  id: text('id').primaryKey(),
  ruleId: text('rule_id').notNull(),
  ruleName: text('rule_name').notNull(),

  // Execution context
  triggerEvent: text('trigger_event').notNull(),
  triggeredBy: text('triggered_by').notNull(),
  transactionId: text('transaction_id'),
  accountId: text('account_id'),
  userId: text('user_id'),

  // Execution details
  executedAt: integer('executed_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  executionTime: real('execution_time'), // Time in milliseconds
  success: integer('success', { mode: 'boolean' }).notNull(),

  // Rule evaluation
  conditionMet: integer('condition_met', { mode: 'boolean' }).notNull(),
  actionTaken: text('action_taken'),
  actionResult: text('action_result'), // JSON with action result details

  // Error handling
  errorMessage: text('error_message'),
  errorDetails: text('error_details'),

  // Impact
  recordsAffected: integer('records_affected'),
  usersNotified: integer('users_notified'),

  // Follow-up
  requiresFollowUp: integer('requires_follow_up', { mode: 'boolean' }).notNull().default(false),
  followUpCompleted: integer('follow_up_completed', { mode: 'boolean' }).notNull().default(false),
  followUpNotes: text('follow_up_notes'),
}, (table) => ({
  ruleIdIdx: index('business_rule_executions_rule_idx').on(table.ruleId),
  triggeredByIdx: index('business_rule_executions_triggered_by_idx').on(table.triggeredBy),
  executedAtIdx: index('business_rule_executions_executed_at_idx').on(table.executedAt),
  successIdx: index('business_rule_executions_success_idx').on(table.success),
  conditionMetIdx: index('business_rule_executions_condition_met_idx').on(table.conditionMet),
  requiresFollowUpIdx: index('business_rule_executions_requires_follow_up_idx').on(table.requiresFollowUp),
}));

// Export types for business schema
export type TrialBalanceValidation = typeof trialBalanceValidation.$inferSelect;
export type NewTrialBalanceValidation = typeof trialBalanceValidation.$inferInsert;

export type FinancialReports = typeof financialReports.$inferSelect;
export type NewFinancialReports = typeof financialReports.$inferInsert;

export type AccountingPeriodControls = typeof accountingPeriodControls.$inferSelect;
export type NewAccountingPeriodControls = typeof accountingPeriodControls.$inferInsert;

export type AccountReconciliation = typeof accountReconciliation.$inferSelect;
export type NewAccountReconciliation = typeof accountReconciliation.$inferInsert;

export type BackupOperations = typeof backupOperations.$inferSelect;
export type NewBackupOperations = typeof backupOperations.$inferInsert;

export type RecoveryOperations = typeof recoveryOperations.$inferSelect;
export type NewRecoveryOperations = typeof recoveryOperations.$inferInsert;

export type BusinessRules = typeof businessRules.$inferSelect;
export type NewBusinessRules = typeof businessRules.$inferInsert;

export type BusinessRuleExecutions = typeof businessRuleExecutions.$inferSelect;
export type NewBusinessRuleExecutions = typeof businessRuleExecutions.$inferInsert;