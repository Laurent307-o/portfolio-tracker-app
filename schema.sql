-- ============================================
-- PORTFOLIO TRACKER - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  plan_expires_at TIMESTAMPTZ,
  trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PORTFOLIOS (PEA, CTO, AV, PER...)
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  broker TEXT, -- Fortuneo, Boursorama, Degiro...
  account_type TEXT, -- PEA, CTO, AV, PER
  cash DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. POSITIONS
CREATE TABLE positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  isin TEXT NOT NULL,
  ticker TEXT,
  name TEXT NOT NULL,
  short_name TEXT,
  quantity DECIMAL(12,6) NOT NULL,
  pru DECIMAL(12,6) NOT NULL, -- Prix de Revient Unitaire
  current_price DECIMAL(12,6),
  is_etf BOOLEAN DEFAULT true,
  is_fr BOOLEAN DEFAULT false,
  first_buy_date DATE,
  stop_loss DECIMAL(12,6), -- Stop loss price
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OPERATIONS (buy/sell history)
CREATE TABLE operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  isin TEXT,
  position_name TEXT,
  quantity DECIMAL(12,6) NOT NULL,
  price DECIMAL(12,6) NOT NULL,
  pru_at_sell DECIMAL(12,6), -- PRU at time of sale (for PV calc)
  realized_pv DECIMAL(12,2),
  fees DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ALERTS
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('price_above', 'price_below', 'daily_loss_pct', 'stop_loss')),
  ticker TEXT,
  position_name TEXT,
  threshold DECIMAL(12,6) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ANNUAL PERFORMANCE (cached yearly data)
CREATE TABLE annual_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  year TEXT NOT NULL, -- "2024", "2025", "2026 YTD"
  start_value DECIMAL(12,2) DEFAULT 0,
  deposits DECIMAL(12,2) DEFAULT 0,
  end_value DECIMAL(12,2) DEFAULT 0,
  dividends DECIMAL(12,2) DEFAULT 0,
  realized_pv DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_id, year)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Each user can only see their own data
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_performance ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Portfolios: users can only CRUD their own portfolios
CREATE POLICY "Users can view own portfolios" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own portfolios" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolios" ON portfolios FOR DELETE USING (auth.uid() = user_id);

-- Positions: users can only CRUD their own positions
CREATE POLICY "Users can view own positions" ON positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own positions" ON positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own positions" ON positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own positions" ON positions FOR DELETE USING (auth.uid() = user_id);

-- Operations: users can only CRUD their own operations
CREATE POLICY "Users can view own operations" ON operations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own operations" ON operations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own operations" ON operations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own operations" ON operations FOR DELETE USING (auth.uid() = user_id);

-- Alerts: users can only CRUD their own alerts
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own alerts" ON alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON alerts FOR DELETE USING (auth.uid() = user_id);

-- Annual performance: users can only CRUD their own data
CREATE POLICY "Users can view own perf" ON annual_performance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own perf" ON annual_performance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own perf" ON annual_performance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own perf" ON annual_performance FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, trial_started_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_portfolios_user ON portfolios(user_id);
CREATE INDEX idx_positions_portfolio ON positions(portfolio_id);
CREATE INDEX idx_positions_user ON positions(user_id);
CREATE INDEX idx_operations_portfolio ON operations(portfolio_id);
CREATE INDEX idx_operations_user ON operations(user_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_annual_perf_portfolio ON annual_performance(portfolio_id);
