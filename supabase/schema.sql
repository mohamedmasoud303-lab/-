-- Supabase Schema for Rentrix ERP

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
    "contractAlertDays" INTEGER,
    "taxRate" NUMERIC,
    company JSONB,
    appearance JSONB,
    maintenance JSONB,
    "lateFee" JSONB,
    "accountMappings" JSONB
);

-- Governance Table
CREATE TABLE IF NOT EXISTS public.governance (
    id INTEGER PRIMARY KEY,
    "isLocked" BOOLEAN DEFAULT false,
    "financialLockDate" TEXT
);

-- Serials Table
CREATE TABLE IF NOT EXISTS public.serials (
    id INTEGER PRIMARY KEY,
    receipt INTEGER DEFAULT 1000,
    expense INTEGER DEFAULT 1000,
    invoice INTEGER DEFAULT 1000,
    "ownerSettlement" INTEGER DEFAULT 1000,
    maintenance INTEGER DEFAULT 1000,
    "journalEntry" INTEGER DEFAULT 1000,
    lead INTEGER DEFAULT 1000,
    mission INTEGER DEFAULT 1000
);

-- Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
    id TEXT PRIMARY KEY,
    no TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    "isParent" BOOLEAN DEFAULT false,
    "parentId" TEXT
);

-- Owners Table
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    "nationalId" TEXT,
    "commissionType" TEXT,
    "commissionValue" NUMERIC,
    "portalToken" TEXT,
    "createdAt" BIGINT
);

-- Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "ownerId" UUID REFERENCES public.owners(id),
    name TEXT NOT NULL,
    type TEXT,
    address TEXT,
    "builtArea" NUMERIC,
    "createdAt" BIGINT
);

-- Units Table
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "propertyId" UUID REFERENCES public.properties(id),
    "unitNumber" TEXT NOT NULL,
    type TEXT,
    status TEXT,
    "yearlyRent" NUMERIC,
    "electricityMeter" TEXT,
    "waterMeter" TEXT,
    "createdAt" BIGINT
);

-- Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    "nationalId" TEXT,
    nationality TEXT,
    "createdAt" BIGINT
);

-- Contracts Table
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "unitId" UUID REFERENCES public.units(id),
    "tenantId" UUID REFERENCES public.tenants(id),
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "rentAmount" NUMERIC NOT NULL,
    "paymentFrequency" TEXT,
    status TEXT,
    "createdAt" BIGINT
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    "contractId" UUID REFERENCES public.contracts(id),
    "dueDate" TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    "taxAmount" NUMERIC,
    status TEXT,
    "createdAt" BIGINT
);

-- Receipts Table
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    "contractId" UUID REFERENCES public.contracts(id),
    "dateTime" TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    channel TEXT,
    "referenceNo" TEXT,
    status TEXT,
    "createdAt" BIGINT
);

-- Receipt Allocations Table
CREATE TABLE IF NOT EXISTS public."receiptAllocations" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "receiptId" UUID REFERENCES public.receipts(id),
    "invoiceId" UUID REFERENCES public.invoices(id),
    amount NUMERIC NOT NULL,
    "createdAt" BIGINT
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    "propertyId" UUID,
    "contractId" UUID,
    "dateTime" TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT,
    "chargedTo" TEXT,
    description TEXT,
    status TEXT,
    "createdAt" BIGINT
);

-- Maintenance Records Table
CREATE TABLE IF NOT EXISTS public."maintenanceRecords" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    "propertyId" UUID,
    "unitId" UUID,
    date TEXT NOT NULL,
    description TEXT,
    cost NUMERIC,
    status TEXT,
    "chargedTo" TEXT,
    "createdAt" BIGINT
);

-- Deposit Transactions Table
CREATE TABLE IF NOT EXISTS public."depositTxs" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "contractId" UUID REFERENCES public.contracts(id),
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT,
    status TEXT,
    "createdAt" BIGINT
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS public."auditLog" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ts BIGINT NOT NULL,
    "userId" TEXT,
    username TEXT,
    action TEXT,
    entity TEXT,
    "entityId" TEXT,
    note TEXT
);

-- Owner Settlements Table
CREATE TABLE IF NOT EXISTS public."ownerSettlements" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    "ownerId" UUID REFERENCES public.owners(id),
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    method TEXT,
    "referenceNo" TEXT,
    "journalEntryIds" JSONB,
    "createdAt" BIGINT
);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS public."journalEntries" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    date TEXT NOT NULL,
    "accountId" TEXT REFERENCES public.accounts(id),
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    "sourceId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" BIGINT
);

