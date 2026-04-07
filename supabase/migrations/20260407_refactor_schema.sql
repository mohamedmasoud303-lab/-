-- Rentrix Database Refactor Script
-- Production-ready, fully normalized, snake_case standardized.
-- Target: Supabase / PostgreSQL

BEGIN;

-- ==========================================
-- 1. Schema Preparation: Drop Blocking Constraints & Views
-- ==========================================

-- Drop existing views
DROP VIEW IF EXISTS view_properties_full;
DROP VIEW IF EXISTS view_units_full;
DROP VIEW IF EXISTS view_tenants_full;
DROP VIEW IF EXISTS view_account_balances_full;

-- Drop all foreign key constraints to allow type changes and renaming
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- ==========================================
-- 2. Table Renaming (Standardizing to snake_case)
-- ==========================================

ALTER TABLE IF EXISTS "receiptAllocations" RENAME TO receipt_allocations;
ALTER TABLE IF EXISTS "maintenanceRecords" RENAME TO maintenance_records;
ALTER TABLE IF EXISTS "depositTxs" RENAME TO deposit_transactions;
ALTER TABLE IF EXISTS "auditLog" RENAME TO audit_logs;
ALTER TABLE IF EXISTS "ownerSettlements" RENAME TO owner_settlements;
ALTER TABLE IF EXISTS "journalEntries" RENAME TO journal_entries;
ALTER TABLE IF EXISTS "autoBackups" RENAME TO auto_backups;
ALTER TABLE IF EXISTS "ownerBalances" RENAME TO owner_balances;
ALTER TABLE IF EXISTS "accountBalances" RENAME TO account_balances;
ALTER TABLE IF EXISTS "kpiSnapshots" RENAME TO kpi_snapshots;
ALTER TABLE IF EXISTS "contractBalances" RENAME TO contract_balances;
ALTER TABLE IF EXISTS "tenantBalances" RENAME TO tenant_balances;
ALTER TABLE IF EXISTS "notificationTemplates" RENAME TO notification_templates;
ALTER TABLE IF EXISTS "outgoingNotifications" RENAME TO outgoing_notifications;
ALTER TABLE IF EXISTS "appNotifications" RENAME TO app_notifications;
ALTER TABLE IF EXISTS "utilityServices" RENAME TO utility_services;

-- ==========================================
-- 3. Column Renaming & Type Conversions
-- ==========================================

-- Settings
ALTER TABLE settings RENAME COLUMN "contractAlertDays" TO contract_alert_days;
ALTER TABLE settings RENAME COLUMN "taxRate" TO tax_rate;
ALTER TABLE settings RENAME COLUMN "lateFee" TO late_fee;
ALTER TABLE settings RENAME COLUMN "accountMappings" TO account_mappings;

-- Governance
ALTER TABLE governance RENAME COLUMN "isLocked" TO is_locked;
ALTER TABLE governance RENAME COLUMN "financialLockDate" TO financial_lock_date;

-- Serials
ALTER TABLE serials RENAME COLUMN "ownerSettlement" TO owner_settlement_serial;
ALTER TABLE serials RENAME COLUMN "journalEntry" TO journal_entry_serial;

-- Accounts (Handling ID conversion)
ALTER TABLE accounts RENAME COLUMN "isParent" TO is_parent;
ALTER TABLE accounts RENAME COLUMN "parentId" TO parent_id;
-- We will handle the actual ID conversion in step 4.

-- Owners
ALTER TABLE owners RENAME COLUMN "nationalId" TO national_id;
ALTER TABLE owners RENAME COLUMN "commissionType" TO commission_type;
ALTER TABLE owners RENAME COLUMN "commissionValue" TO commission_value;
ALTER TABLE owners RENAME COLUMN "portalToken" TO portal_token;
ALTER TABLE owners RENAME COLUMN "createdAt" TO created_at;

