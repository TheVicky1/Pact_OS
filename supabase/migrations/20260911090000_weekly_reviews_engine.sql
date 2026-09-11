-- ====================================================================
-- PACT Phase 6D: Structured Weekly Review & Sunday Planning Ritual Engine
-- Table: public.weekly_reviews
-- Deterministic week entity with unique constraint per user/week,
-- immutable metric snapshotting upon commitment, and strict tenant-isolated RLS.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),
    reflection JSONB NOT NULL DEFAULT '{}'::jsonb,
    cleanup_decisions JSONB NOT NULL DEFAULT '{}'::jsonb,
    next_week_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    snapshot_metrics JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    committed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_weekly_reviews_date_order CHECK (week_end >= week_start),
    CONSTRAINT uq_weekly_reviews_user_week UNIQUE (user_id, week_start)
);

-- Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_week 
ON public.weekly_reviews (user_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_status 
ON public.weekly_reviews (user_id, status);

-- Enable Row Level Security
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

-- Strict Tenant-Isolated RLS Policies
CREATE POLICY "Users can view own weekly reviews" 
ON public.weekly_reviews FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly reviews" 
ON public.weekly_reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly reviews" 
ON public.weekly_reviews FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly reviews" 
ON public.weekly_reviews FOR DELETE 
USING (auth.uid() = user_id);

-- ====================================================================
-- Stored Procedure: pact_commit_weekly_review
-- Atomically transitions review to 'completed', sets timestamps,
-- and locks the immutable metrics snapshot.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.pact_commit_weekly_review(
    p_user_id UUID,
    p_review_id UUID,
    p_reflection JSONB,
    p_cleanup_decisions JSONB,
    p_next_week_plan JSONB,
    p_snapshot_metrics JSONB
)
RETURNS public.weekly_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_review public.weekly_reviews;
BEGIN
    -- Verify caller ownership
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Access denied: unauthorized user session.';
    END IF;

    -- Update and commit review atomically
    UPDATE public.weekly_reviews
    SET
        status = 'completed',
        current_step = 5,
        reflection = COALESCE(p_reflection, reflection),
        cleanup_decisions = COALESCE(p_cleanup_decisions, cleanup_decisions),
        next_week_plan = COALESCE(p_next_week_plan, next_week_plan),
        snapshot_metrics = p_snapshot_metrics,
        completed_at = COALESCE(completed_at, NOW()),
        committed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_review_id AND user_id = p_user_id
    RETURNING * INTO v_review;

    IF v_review.id IS NULL THEN
        RAISE EXCEPTION 'Weekly review not found or access denied.';
    END IF;

    RETURN v_review;
END;
$$;
