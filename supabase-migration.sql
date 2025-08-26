-- Migration script to add new columns to existing sentiment_reports table
-- Run this in your Supabase SQL Editor

-- Add new columns if they don't exist
ALTER TABLE sentiment_reports 
ADD COLUMN IF NOT EXISTS pdf_data TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS posts_analyzed INTEGER DEFAULT 0;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sentiment_reports' 
ORDER BY ordinal_position;
