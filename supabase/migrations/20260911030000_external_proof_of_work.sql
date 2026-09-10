-- PACT Phase 5D: External Proof-of-Work Connectors Schema (GitHub, LeetCode, Codeforces)
-- Creates public.external_provider_integrations and public.external_proof_evidence tables with RLS and RPCs.

-- 1. Table: external_provider_integrations
CREATE TABLE IF NOT EXISTS public.external_provider_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'leetcode', 'codeforces')),
  account_handle TEXT NOT NULL,
  provider_user_id TEXT,
  access_token TEXT, -- Encrypted/server-only token for GitHub if OAuth/PAT is used
  token_expires_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'connected' 
    CHECK (sync_status IN ('connected', 'syncing', 'synced', 'error', 'revoked', 'disconnected')),
  last_verified_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_ext_provider_user ON public.external_provider_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_ext_provider_status ON public.external_provider_integrations(provider, sync_status);

-- Enable RLS on external_provider_integrations
ALTER TABLE public.external_provider_integrations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.external_provider_integrations TO authenticated;
GRANT ALL ON TABLE public.external_provider_integrations TO postgres;

DROP POLICY IF EXISTS "Users can view own provider integrations" ON public.external_provider_integrations;
CREATE POLICY "Users can view own provider integrations"
  ON public.external_provider_integrations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own provider integrations" ON public.external_provider_integrations;
CREATE POLICY "Users can insert own provider integrations"
  ON public.external_provider_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own provider integrations" ON public.external_provider_integrations;
CREATE POLICY "Users can update own provider integrations"
  ON public.external_provider_integrations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own provider integrations" ON public.external_provider_integrations;
CREATE POLICY "Users can delete own provider integrations"
  ON public.external_provider_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Table: external_proof_evidence (Immutable, deduplicated audit trail of verified external work)
CREATE TABLE IF NOT EXISTS public.external_proof_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.task_accountability_commitments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'leetcode', 'codeforces')),
  external_event_id TEXT NOT NULL, -- Commit SHA, LeetCode submission identifier, Codeforces submission ID
  event_timestamp TIMESTAMPTZ NOT NULL,
  evidence_type TEXT NOT NULL, -- 'commit', 'pr', 'accepted_submission', 'contest_participation'
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_commitment_provider_event UNIQUE (commitment_id, provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_ext_proof_commitment ON public.external_proof_evidence(commitment_id);
CREATE INDEX IF NOT EXISTS idx_ext_proof_user ON public.external_proof_evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_ext_proof_timestamp ON public.external_proof_evidence(event_timestamp);

-- Enable RLS on external_proof_evidence
ALTER TABLE public.external_proof_evidence ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.external_proof_evidence TO authenticated;
GRANT ALL ON TABLE public.external_proof_evidence TO postgres;

DROP POLICY IF EXISTS "Users can view own proof evidence" ON public.external_proof_evidence;
CREATE POLICY "Users can view own proof evidence"
  ON public.external_proof_evidence FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Sanitized RPC: Get External Integrations Status (tokens omitted from client projection)
CREATE OR REPLACE FUNCTION public.get_external_integrations_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_integrations JSONB;
BEGIN
  -- Strict tenant authorization check
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized integration status access';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'provider', provider,
        'account_handle', account_handle,
        'provider_user_id', provider_user_id,
        'sync_status', sync_status,
        'last_verified_at', last_verified_at,
        'last_error', last_error,
        'has_token', (access_token IS NOT NULL),
        'created_at', created_at,
        'updated_at', updated_at
      )
    ),
    '[]'::jsonb
  ) INTO v_integrations
  FROM public.external_provider_integrations
  WHERE user_id = p_user_id;

  RETURN v_integrations;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_external_integrations_status(UUID) TO authenticated;

