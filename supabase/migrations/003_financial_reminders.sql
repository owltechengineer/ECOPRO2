-- ═══════════════════════════════════════════════════════════
-- ECOPRO — Financial Record Reminders
-- Promemoria giornalieri per registrazioni finanziarie
-- ═══════════════════════════════════════════════════════════

ALTER TABLE financial_records
  ADD COLUMN IF NOT EXISTS is_reminder BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_type TEXT,
  ADD COLUMN IF NOT EXISTS reminder_due_date DATE;

-- reminder_type: person_to_pay | thing_to_buy | payment_due | other
CREATE INDEX IF NOT EXISTS idx_financial_records_is_reminder
  ON financial_records(is_reminder) WHERE is_reminder = true;
