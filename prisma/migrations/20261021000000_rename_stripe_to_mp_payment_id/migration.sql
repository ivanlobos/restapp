-- Rename stripePaymentId to mpPaymentId in Order table
-- This column was renamed in PROD via ALTER TABLE on 2026-10-21
-- The SQL was already executed directly in Supabase before this migration was created
ALTER TABLE "Order" RENAME COLUMN "stripePaymentId" TO "mpPaymentId";
