// Security Enhancement Schema
// This file contains security features: audit logging, session management, access control

import { sqliteTable, text, integer, real, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Security Enhancement: Comprehensive Audit Log
// Track all changes to financial data with full context
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation', { enum: ['insert', 'update', 'delete', 'select'] }).notNull(),
  userId: text('user_id').notNull(),
  userRole: text('user_role', { enum: ['admin', 'accountant', 'viewer'] }).notNull(),
  userEmail: text('user_email').notNull(),
  sessionId: text('session_id'),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),

  // Old values (for updates/deletes)
  oldValues: text('old_values'), // JSON string

  // New values (for inserts/updates)
  newValues: text('new_values'), // JSON string

  // Additional context
  requestId: text('request_id'),
  apiEndpoint: text('api_endpoint'),
  httpMethod: text('http_method'),
  success: integer('success', { mode: 'boolean' }).notNull().default(true),
  errorMessage: text('error_message'),

  // Risk assessment
  riskLevel: text('risk_level', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('low'),
  requiresReview: integer('requires_review', { mode: 'boolean' }).notNull().default(false),
  reviewedBy: text('reviewed_by'),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewNotes: text('review_notes'),
}, (table) => ({
  tableRecordIdx: index('audit_log_table_record_idx').on(table.tableName, table.recordId),
  userIdx: index('audit_log_user_idx').on(table.userId),
  timestampIdx: index('audit_log_timestamp_idx').on(table.timestamp),
  operationIdx: index('audit_log_operation_idx').on(table.operation),
  riskLevelIdx: index('audit_log_risk_level_idx').on(table.riskLevel),
  requiresReviewIdx: index('audit_log_requires_review_idx').on(table.requiresReview),
  sessionIdIdx: index('audit_log_session_idx').on(table.sessionId),
  ipAddressIdx: index('audit_log_ip_address_idx').on(table.ipAddress),
  requestIdIdx: index('audit_log_request_id_idx').on(table.requestId),
}));

// Security Enhancement: Enhanced Session Management
// Track user sessions with security metadata
export const userSessions = sqliteTable('user_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  sessionToken: text('session_token').notNull().unique(),
  refreshToken: text('refresh_token'),

  // Session metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),

  // Security context
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  deviceFingerprint: text('device_fingerprint'),

  // Geographic data (if available)
  country: text('country'),
  city: text('city'),

  // Session status
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  logoutReason: text('logout_reason', { enum: ['manual', 'timeout', 'forced', 'security_breach'] }),
  terminatedAt: integer('terminated_at', { mode: 'timestamp' }),
  terminatedBy: text('terminated_by'),

  // Security flags
  isSuspicious: integer('is_suspicious', { mode: 'boolean' }).notNull().default(false),
  riskScore: real('risk_score').notNull().default(0),
  requiresMFA: integer('requires_mfa', { mode: 'boolean' }).notNull().default(false),
  mfaVerifiedAt: integer('mfa_verified_at', { mode: 'timestamp' }),
}, (table) => ({
  userIdx: index('user_sessions_user_idx').on(table.userId),
  sessionTokenIdx: unique('user_sessions_token_unique').on(table.sessionToken),
  refreshTokenIdx: unique('user_sessions_refresh_token_unique').on(table.refreshToken),
  lastAccessedIdx: index('user_sessions_last_accessed_idx').on(table.lastAccessedAt),
  expiresAtIdx: index('user_sessions_expires_at_idx').on(table.expiresAt),
  ipAddressIdx: index('user_sessions_ip_address_idx').on(table.ipAddress),
  isActiveIdx: index('user_sessions_is_active_idx').on(table.isActive),
  isSuspiciousIdx: index('user_sessions_is_suspicious_idx').on(table.isSuspicious),
}));