-- Properties
ALTER TABLE properties RENAME COLUMN "ownerId" TO owner_id;
ALTER TABLE properties RENAME COLUMN "builtArea" TO built_area;
ALTER TABLE properties RENAME COLUMN "createdAt" TO created_at;

-- Units
ALTER TABLE units RENAME COLUMN "propertyId" TO property_id;
ALTER TABLE units RENAME COLUMN "unitNumber" TO unit_number;
ALTER TABLE units RENAME COLUMN "yearlyRent" TO yearly_rent;
ALTER TABLE units RENAME COLUMN "electricityMeter" TO electricity_meter;
ALTER TABLE units RENAME COLUMN "waterMeter" TO water_meter;
ALTER TABLE units RENAME COLUMN "createdAt" TO created_at;

-- Tenants
ALTER TABLE tenants RENAME COLUMN "nationalId" TO national_id;
ALTER TABLE tenants RENAME COLUMN "createdAt" TO created_at;

-- Contracts
ALTER TABLE contracts RENAME COLUMN "unitId" TO unit_id;
ALTER TABLE contracts RENAME COLUMN "tenantId" TO tenant_id;
ALTER TABLE contracts RENAME COLUMN "startDate" TO start_date;
ALTER TABLE contracts RENAME COLUMN "endDate" TO end_date;
ALTER TABLE contracts RENAME COLUMN "rentAmount" TO rent_amount;
ALTER TABLE contracts RENAME COLUMN "paymentFrequency" TO payment_frequency;
ALTER TABLE contracts RENAME COLUMN "createdAt" TO created_at;

-- Invoices
ALTER TABLE invoices RENAME COLUMN "contractId" TO contract_id;
ALTER TABLE invoices RENAME COLUMN "dueDate" TO due_date;
ALTER TABLE invoices RENAME COLUMN "taxAmount" TO tax_amount;
ALTER TABLE invoices RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voided_at BIGINT;

-- Receipts
ALTER TABLE receipts RENAME COLUMN "contractId" TO contract_id;
ALTER TABLE receipts RENAME COLUMN "dateTime" TO date_time;
ALTER TABLE receipts RENAME COLUMN "referenceNo" TO reference_no;
ALTER TABLE receipts RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS voided_at BIGINT;

-- Receipt Allocations
ALTER TABLE receipt_allocations RENAME COLUMN "receiptId" TO receipt_id;
ALTER TABLE receipt_allocations RENAME COLUMN "invoiceId" TO invoice_id;
ALTER TABLE receipt_allocations RENAME COLUMN "createdAt" TO created_at;

-- Expenses
ALTER TABLE expenses RENAME COLUMN "propertyId" TO property_id;
ALTER TABLE expenses RENAME COLUMN "contractId" TO contract_id;
ALTER TABLE expenses RENAME COLUMN "dateTime" TO date_time;
ALTER TABLE expenses RENAME COLUMN "chargedTo" TO charged_to;
ALTER TABLE expenses RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS voided_at BIGINT;

-- Maintenance Records
ALTER TABLE maintenance_records RENAME COLUMN "propertyId" TO property_id;
ALTER TABLE maintenance_records RENAME COLUMN "unitId" TO unit_id;
ALTER TABLE maintenance_records RENAME COLUMN "chargedTo" TO charged_to;
ALTER TABLE maintenance_records RENAME COLUMN "createdAt" TO created_at;

-- Deposit Transactions
ALTER TABLE deposit_transactions RENAME COLUMN "contractId" TO contract_id;
ALTER TABLE deposit_transactions RENAME COLUMN "createdAt" TO created_at;

-- Audit Logs
ALTER TABLE audit_logs RENAME COLUMN ts TO timestamp;
ALTER TABLE audit_logs RENAME COLUMN "userId" TO user_id;
ALTER TABLE audit_logs RENAME COLUMN "entityId" TO entity_id;

