-- ==========================================
-- 1. Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "owners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "units" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "receiptAllocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "maintenanceRecords" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "depositTxs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ownerSettlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "serials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journalEntries" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. Create Role Checking Function
-- ==========================================
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ==========================================
-- 3. Create RLS Policies
-- ==========================================
-- For this setup, we allow authenticated users to read and write,
-- but in a strict production environment, you should limit writes based on roles.
-- Example: Only ADMIN and MANAGER can delete contracts.

-- Generic Policies for Authenticated Users (Read/Write)
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'settings', 'users', 'owners', 'properties', 'units', 'tenants', 
        'contracts', 'invoices', 'receipts', 'receiptAllocations', 'expenses', 
        'maintenanceRecords', 'depositTxs', 'auditLog', 'governance', 
        'ownerSettlements', 'serials', 'snapshots', 'accounts', 'journalEntries'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('CREATE POLICY "Allow authenticated read" ON "%I" FOR SELECT USING (auth.role() = ''authenticated'');', t);
        EXECUTE format('CREATE POLICY "Allow authenticated insert" ON "%I" FOR INSERT WITH CHECK (auth.role() = ''authenticated'');', t);
        EXECUTE format('CREATE POLICY "Allow authenticated update" ON "%I" FOR UPDATE USING (auth.role() = ''authenticated'');', t);
        EXECUTE format('CREATE POLICY "Allow authenticated delete" ON "%I" FOR DELETE USING (auth.role() = ''authenticated'');', t);
    END LOOP;
END $$;

-- ==========================================
-- 4. Financial RPCs (Transactions)
-- ==========================================

