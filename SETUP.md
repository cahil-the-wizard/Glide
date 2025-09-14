# Setup Guide for TotallyWizardApp

## Step 1: Get Gemini AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Replace `your_gemini_api_key_here` in `.env` file with your actual key

## Step 2: Set up Supabase

### Create Supabase Project
1. Go to [Supabase](https://supabase.com/dashboard)
2. Sign up/Sign in
3. Click "New Project"
4. Choose organization and fill in:
   - Name: `TotallyWizardApp`
   - Database Password: (create a secure password)
   - Region: (choose closest to you)
5. Click "Create new project"
6. Wait for project to be ready (2-3 minutes)

### Get Supabase Credentials
1. Go to Project Settings → API
2. Copy the "Project URL"
3. Copy the "anon public" key
4. Replace the values in `.env` file:
   - `EXPO_PUBLIC_SUPABASE_URL=your_project_url`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`

### Set up Database Tables
1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the SQL below, then click "Run"

```sql
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
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

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
```

## Step 3: Test Your Setup

1. Make sure your `.env` file has all three keys filled in
2. Restart your development server: `npm run web`
3. Try creating a new flow to test the integration

## Troubleshooting

- If you get authentication errors, double-check your Supabase keys
- If Gemini API fails, verify your API key is correct and has quota
- Make sure you ran the SQL script in Supabase to create the tables

## Security Note

The `.env` file is already in `.gitignore` so your keys won't be committed to git.