-- TotallyWizardApp Database Setup
-- Run this in your Supabase SQL Editor after creating a project

-- Create users_profile table
CREATE TABLE users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flows table
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create steps table
CREATE TABLE steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  time_estimate TEXT NOT NULL,
  description TEXT NOT NULL,
  completion_cue TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

-- Policies for users_profile
CREATE POLICY "Users can view their own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);

-- Policies for flows
CREATE POLICY "Users can view their own flows" ON flows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flows" ON flows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flows" ON flows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flows" ON flows
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for steps
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

-- Add indexes for better performance
CREATE INDEX idx_steps_flow_id ON steps(flow_id);
CREATE INDEX idx_steps_step_number ON steps(step_number);
CREATE INDEX idx_flows_user_id ON flows(user_id);