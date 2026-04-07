-- Supabase Schema for Rentrix ERP (Refactored & Normalized)
-- Standardized to snake_case, UUID-based foreign keys, production-ready constraints.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    must_change BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY,
    theme TEXT,
    currency TEXT,
    contract_alert_days INTEGER DEFAULT 30,
    tax_rate NUMERIC DEFAULT 0,
    company JSONB,
    appearance JSONB,
    maintenance JSONB,
    late_fee JSONB,
    account_mappings JSONB
);

-- Governance Table
CREATE TABLE IF NOT EXISTS public.governance (
    id INTEGER PRIMARY KEY,
    is_locked BOOLEAN DEFAULT false,
    financial_lock_date TEXT
);

-- Serials Table
CREATE TABLE IF NOT EXISTS public.serials (
    id INTEGER PRIMARY KEY,
    receipt INTEGER DEFAULT 1000,
    expense INTEGER DEFAULT 1000,
    invoice INTEGER DEFAULT 1000,
    owner_settlement_serial INTEGER DEFAULT 1000,
    maintenance INTEGER DEFAULT 1000,
    journal_entry_serial INTEGER DEFAULT 1000,
    lead INTEGER DEFAULT 1000,
    mission INTEGER DEFAULT 1000
);

-- Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    is_parent BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED
);

-- Owners Table
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    national_id TEXT,
    commission_type TEXT,
    commission_value NUMERIC,
    portal_token TEXT,
    created_at BIGINT
);

-- Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    name TEXT NOT NULL,
    type TEXT,
    address TEXT,
    built_area NUMERIC,
    created_at BIGINT
);

-- Units Table
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    unit_number TEXT NOT NULL,
    type TEXT,
    status TEXT,
    yearly_rent NUMERIC,
    electricity_meter TEXT,
    water_meter TEXT,
    created_at BIGINT
);

-- Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    national_id TEXT,
    nationality TEXT,
    created_at BIGINT
);

-- Contracts Table
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    rent_amount NUMERIC NOT NULL,
    payment_frequency TEXT,
    status TEXT,
    created_at BIGINT
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    due_date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    tax_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    status TEXT,
    voided_at BIGINT,
    created_at BIGINT
);

-- Receipts Table
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    date_time TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    channel TEXT,
    reference_no TEXT,
    status TEXT,
    voided_at BIGINT,
    created_at BIGINT
);

-- Receipt Allocations Table
CREATE TABLE IF NOT EXISTS public.receipt_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    amount NUMERIC NOT NULL,
    created_at BIGINT
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    date_time TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT,
    charged_to TEXT,
    description TEXT,
    status TEXT,
    voided_at BIGINT,
    created_at BIGINT
);

-- Maintenance Records Table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    date TEXT NOT NULL,
    description TEXT,
    cost NUMERIC,
    status TEXT,
    charged_to TEXT,
    created_at BIGINT
);

-- Deposit Transactions Table
CREATE TABLE IF NOT EXISTS public.deposit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT,
    status TEXT,
    created_at BIGINT
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp BIGINT NOT NULL,
    user_id UUID,
    username TEXT,
    action TEXT,
    entity TEXT,
    entity_id UUID,
    note TEXT
);

-- Owner Settlements Table
CREATE TABLE IF NOT EXISTS public.owner_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    method TEXT,
    reference_no TEXT,
    journal_entry_ids JSONB,
    created_at BIGINT
);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    date TEXT NOT NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    source_id UUID,
    entity_type TEXT,
    entity_id UUID,
    created_at BIGINT
);

-- Snapshots Table
CREATE TABLE IF NOT EXISTS public.snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note TEXT,
    ts BIGINT NOT NULL,
    data JSONB
);

-- Auto Backups Table
CREATE TABLE IF NOT EXISTS public.auto_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TEXT NOT NULL,
    url TEXT NOT NULL,
    size NUMERIC,
    created_at BIGINT
);

-- Owner Balances Table
CREATE TABLE IF NOT EXISTS public.owner_balances (
    owner_id UUID PRIMARY KEY REFERENCES public.owners(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    collections NUMERIC DEFAULT 0,
    expenses NUMERIC DEFAULT 0,
    settlements NUMERIC DEFAULT 0,
    office_share NUMERIC DEFAULT 0,
    net NUMERIC DEFAULT 0
);

-- Account Balances Table
CREATE TABLE IF NOT EXISTS public.account_balances (
    account_id UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    balance NUMERIC DEFAULT 0
);

-- KPI Snapshots Table
CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
    id TEXT PRIMARY KEY,
    total_owner_net_balance NUMERIC DEFAULT 0,
    total_contract_ar_balance NUMERIC DEFAULT 0,
    total_tenant_ar_balance NUMERIC DEFAULT 0
);

-- Contract Balances Table
CREATE TABLE IF NOT EXISTS public.contract_balances (
    contract_id UUID PRIMARY KEY REFERENCES public.contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    balance NUMERIC DEFAULT 0,
    deposit_balance NUMERIC DEFAULT 0,
    last_updated_at BIGINT
);

-- Tenant Balances Table
CREATE TABLE IF NOT EXISTS public.tenant_balances (
    tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    balance NUMERIC DEFAULT 0
);

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT,
    content TEXT NOT NULL,
    created_at BIGINT
);

-- Outgoing Notifications Table
CREATE TABLE IF NOT EXISTS public.outgoing_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    type TEXT,
    content TEXT,
    status TEXT,
    sent_at BIGINT,
    created_at BIGINT
);

-- App Notifications Table
CREATE TABLE IF NOT EXISTS public.app_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at BIGINT
);

-- Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    property_type TEXT,
    budget NUMERIC,
    status TEXT,
    notes TEXT,
    created_at BIGINT
);

-- Lands Table
CREATE TABLE IF NOT EXISTS public.lands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    name TEXT NOT NULL,
    location TEXT,
    area NUMERIC,
    status TEXT,
    created_at BIGINT
);

-- Commissions Table
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    amount NUMERIC NOT NULL,
    status TEXT,
    created_at BIGINT
);

-- Missions Table
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    status TEXT,
    due_date TEXT,
    created_at BIGINT
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year TEXT NOT NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    amount NUMERIC NOT NULL,
    created_at BIGINT
);

-- Attachments Table
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    size NUMERIC,
    created_at BIGINT
);

-- Utility Services Table
CREATE TABLE IF NOT EXISTS public.utility_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
    type TEXT NOT NULL,
    account_number TEXT,
    meter_number TEXT,
    status TEXT,
    created_at BIGINT
);

-- ==========================================
-- Views
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

-- ==========================================
-- Performance Indexes
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

-- Disable RLS for all tables (ERP context)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.serials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_settlements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_backups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.outgoing_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_services DISABLE ROW LEVEL SECURITY;