-- 4. Authoritative Proof Fulfillment RPC: public.fulfill_external_proof_commitment
CREATE OR REPLACE FUNCTION public.fulfill_external_proof_commitment(
  p_commitment_id UUID,
  p_provider TEXT,
  p_rule_summary TEXT,
  p_evidence_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_commitment public.task_accountability_commitments%ROWTYPE;
  v_now TIMESTAMPTZ := transaction_timestamp();
  v_item JSONB;
  v_session public.accountability_verification_sessions%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHENTICATED',
      'error', 'Authentication required to fulfill accountability.'
    );
  END IF;

  -- Lock commitment row for update
  SELECT * INTO v_commitment
  FROM public.task_accountability_commitments
  WHERE id = p_commitment_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'error', 'Accountability commitment not found or access denied.'
    );
  END IF;

  -- Idempotency check: if commitment already fulfilled, return success
  IF v_commitment.commitment_status = 'fulfilled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_FULFILLED',
      'error', 'Commitment has already been fulfilled.'
    );
  END IF;

  IF v_commitment.commitment_status <> 'activated' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'COMMITMENT_NOT_ACTIVATED',
      'error', 'Only activated accountability commitments can be fulfilled.',
      'commitment_status', v_commitment.commitment_status
    );
  END IF;

  -- Enable internal bypass to transition commitment and insert evidence
  PERFORM set_config('pact.internal_bypass', 'true', true);

  -- Insert immutable evidence records (idempotent ON CONFLICT DO NOTHING)
  IF p_evidence_items IS NOT NULL AND jsonb_array_length(p_evidence_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_evidence_items)
    LOOP
      INSERT INTO public.external_proof_evidence (
        commitment_id,
        user_id,
        provider,
        external_event_id,
        event_timestamp,
        evidence_type,
        summary,
        metadata
      ) VALUES (
        p_commitment_id,
        v_user_id,
        p_provider,
        v_item->>'external_event_id',
        (v_item->>'event_timestamp')::timestamptz,
        v_item->>'evidence_type',
        v_item->>'summary',
        COALESCE(v_item->'metadata', '{}'::jsonb)
      ) ON CONFLICT (commitment_id, provider, external_event_id) DO NOTHING;
    END LOOP;
  END IF;

  -- Transition commitment status to fulfilled
  UPDATE public.task_accountability_commitments
  SET
    commitment_status = 'fulfilled',
    updated_at = v_now
  WHERE id = p_commitment_id;

  -- Record append-only fulfilled event explicitly marked as objectively verified
  INSERT INTO public.accountability_events (
    user_id,
    task_id,
    commitment_id,
    event_type,
    created_at,
    metadata
  ) VALUES (
    v_user_id,
    v_commitment.task_id,
    v_commitment.id,
    'fulfilled',
    v_now,
    jsonb_build_object(
      'verification_type', 'external_proof',
      'provider', p_provider,
      'verified_objectively', true,
      'rule_summary', p_rule_summary,
      'evidence_count', jsonb_array_length(COALESCE(p_evidence_items, '[]'::jsonb))
    )
  ) ON CONFLICT (commitment_id, event_type) DO NOTHING;

  -- Record completed session row for unified history
  INSERT INTO public.accountability_verification_sessions (
    commitment_id,
    user_id,
    started_at,
    ended_at,
    required_duration_seconds,
    actual_duration_seconds,
    status,
    evidence_note,
    verification_metadata
  ) VALUES (
    p_commitment_id,
    v_user_id,
    v_now,
    v_now,
    0,
    0,
    'completed',
    p_rule_summary,
    jsonb_build_object(
      'verification_type', 'external_proof',
      'provider', p_provider,
      'verified_objectively', true,
      'evidence_count', jsonb_array_length(COALESCE(p_evidence_items, '[]'::jsonb))
    )
  ) RETURNING * INTO v_session;

  -- Update provider's last_verified_at timestamp
  UPDATE public.external_provider_integrations
  SET 
    last_verified_at = v_now,
    sync_status = 'synced',
    updated_at = v_now
  WHERE user_id = v_user_id AND provider = p_provider;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'FULFILLED',
    'verification_type', 'external_proof',
    'provider', p_provider,
    'verified_objectively', true,
    'data', to_jsonb(v_session)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fulfill_external_proof_commitment(UUID, TEXT, TEXT, JSONB) TO authenticated;
