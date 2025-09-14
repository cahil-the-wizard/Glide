-- Clean and fix RLS policies
-- Run this in your Supabase SQL Editor

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view their own flows" ON flows;
DROP POLICY IF EXISTS "Users can insert their own flows" ON flows;
DROP POLICY IF EXISTS "Users can update their own flows" ON flows;
DROP POLICY IF EXISTS "Users can delete their own flows" ON flows;
DROP POLICY IF EXISTS "Allow all operations on flows" ON flows;

DROP POLICY IF EXISTS "Users can view steps of their own flows" ON steps;
DROP POLICY IF EXISTS "Users can insert steps for their own flows" ON steps;
DROP POLICY IF EXISTS "Users can update steps of their own flows" ON steps;
DROP POLICY IF EXISTS "Users can delete steps of their own flows" ON steps;
DROP POLICY IF EXISTS "Allow all operations on steps" ON steps;

-- Create function to automatically set user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id on insert
DROP TRIGGER IF EXISTS set_user_id_trigger ON flows;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON flows
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Create new RLS policies for flows
CREATE POLICY "flows_select_policy" ON flows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "flows_insert_policy" ON flows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "flows_update_policy" ON flows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "flows_delete_policy" ON flows
  FOR DELETE USING (auth.uid() = user_id);

-- Create new RLS policies for steps
CREATE POLICY "steps_select_policy" ON steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = steps.flow_id
      AND flows.user_id = auth.uid()
    )
  );

CREATE POLICY "steps_insert_policy" ON steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = steps.flow_id
      AND flows.user_id = auth.uid()
    )
  );

CREATE POLICY "steps_update_policy" ON steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = steps.flow_id
      AND flows.user_id = auth.uid()
    )
  );

CREATE POLICY "steps_delete_policy" ON steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = steps.flow_id
      AND flows.user_id = auth.uid()
    )
  );