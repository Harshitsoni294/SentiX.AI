-- Create sentiment_reports table
CREATE TABLE IF NOT EXISTS sentiment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pdf_data TEXT, -- Base64 encoded PDF data
  sentiment_data JSONB,
  topic TEXT,
  posts_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) policies
ALTER TABLE sentiment_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own reports
CREATE POLICY "Users can view own reports" ON sentiment_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own reports
CREATE POLICY "Users can insert own reports" ON sentiment_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reports
CREATE POLICY "Users can update own reports" ON sentiment_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own reports
CREATE POLICY "Users can delete own reports" ON sentiment_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sentiment_reports_updated_at
  BEFORE UPDATE ON sentiment_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
