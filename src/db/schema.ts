// Enhanced Database Schema - Main Entry Point
// This file imports and exports all schema modules for unified access
// Architecture: Modular design with performance, security, and business logic enhancements

// ============================================================================
// CORE SCHEMA IMPORTS - Original accounting tables
// ============================================================================
export * from './schema/core-schema';

// Re-export core tables and types for backward compatibility
export {
  users,
  accounts,
  transactions,
  transactionLines,
  accountingPeriods,
  accountTypeEnum,
  userRoleEnum,
  transactionStatusEnum,
  type User,
  type NewUser,
  type Account,
  type NewAccount,
  type Transaction,
  type NewTransaction,
  type TransactionLine,
  type NewTransactionLine,
  type AccountingPeriod,
  type NewAccountingPeriod,
} from './schema/core-schema';

// ============================================================================
// PERFORMANCE SCHEMA IMPORTS - Optimization and caching
// ============================================================================
export * from './schema/performance-schema';

// Export performance enhancement tables
export {
  accountBalanceCache,
  transactionSummaryCache,
  userActivityCache,
  queryOptimizationHints,
  databaseStatistics,
  cacheInvalidationLog,
  type AccountBalanceCache,
  type NewAccountBalanceCache,
  type TransactionSummaryCache,
  type NewTransactionSummaryCache,
  type UserActivityCache,
  type NewUserActivityCache,
  type QueryOptimizationHints,
  type NewQueryOptimizationHints,
  type DatabaseStatistics,
  type NewDatabaseStatistics,
  type CacheInvalidationLog,
  type NewCacheInvalidationLog,
} from './schema/performance-schema';

// ============================================================================
// SECURITY SCHEMA IMPORTS - Audit logging and access control
// ============================================================================
export * from './schema/security-schema';

// Export security enhancement tables
export {
  auditLog,
  userSessions,
  loginAttempts,
  permissions,
  rolePermissions,
  userPermissions,
  securityEvents,
  dataAccessLog,
  type AuditLog,
  type NewAuditLog,
  type UserSessions,
  type NewUserSessions,
  type LoginAttempts,
  type NewLoginAttempts,
  type Permissions,
  type NewPermissions,
  type RolePermissions,
  type NewRolePermissions,
  type UserPermissions,
  type NewUserPermissions,
  type SecurityEvents,
  type NewSecurityEvents,
  type DataAccessLog,
  type NewDataAccessLog,
} from './schema/security-schema';

// ============================================================================
// BUSINESS LOGIC SCHEMA IMPORTS - Validation and reporting
// ============================================================================
export * from './schema/business-schema';

// Export business logic enhancement tables
export {
  trialBalanceValidation,
  financialReports,
  accountingPeriodControls,
  accountReconciliation,
  backupOperations,
  recoveryOperations,
  businessRules,
  businessRuleExecutions,
  type TrialBalanceValidation,
  type NewTrialBalanceValidation,
  type FinancialReports,
  type NewFinancialReports,
  type AccountingPeriodControls,
  type NewAccountingPeriodControls,
  type AccountReconciliation,
  type NewAccountReconciliation,
  type BackupOperations,
  type NewBackupOperations,
  type RecoveryOperations,
  type NewRecoveryOperations,
  type BusinessRules,
  type NewBusinessRules,
  type BusinessRuleExecutions,
  type NewBusinessRuleExecutions,
} from './schema/business-schema';

// ============================================================================
// SCHEMA ORGANIZATION DOCUMENTATION
// ============================================================================

/**
 * Database Architecture Overview:
 *
 * Core Schema (`./schema/core-schema.ts`):
 * - users: User management and authentication
 * - accounts: Chart of accounts (COA)
 * - transactions: Journal entries and financial transactions
 * - transactionLines: Individual debit/credit line items
 * - accountingPeriods: Fiscal period management
 *
 * Performance Schema (`./schema/performance-schema.ts`):
 * - accountBalanceCache: Pre-calculated account balances
 * - transactionSummaryCache: Dashboard and reporting cache
 * - userActivityCache: User activity patterns for optimization
 * - queryOptimizationHints: Query planning optimization
 * - databaseStatistics: Performance metrics tracking
 * - cacheInvalidationLog: Cache refresh coordination
 *
 * Security Schema (`./schema/security-schema.ts`):
 * - auditLog: Comprehensive audit trail for all changes
 * - userSessions: Enhanced session management
 * - loginAttempts: Brute force protection
 * - permissions: Granular access control
 * - rolePermissions: Role-based permissions
 * - userPermissions: User-specific permission overrides
 * - securityEvents: Security incident tracking
 * - dataAccessLog: Compliance data access tracking
 *
 * Business Logic Schema (`./schema/business-schema.ts`):
 * - trialBalanceValidation: Automated balance validation
 * - financialReports: Generated financial reports storage
 * - accountingPeriodControls: Enhanced period management
 * - accountReconciliation: Account reconciliation tracking
 * - backupOperations: Backup operation monitoring
 * - recoveryOperations: Recovery operation tracking
 * - businessRules: Business rules engine
 * - businessRuleExecutions: Rule execution logging
 */

// ============================================================================
// MIGRATION INFORMATION
// ============================================================================

/**
 * Migration Strategy:
 *
 * Phase 1: Core tables exist (current implementation)
 * Phase 2: Add performance tables (non-breaking)
 * Phase 3: Add security tables (non-breaking)
 * Phase 4: Add business logic tables (non-breaking)
 * Phase 5: Enable features gradually (controlled rollout)
 *
 * All new tables are additive and won't affect existing functionality.
 * Original tables maintain their structure for backward compatibility.
 */