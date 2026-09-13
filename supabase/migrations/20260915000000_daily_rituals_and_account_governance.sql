-- ============================================================================
-- PACT OS — Phase 12: Daily Sunset Rituals & Account Governance
-- Migration: 20260915000000_daily_rituals_and_account_governance.sql
-- ============================================================================

-- 1. Daily Sunset & Evening Closure Logs Table
CREATE TABLE IF NOT EXISTS public.daily_sunset_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tasks_completed_count INTEGER NOT NULL DEFAULT 0,
    tasks_total_count INTEGER NOT NULL DEFAULT 0,
    focus_minutes_total INTEGER NOT NULL DEFAULT 0,
    habits_completed_count INTEGER NOT NULL DEFAULT 0,
    habits_total_count INTEGER NOT NULL DEFAULT 0,
    triage_decisions JSONB DEFAULT '[]'::jsonb,
    tomorrow_top_priorities JSONB DEFAULT '[]'::jsonb,
    reflection_notes TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_daily_sunset_user_date UNIQUE (user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_sunset_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own daily sunset logs"
    ON public.daily_sunset_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily sunset logs"
    ON public.daily_sunset_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily sunset logs"
    ON public.daily_sunset_logs
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_daily_sunset_user_date 
    ON public.daily_sunset_logs (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_sunset_user_completed 
    ON public.daily_sunset_logs (user_id, completed_at DESC);
