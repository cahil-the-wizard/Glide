-- Update RLS policies to work with authentication
-- Run this in your Supabase SQL Editor

-- First, update the flows table to automatically set user_id
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

-- Also update the policies to be more explicit
DROP POLICY IF EXISTS "Allow all operations on flows" ON flows;
DROP POLICY IF EXISTS "Allow all operations on steps" ON steps;

-- Proper RLS policies for authenticated users
CREATE POLICY "Users can view their own flows" ON flows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flows" ON flows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flows" ON flows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flows" ON flows
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view steps of their own flows" ON steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = steps.flow_id
      AND flows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert steps for their own flows" ON steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = steps.flow_id
      AND flows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update steps of their own flows" ON steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = steps.flow_id
      AND flows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete steps of their own flows" ON steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = steps.flow_id
      AND flows.user_id = auth.uid()
    )
  );