-- RPC: Void Receipt
CREATE OR REPLACE FUNCTION void_receipt(p_receipt_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_receipt RECORD;
    v_allocation RECORD;
    v_governance RECORD;
BEGIN
    -- Get receipt
    SELECT * INTO v_receipt FROM "receipts" WHERE id = p_receipt_id;
    IF NOT FOUND OR v_receipt.status = 'VOID' THEN
        RETURN;
    END IF;

    -- Check governance lock date
    SELECT * INTO v_governance FROM "governance" WHERE id = 1;
    IF v_governance."financialLockDate" IS NOT NULL AND v_governance."financialLockDate"::date >= CURRENT_DATE THEN
        RAISE EXCEPTION 'لا يمكن الإلغاء لأن الفترة المالية الحالية مقفلة.';
    END IF;

    -- Reverse Journal Entries
    INSERT INTO "journalEntries" (id, no, date, ref, "sourceId", "sourceType", "accountId", type, amount, description, "createdAt")
    SELECT gen_random_uuid(), no, CURRENT_DATE::text, ref || '-VOID', "sourceId", "sourceType", "accountId", 
           CASE WHEN type = 'DEBIT' THEN 'CREDIT' ELSE 'DEBIT' END, amount, description || ' (عكس قيد)', extract(epoch from now()) * 1000
    FROM "journalEntries" WHERE "sourceId" = p_receipt_id::text;

    -- Update receipt status
    UPDATE "receipts" SET status = 'VOID', "voidedAt" = extract(epoch from now()) * 1000 WHERE id = p_receipt_id;

    -- Audit log
    INSERT INTO "auditLog" (id, "userId", action, "tableName", "recordId", details, timestamp)
    VALUES (gen_random_uuid(), p_user_id::text, 'VOID', 'receipts', p_receipt_id::text, 'إلغاء سند القبض رقم ' || v_receipt.no, extract(epoch from now()) * 1000);

    -- Revert allocations
    FOR v_allocation IN SELECT * FROM "receiptAllocations" WHERE "receiptId" = p_receipt_id::text LOOP
        UPDATE "invoices" 
        SET "paidAmount" = GREATEST(0, "paidAmount" - v_allocation.amount),
            status = CASE 
                        WHEN GREATEST(0, "paidAmount" - v_allocation.amount) <= 0.001 THEN 
                            CASE WHEN "dueDate"::date < CURRENT_DATE THEN 'OVERDUE' ELSE 'UNPAID' END
                        ELSE 'PARTIALLY_PAID' 
                     END
        WHERE id = v_allocation."invoiceId"::uuid;
    END LOOP;

    DELETE FROM "receiptAllocations" WHERE "receiptId" = p_receipt_id::text;
END;
$$;

-- RPC: Void Invoice
CREATE OR REPLACE FUNCTION void_invoice(p_invoice_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice RECORD;
    v_governance RECORD;
BEGIN
    SELECT * INTO v_invoice FROM "invoices" WHERE id = p_invoice_id;
    IF NOT FOUND OR v_invoice.status = 'VOID' THEN
        RETURN;
    END IF;

    IF v_invoice."paidAmount" > 0 THEN
        RAISE EXCEPTION 'لا يمكن إلغاء فاتورة تم تحصيل جزء منها. قم بإلغاء سندات القبض المرتبطة أولاً.';
    END IF;

    SELECT * INTO v_governance FROM "governance" WHERE id = 1;
    IF v_governance."financialLockDate" IS NOT NULL AND v_governance."financialLockDate"::date >= CURRENT_DATE THEN
        RAISE EXCEPTION 'لا يمكن الإلغاء لأن الفترة المالية الحالية مقفلة.';
    END IF;

    -- Reverse Journal Entries
    INSERT INTO "journalEntries" (id, no, date, ref, "sourceId", "sourceType", "accountId", type, amount, description, "createdAt")
    SELECT gen_random_uuid(), no, CURRENT_DATE::text, ref || '-VOID', "sourceId", "sourceType", "accountId", 
           CASE WHEN type = 'DEBIT' THEN 'CREDIT' ELSE 'DEBIT' END, amount, description || ' (عكس قيد)', extract(epoch from now()) * 1000
    FROM "journalEntries" WHERE "sourceId" = p_invoice_id::text;

    -- Update invoice status
    UPDATE "invoices" SET status = 'VOID', "voidedAt" = extract(epoch from now()) * 1000 WHERE id = p_invoice_id;

    -- Audit log
    INSERT INTO "auditLog" (id, "userId", action, "tableName", "recordId", details, timestamp)
    VALUES (gen_random_uuid(), p_user_id::text, 'VOID', 'invoices', p_invoice_id::text, 'إلغاء الفاتورة رقم ' || v_invoice.no, extract(epoch from now()) * 1000);
END;
$$;

-- RPC: Void Expense
CREATE OR REPLACE FUNCTION void_expense(p_expense_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expense RECORD;
    v_governance RECORD;
BEGIN
    SELECT * INTO v_expense FROM "expenses" WHERE id = p_expense_id;
    IF NOT FOUND OR v_expense.status = 'VOID' THEN
        RETURN;
    END IF;

    SELECT * INTO v_governance FROM "governance" WHERE id = 1;
    IF v_governance."financialLockDate" IS NOT NULL AND v_governance."financialLockDate"::date >= CURRENT_DATE THEN
        RAISE EXCEPTION 'لا يمكن الإلغاء لأن الفترة المالية الحالية مقفلة.';
    END IF;

    -- Reverse Journal Entries
    INSERT INTO "journalEntries" (id, no, date, ref, "sourceId", "sourceType", "accountId", type, amount, description, "createdAt")
    SELECT gen_random_uuid(), no, CURRENT_DATE::text, ref || '-VOID', "sourceId", "sourceType", "accountId", 
           CASE WHEN type = 'DEBIT' THEN 'CREDIT' ELSE 'DEBIT' END, amount, description || ' (عكس قيد)', extract(epoch from now()) * 1000
    FROM "journalEntries" WHERE "sourceId" = p_expense_id::text;

    -- Update expense status
    UPDATE "expenses" SET status = 'VOID', "voidedAt" = extract(epoch from now()) * 1000 WHERE id = p_expense_id;

    -- Audit log
    INSERT INTO "auditLog" (id, "userId", action, "tableName", "recordId", details, timestamp)
    VALUES (gen_random_uuid(), p_user_id::text, 'VOID', 'expenses', p_expense_id::text, 'إلغاء المصروف رقم ' || v_expense.no, extract(epoch from now()) * 1000);
END;
$$;