// Security Enhancement: Login Attempt Tracking
// Monitor and prevent brute force attacks
export const loginAttempts = sqliteTable('login_attempts', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),

  // Attempt details
  success: integer('success', { mode: 'boolean' }).notNull(),
  failureReason: text('failure_reason', { enum: ['invalid_credentials', 'account_locked', 'rate_limit', 'mfa_required', 'unknown'] }),

  // Security context
  sessionId: text('session_id'),
  deviceFingerprint: text('device_fingerprint'),
  country: text('country'),
  city: text('city'),

  // Risk assessment
  riskScore: real('risk_score').notNull().default(0),
  blocked: integer('blocked', { mode: 'boolean' }).notNull().default(false),
  blockedUntil: integer('blocked_until', { mode: 'timestamp' }),
  blockReason: text('block_reason'),
}, (table) => ({
  emailIdx: index('login_attempts_email_idx').on(table.email),
  ipAddressIdx: index('login_attempts_ip_address_idx').on(table.ipAddress),
  timestampIdx: index('login_attempts_timestamp_idx').on(table.timestamp),
  successIdx: index('login_attempts_success_idx').on(table.success),
  blockedIdx: index('login_attempts_blocked_idx').on(table.blocked),
  emailTimestampIdx: index('login_attempts_email_timestamp_idx').on(table.email, table.timestamp),
  ipTimestampIdx: index('login_attempts_ip_timestamp_idx').on(table.ipAddress, table.timestamp),
}));

// Security Enhancement: Granular Permissions System
// Fine-grained access control beyond basic roles
export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  resource: text('resource').notNull(), // e.g., 'transactions', 'accounts', 'reports'
  action: text('action').notNull(), // e.g., 'create', 'read', 'update', 'delete', 'approve'
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  nameIdx: unique('permissions_name_unique').on(table.name),
  resourceIdx: index('permissions_resource_idx').on(table.resource),
  actionIdx: index('permissions_action_idx').on(table.action),
  resourceActionIdx: unique('permissions_resource_action_unique').on(table.resource, table.action),
  isActiveIdx: index('permissions_is_active_idx').on(table.isActive),
}));

// Security Enhancement: Role-Permission Mapping
// Associate permissions with roles
export const rolePermissions = sqliteTable('role_permissions', {
  id: text('id').primaryKey(),
  roleId: text('role_id').notNull(), // References role enum values
  permissionId: text('permission_id').notNull().references(() => permissions.id),
  grantedBy: text('granted_by').notNull(),
  grantedAt: integer('granted_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
}, (table) => ({
  rolePermissionIdx: unique('role_permissions_role_permission_unique').on(table.roleId, table.permissionId),
  roleIdIdx: index('role_permissions_role_idx').on(table.roleId),
  permissionIdIdx: index('role_permissions_permission_idx').on(table.permissionId),
  isActiveIdx: index('role_permissions_is_active_idx').on(table.isActive),
}));

// Security Enhancement: User-Specific Permissions
// Override role permissions for specific users
export const userPermissions = sqliteTable('user_permissions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  permissionId: text('permission_id').notNull().references(() => permissions.id),
  granted: integer('granted', { mode: 'boolean' }).notNull(), // true to grant, false to deny
  grantedBy: text('granted_by').notNull(),
  grantedAt: integer('granted_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  reason: text('reason'),
}, (table) => ({
  userPermissionIdx: unique('user_permissions_user_permission_unique').on(table.userId, table.permissionId),
  userIdx: index('user_permissions_user_idx').on(table.userId),
  permissionIdIdx: index('user_permissions_permission_idx').on(table.permissionId),
  grantedIdx: index('user_permissions_granted_idx').on(table.granted),
  expiresAtIdx: index('user_permissions_expires_at_idx').on(table.expiresAt),
}));

// Security Enhancement: Security Events Log
// Track security-related events for monitoring
export const securityEvents = sqliteTable('security_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type', {
    enum: ['login_success', 'login_failure', 'logout', 'password_change', 'role_change',
           'permission_grant', 'permission_revoke', 'suspicious_activity', 'security_breach',
           'data_export', 'bulk_operation', 'system_access']
  }).notNull(),
  severity: text('severity', { enum: ['info', 'warning', 'error', 'critical'] }).notNull(),
  userId: text('user_id'),
  userEmail: text('user_email'),
  sessionId: text('session_id'),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),

  // Event details
  description: text('description').notNull(),
  details: text('details'), // JSON string with additional context

  // Response actions
  automatedAction: text('automated_action', { enum: ['none', 'alert', 'lock_account', 'terminate_session', 'block_ip'] }),
  actionTaken: integer('action_taken', { mode: 'boolean' }).notNull().default(false),
  actionTakenAt: integer('action_taken_at', { mode: 'timestamp' }),
  actionTakenBy: text('action_taken_by'),

  // Investigation tracking
  investigated: integer('investigated', { mode: 'boolean' }).notNull().default(false),
  investigatedBy: text('investigated_by'),
  investigatedAt: integer('investigated_at', { mode: 'timestamp' }),
  investigationNotes: text('investigation_notes'),
}, (table) => ({
  eventTypeIdx: index('security_events_event_type_idx').on(table.eventType),
  severityIdx: index('security_events_severity_idx').on(table.severity),
  userIdx: index('security_events_user_idx').on(table.userId),
  timestampIdx: index('security_events_timestamp_idx').on(table.timestamp),
  ipAddressIdx: index('security_events_ip_address_idx').on(table.ipAddress),
  investigatedIdx: index('security_events_investigated_idx').on(table.investigated),
  actionTakenIdx: index('security_events_action_taken_idx').on(table.actionTaken),
}));