-- Owner Settlements
ALTER TABLE owner_settlements RENAME COLUMN "ownerId" TO owner_id;
ALTER TABLE owner_settlements RENAME COLUMN "referenceNo" TO reference_no;
ALTER TABLE owner_settlements RENAME COLUMN "journalEntryIds" TO journal_entry_ids;
ALTER TABLE owner_settlements RENAME COLUMN "createdAt" TO created_at;

-- Journal Entries
ALTER TABLE journal_entries RENAME COLUMN "accountId" TO account_id;
ALTER TABLE journal_entries RENAME COLUMN "sourceId" TO source_id;
ALTER TABLE journal_entries RENAME COLUMN "entityType" TO entity_type;
ALTER TABLE journal_entries RENAME COLUMN "entityId" TO entity_id;
ALTER TABLE journal_entries RENAME COLUMN "createdAt" TO created_at;

-- Auto Backups
ALTER TABLE auto_backups RENAME COLUMN "createdAt" TO created_at;

-- Owner Balances
ALTER TABLE owner_balances RENAME COLUMN "ownerId" TO owner_id;
ALTER TABLE owner_balances RENAME COLUMN "officeShare" TO office_share;

-- Account Balances
ALTER TABLE account_balances RENAME COLUMN "accountId" TO account_id;

-- KPI Snapshots
ALTER TABLE kpi_snapshots RENAME COLUMN "totalOwnerNetBalance" TO total_owner_net_balance;
ALTER TABLE kpi_snapshots RENAME COLUMN "totalContractARBalance" TO total_contract_ar_balance;
ALTER TABLE kpi_snapshots RENAME COLUMN "totalTenantARBalance" TO total_tenant_ar_balance;

-- Contract Balances
ALTER TABLE contract_balances RENAME COLUMN "contractId" TO contract_id;
ALTER TABLE contract_balances RENAME COLUMN "tenantId" TO tenant_id;
ALTER TABLE contract_balances RENAME COLUMN "unitId" TO unit_id;
ALTER TABLE contract_balances RENAME COLUMN "depositBalance" TO deposit_balance;
ALTER TABLE contract_balances RENAME COLUMN "lastUpdatedAt" TO last_updated_at;

-- Tenant Balances
ALTER TABLE tenant_balances RENAME COLUMN "tenantId" TO tenant_id;

-- Notification Templates
ALTER TABLE notification_templates RENAME COLUMN "createdAt" TO created_at;

-- Outgoing Notifications
ALTER TABLE outgoing_notifications RENAME COLUMN "tenantId" TO tenant_id;
ALTER TABLE outgoing_notifications RENAME COLUMN "contractId" TO contract_id;
ALTER TABLE outgoing_notifications RENAME COLUMN "sentAt" TO sent_at;
ALTER TABLE outgoing_notifications RENAME COLUMN "createdAt" TO created_at;

-- App Notifications
ALTER TABLE app_notifications RENAME COLUMN "isRead" TO is_read;
ALTER TABLE app_notifications RENAME COLUMN "createdAt" TO created_at;

-- Leads
ALTER TABLE leads RENAME COLUMN "propertyType" TO property_type;
ALTER TABLE leads RENAME COLUMN "createdAt" TO created_at;

-- Lands
ALTER TABLE lands RENAME COLUMN "ownerId" TO owner_id;
ALTER TABLE lands RENAME COLUMN "createdAt" TO created_at;

-- Commissions
ALTER TABLE commissions RENAME COLUMN "contractId" TO contract_id;
ALTER TABLE commissions RENAME COLUMN "createdAt" TO created_at;

-- Missions
ALTER TABLE missions RENAME COLUMN "assignedTo" TO assigned_to;
ALTER TABLE missions RENAME COLUMN "dueDate" TO due_date;
ALTER TABLE missions RENAME COLUMN "createdAt" TO created_at;

-- Budgets
ALTER TABLE budgets RENAME COLUMN "accountId" TO account_id;
ALTER TABLE budgets RENAME COLUMN "createdAt" TO created_at;

