-- Invite tokens table
-- Store the WhatsApp invite token here
CREATE TABLE invite_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active tokens (for validation)
-- But they can only check if a token exists, not list all tokens
CREATE POLICY "Allow token validation" ON invite_tokens
  FOR SELECT
  USING (active = true);

-- Insert your WhatsApp invite token here
-- Run this manually in Supabase SQL editor:
-- INSERT INTO invite_tokens (token) VALUES ('your-secret-token-here');
