-- Fix RLS policies to allow unauthenticated access for testing
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own flows" ON flows;
DROP POLICY IF EXISTS "Users can insert their own flows" ON flows;
DROP POLICY IF EXISTS "Users can update their own flows" ON flows;
DROP POLICY IF EXISTS "Users can delete their own flows" ON flows;

DROP POLICY IF EXISTS "Users can view steps of their own flows" ON steps;
DROP POLICY IF EXISTS "Users can insert steps for their own flows" ON steps;
DROP POLICY IF EXISTS "Users can update steps of their own flows" ON steps;
DROP POLICY IF EXISTS "Users can delete steps of their own flows" ON steps;

-- Create permissive policies that work with or without authentication
CREATE POLICY "Allow all operations on flows" ON flows
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on steps" ON steps
  FOR ALL USING (true) WITH CHECK (true);

-- Make user_id nullable for flows table
ALTER TABLE flows ALTER COLUMN user_id DROP NOT NULL;