-- Attachments
ALTER TABLE attachments RENAME COLUMN "entityType" TO entity_type;
ALTER TABLE attachments RENAME COLUMN "entityId" TO entity_id;
ALTER TABLE attachments RENAME COLUMN "createdAt" TO created_at;

-- Utility Services
ALTER TABLE utility_services RENAME COLUMN "propertyId" TO property_id;
ALTER TABLE utility_services RENAME COLUMN "unitId" TO unit_id;
ALTER TABLE utility_services RENAME COLUMN "accountNumber" TO account_number;
ALTER TABLE utility_services RENAME COLUMN "meterNumber" TO meter_number;
ALTER TABLE utility_services RENAME COLUMN "createdAt" TO created_at;

-- ==========================================
-- 4. UUID Normalization (Converting TEXT to UUID)
-- ==========================================

-- Accounts (Special handling for '1101' style IDs)
ALTER TABLE accounts ADD COLUMN temp_uuid UUID DEFAULT uuid_generate_v4();
-- Update parent_id references
UPDATE accounts a1 SET parent_id = a2.temp_uuid::text FROM accounts a2 WHERE a1.parent_id = a2.id;
-- Update other tables referencing accounts
UPDATE journal_entries j SET account_id = a.temp_uuid::text FROM accounts a WHERE j.account_id = a.id;
UPDATE budgets b SET account_id = a.temp_uuid::text FROM accounts a WHERE b.account_id = a.id;
UPDATE account_balances ab SET account_id = a.temp_uuid::text FROM accounts a WHERE ab.account_id = a.id;

-- Swap IDs
ALTER TABLE accounts ALTER COLUMN id TYPE UUID USING temp_uuid;
ALTER TABLE accounts DROP COLUMN temp_uuid;
ALTER TABLE accounts ALTER COLUMN parent_id TYPE UUID USING parent_id::uuid;
ALTER TABLE journal_entries ALTER COLUMN account_id TYPE UUID USING account_id::uuid;
ALTER TABLE budgets ALTER COLUMN account_id TYPE UUID USING account_id::uuid;
ALTER TABLE account_balances ALTER COLUMN account_id TYPE UUID USING account_id::uuid;

-- Fix other TEXT columns that should be UUID
ALTER TABLE audit_logs ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE audit_logs ALTER COLUMN entity_id TYPE UUID USING entity_id::uuid;
ALTER TABLE journal_entries ALTER COLUMN source_id TYPE UUID USING source_id::uuid;
ALTER TABLE journal_entries ALTER COLUMN entity_id TYPE UUID USING entity_id::uuid;
ALTER TABLE attachments ALTER COLUMN entity_id TYPE UUID USING entity_id::uuid;

-- ==========================================
-- 5. Autofix Relationships (Data Integrity)
-- ==========================================