// Security Enhancement: Data Access Log
// Track all data access for compliance
export const dataAccessLog = sqliteTable('data_access_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  sessionId: text('session_id'),
  ipAddress: text('ip_address').notNull(),

  // Access details
  tableName: text('table_name').notNull(),
  operation: text('operation', { enum: ['select', 'insert', 'update', 'delete'] }).notNull(),
  recordCount: integer('record_count').notNull().default(1),
  recordIds: text('record_ids'), // Comma-separated list of affected record IDs

  // Request context
  apiEndpoint: text('api_endpoint'),
  httpMethod: text('http_method'),
  requestId: text('request_id'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),

  // Performance metrics
  queryTime: real('query_time'), // Time taken to execute in milliseconds
  resultSize: integer('result_size'), // Size of result set in bytes

  // Compliance flags
  isSensitiveData: integer('is_sensitive_data', { mode: 'boolean' }).notNull().default(false),
  complianceCategory: text('compliance_category', { enum: ['financial', 'personal', 'operational', 'public'] }),
}, (table) => ({
  userIdx: index('data_access_log_user_idx').on(table.userId),
  tableNameIdx: index('data_access_log_table_name_idx').on(table.tableName),
  operationIdx: index('data_access_log_operation_idx').on(table.operation),
  timestampIdx: index('data_access_log_timestamp_idx').on(table.timestamp),
  sessionIdIdx: index('data_access_log_session_idx').on(table.sessionId),
  isSensitiveDataIdx: index('data_access_log_is_sensitive_data_idx').on(table.isSensitiveData),
  complianceCategoryIdx: index('data_access_log_compliance_category_idx').on(table.complianceCategory),
}));

// Export types for security schema
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

export type UserSessions = typeof userSessions.$inferSelect;
export type NewUserSessions = typeof userSessions.$inferInsert;

export type LoginAttempts = typeof loginAttempts.$inferSelect;
export type NewLoginAttempts = typeof loginAttempts.$inferInsert;

export type Permissions = typeof permissions.$inferSelect;
export type NewPermissions = typeof permissions.$inferInsert;

export type RolePermissions = typeof rolePermissions.$inferSelect;
export type NewRolePermissions = typeof rolePermissions.$inferInsert;

export type UserPermissions = typeof userPermissions.$inferSelect;
export type NewUserPermissions = typeof userPermissions.$inferInsert;

export type SecurityEvents = typeof securityEvents.$inferSelect;
export type NewSecurityEvents = typeof securityEvents.$inferInsert;

export type DataAccessLog = typeof dataAccessLog.$inferSelect;
export type NewDataAccessLog = typeof dataAccessLog.$inferInsert;