-- Snapshots Table
CREATE TABLE IF NOT EXISTS public.snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note TEXT,
    ts BIGINT NOT NULL,
    data JSONB
);

-- Auto Backups Table
CREATE TABLE IF NOT EXISTS public."autoBackups" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TEXT NOT NULL,
    url TEXT NOT NULL,
    size NUMERIC,
    "createdAt" BIGINT
);

-- Owner Balances Table
CREATE TABLE IF NOT EXISTS public."ownerBalances" (
    "ownerId" UUID PRIMARY KEY REFERENCES public.owners(id),
    collections NUMERIC DEFAULT 0,
    expenses NUMERIC DEFAULT 0,
    settlements NUMERIC DEFAULT 0,
    "officeShare" NUMERIC DEFAULT 0,
    net NUMERIC DEFAULT 0
);

-- Account Balances Table
CREATE TABLE IF NOT EXISTS public."accountBalances" (
    "accountId" TEXT PRIMARY KEY REFERENCES public.accounts(id),
    balance NUMERIC DEFAULT 0
);

-- KPI Snapshots Table
CREATE TABLE IF NOT EXISTS public."kpiSnapshots" (
    id TEXT PRIMARY KEY,
    "totalOwnerNetBalance" NUMERIC DEFAULT 0,
    "totalContractARBalance" NUMERIC DEFAULT 0,
    "totalTenantARBalance" NUMERIC DEFAULT 0
);

-- Contract Balances Table
CREATE TABLE IF NOT EXISTS public."contractBalances" (
    "contractId" UUID PRIMARY KEY REFERENCES public.contracts(id),
    "tenantId" UUID REFERENCES public.tenants(id),
    "unitId" UUID REFERENCES public.units(id),
    balance NUMERIC DEFAULT 0,
    "depositBalance" NUMERIC DEFAULT 0,
    "lastUpdatedAt" BIGINT
);

-- Tenant Balances Table
CREATE TABLE IF NOT EXISTS public."tenantBalances" (
    "tenantId" UUID PRIMARY KEY REFERENCES public.tenants(id),
    balance NUMERIC DEFAULT 0
);

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS public."notificationTemplates" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT,
    content TEXT NOT NULL,
    "createdAt" BIGINT
);

-- Outgoing Notifications Table
CREATE TABLE IF NOT EXISTS public."outgoingNotifications" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID REFERENCES public.tenants(id),
    "contractId" UUID REFERENCES public.contracts(id),
    type TEXT,
    content TEXT,
    status TEXT,
    "sentAt" BIGINT,
    "createdAt" BIGINT
);

-- App Notifications Table
CREATE TABLE IF NOT EXISTS public."appNotifications" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" BIGINT
);

-- Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    "propertyType" TEXT,
    budget NUMERIC,
    status TEXT,
    notes TEXT,
    "createdAt" BIGINT
);

-- Lands Table
CREATE TABLE IF NOT EXISTS public.lands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "ownerId" UUID REFERENCES public.owners(id),
    name TEXT NOT NULL,
    location TEXT,
    area NUMERIC,
    status TEXT,
    "createdAt" BIGINT
);

-- Commissions Table
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "contractId" UUID REFERENCES public.contracts(id),
    amount NUMERIC NOT NULL,
    status TEXT,
    "createdAt" BIGINT
);

-- Missions Table
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    "assignedTo" TEXT,
    status TEXT,
    "dueDate" TEXT,
    "createdAt" BIGINT
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year TEXT NOT NULL,
    "accountId" TEXT REFERENCES public.accounts(id),
    amount NUMERIC NOT NULL,
    "createdAt" BIGINT
);

-- Attachments Table
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    size NUMERIC,
    "createdAt" BIGINT
);

-- Utility Services Table
CREATE TABLE IF NOT EXISTS public."utilityServices" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "propertyId" UUID REFERENCES public.properties(id),
    "unitId" UUID REFERENCES public.units(id),
    type TEXT NOT NULL,
    "accountNumber" TEXT,
    "meterNumber" TEXT,
    status TEXT,
    "createdAt" BIGINT
);

-- Disable RLS for all tables to allow client-side access (for this specific ERP setup)
-- In a production environment with strict security, you would enable RLS and create specific policies.
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
ALTER TABLE public."receiptAllocations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."maintenanceRecords" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."depositTxs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."auditLog" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."ownerSettlements" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."journalEntries" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."autoBackups" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."ownerBalances" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."accountBalances" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."kpiSnapshots" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."contractBalances" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."tenantBalances" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."notificationTemplates" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."outgoingNotifications" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."appNotifications" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."utilityServices" DISABLE ROW LEVEL SECURITY;
