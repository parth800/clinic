-- Migration: Add discount_amount column to invoices table
-- Run this in Supabase SQL Editor if you already have the database set up

-- Add the missing column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Update existing records to calculate discount_amount from discount percentage
UPDATE invoices 
SET discount_amount = (subtotal * discount / 100)
WHERE discount_amount = 0 AND discount > 0;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'invoices' AND column_name = 'discount_amount';