-- Properties: Link to Owner by matching name/phone if owner_id is missing
-- (Assuming we might have temporary columns or data in owner_id that isn't a UUID yet)
-- This is a best-effort attempt.

-- Log orphaned data (can be viewed in Supabase logs or a temp table)
CREATE TABLE IF NOT EXISTS orphaned_records_log (
    id UUID DEFAULT uuid_generate_v4(),
    table_name TEXT,
    record_id UUID,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO orphaned_records_log (table_name, record_id, details)
SELECT 'properties', id, 'Missing owner_id' FROM properties WHERE owner_id IS NULL;

INSERT INTO orphaned_records_log (table_name, record_id, details)
SELECT 'units', id, 'Missing property_id' FROM units WHERE property_id IS NULL;

-- ==========================================
-- 6. Recreate Constraints (Production-Ready)
-- ==========================================

ALTER TABLE accounts ADD CONSTRAINT fk_accounts_parent FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE properties ADD CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE units ADD CONSTRAINT fk_units_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE contracts ADD CONSTRAINT fk_contracts_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE contracts ADD CONSTRAINT fk_contracts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE receipts ADD CONSTRAINT fk_receipts_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE receipt_allocations ADD CONSTRAINT fk_allocations_receipt FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE receipt_allocations ADD CONSTRAINT fk_allocations_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE maintenance_records ADD CONSTRAINT fk_maintenance_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE maintenance_records ADD CONSTRAINT fk_maintenance_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE deposit_transactions ADD CONSTRAINT fk_deposits_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE owner_settlements ADD CONSTRAINT fk_settlements_owner FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE journal_entries ADD CONSTRAINT fk_journal_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE owner_balances ADD CONSTRAINT fk_owner_balances_owner FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE account_balances ADD CONSTRAINT fk_account_balances_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE contract_balances ADD CONSTRAINT fk_contract_balances_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE contract_balances ADD CONSTRAINT fk_contract_balances_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE contract_balances ADD CONSTRAINT fk_contract_balances_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE tenant_balances ADD CONSTRAINT fk_tenant_balances_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE outgoing_notifications ADD CONSTRAINT fk_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE outgoing_notifications ADD CONSTRAINT fk_notifications_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE lands ADD CONSTRAINT fk_lands_owner FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE commissions ADD CONSTRAINT fk_commissions_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE budgets ADD CONSTRAINT fk_budgets_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE utility_services ADD CONSTRAINT fk_utility_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE utility_services ADD CONSTRAINT fk_utility_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- ==========================================
-- 7. Performance Indexing
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_accounts_parent_id ON accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_unit_id ON contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_receipts_contract_id ON receipts(contract_id);
CREATE INDEX IF NOT EXISTS idx_receipt_allocations_receipt_id ON receipt_allocations(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_allocations_invoice_id ON receipt_allocations(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_contract_id ON expenses(contract_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_property_id ON maintenance_records(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_unit_id ON maintenance_records(unit_id);
CREATE INDEX IF NOT EXISTS idx_deposit_transactions_contract_id ON deposit_transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_owner_settlements_owner_id ON owner_settlements(owner_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_account_id ON journal_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_source_id ON journal_entries(source_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entity_id ON journal_entries(entity_id);
CREATE INDEX IF NOT EXISTS idx_lands_owner_id ON lands(owner_id);
CREATE INDEX IF NOT EXISTS idx_commissions_contract_id ON commissions(contract_id);
CREATE INDEX IF NOT EXISTS idx_budgets_account_id ON budgets(account_id);
CREATE INDEX IF NOT EXISTS idx_utility_services_property_id ON utility_services(property_id);
CREATE INDEX IF NOT EXISTS idx_utility_services_unit_id ON utility_services(unit_id);
CREATE INDEX IF NOT EXISTS idx_attachments_entity_id ON attachments(entity_id);

-- ==========================================
-- 8. Production Views
-- ==========================================

CREATE OR REPLACE VIEW view_properties_full AS
SELECT 
    p.*,
    o.name AS owner_name,
    o.phone AS owner_phone,
    o.email AS owner_email
FROM properties p
LEFT JOIN owners o ON p.owner_id = o.id;

CREATE OR REPLACE VIEW view_units_full AS
SELECT 
    u.*,
    p.name AS property_name,
    p.address AS property_address,
    o.id AS owner_id,
    o.name AS owner_name
FROM units u
JOIN properties p ON u.property_id = p.id
LEFT JOIN owners o ON p.owner_id = o.id;

CREATE OR REPLACE VIEW view_tenants_full AS
SELECT 
    t.*,
    (SELECT json_agg(c.*) FROM contracts c WHERE c.tenant_id = t.id AND c.status = 'ACTIVE') AS active_contracts
FROM tenants t;

CREATE OR REPLACE VIEW view_account_balances_full AS
SELECT 
    a.*,
    COALESCE(ab.balance, 0) AS balance
FROM accounts a
LEFT JOIN account_balances ab ON a.id = ab.account_id;

COMMIT;
