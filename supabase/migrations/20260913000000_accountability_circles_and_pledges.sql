-- ==============================================================================
-- PACT OS Phase 10: Multi-Party Accountability Circles & Charity Pledge Engine
-- High-integrity schema for peer accountability circles, cryptographic invitations,
-- social attestations, and opt-in charity pledge agreements with PostgreSQL RLS.
-- ==============================================================================

-- 1. Accountability Circles Table
CREATE TABLE IF NOT EXISTS public.accountability_circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Accountability Circle Members Table
CREATE TABLE IF NOT EXISTS public.accountability_circle_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL REFERENCES public.accountability_circles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'accountability_partner', 'observer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (circle_id, user_id)
);

-- 3. Circle Invitations Table
CREATE TABLE IF NOT EXISTS public.circle_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL REFERENCES public.accountability_circles(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'accountability_partner', 'observer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ
);

-- 4. Circle Shared Commitments Table
CREATE TABLE IF NOT EXISTS public.circle_shared_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL REFERENCES public.accountability_circles(id) ON DELETE CASCADE,
    commitment_id UUID NOT NULL REFERENCES public.task_accountability_commitments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    allow_attestation BOOLEAN NOT NULL DEFAULT true,
    allow_proof_inspection BOOLEAN NOT NULL DEFAULT true,
    shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (circle_id, commitment_id)
);

-- 5. Circle Peer Attestations Table
CREATE TABLE IF NOT EXISTS public.circle_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL REFERENCES public.accountability_circles(id) ON DELETE CASCADE,
    commitment_id UUID NOT NULL REFERENCES public.task_accountability_commitments(id) ON DELETE CASCADE,
    attester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'clarification')),
    attestation_note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Charity Pledges Table
CREATE TABLE IF NOT EXISTS public.charity_pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    commitment_id UUID NOT NULL REFERENCES public.task_accountability_commitments(id) ON DELETE CASCADE,
    charity_name TEXT NOT NULL,
    charity_ein_or_id TEXT NOT NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 100 AND amount_cents <= 1000000), -- $1.00 to $10,000.00
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'authorized', 'armed', 'triggered', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    idempotency_key TEXT NOT NULL UNIQUE,
    consent_given_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    executed_at TIMESTAMPTZ
);

-- Enable Row-Level Security on all 6 tables
ALTER TABLE public.accountability_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_shared_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_pledges ENABLE ROW LEVEL SECURITY;

-- 1. accountability_circles Policies
CREATE POLICY "Users can view circles they own or are members of"
    ON public.accountability_circles
    FOR SELECT
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.accountability_circle_members
            WHERE accountability_circle_members.circle_id = accountability_circles.id
            AND accountability_circle_members.user_id = auth.uid()
            AND accountability_circle_members.status = 'active'
        )
    );

CREATE POLICY "Users can create their own circles"
    ON public.accountability_circles
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Circle owners can update their circles"
    ON public.accountability_circles
    FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Circle owners can delete their circles"
    ON public.accountability_circles
    FOR DELETE
    USING (owner_id = auth.uid());

-- 2. accountability_circle_members Policies
CREATE POLICY "Members can view membership in their circles"
    ON public.accountability_circle_members
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.accountability_circle_members AS m
            WHERE m.circle_id = accountability_circle_members.circle_id
            AND m.user_id = auth.uid()
            AND m.status = 'active'
        )
    );

CREATE POLICY "Circle owners and self can manage membership"
    ON public.accountability_circle_members
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.accountability_circles
            WHERE accountability_circles.id = accountability_circle_members.circle_id
            AND accountability_circles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Circle owners can update membership"
    ON public.accountability_circle_members
    FOR UPDATE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.accountability_circles
            WHERE accountability_circles.id = accountability_circle_members.circle_id
            AND accountability_circles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Circle owners and self can remove membership"
    ON public.accountability_circle_members
    FOR DELETE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.accountability_circles
            WHERE accountability_circles.id = accountability_circle_members.circle_id
            AND accountability_circles.owner_id = auth.uid()
        )
    );

-- 3. circle_invitations Policies
CREATE POLICY "Circle owners and invitees can view invitations"
    ON public.circle_invitations
    FOR SELECT
    USING (
        inviter_id = auth.uid() OR
        invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Circle owners can create invitations"
    ON public.circle_invitations
    FOR INSERT
    WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Circle owners and invitees can update invitations"
    ON public.circle_invitations
    FOR UPDATE
    USING (
        inviter_id = auth.uid() OR
        invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- 4. circle_shared_commitments Policies
CREATE POLICY "Circle members can view shared commitments"
    ON public.circle_shared_commitments
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.accountability_circle_members
            WHERE accountability_circle_members.circle_id = circle_shared_commitments.circle_id
            AND accountability_circle_members.user_id = auth.uid()
            AND accountability_circle_members.status = 'active'
        )
    );

CREATE POLICY "Commitment owners can share with circles"
    ON public.circle_shared_commitments
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Commitment owners can remove shared commitments"
    ON public.circle_shared_commitments
    FOR DELETE
    USING (user_id = auth.uid());

-- 5. circle_attestations Policies
CREATE POLICY "Circle members can view attestations"
    ON public.circle_attestations
    FOR SELECT
    USING (
        attester_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.accountability_circle_members
            WHERE accountability_circle_members.circle_id = circle_attestations.circle_id
            AND accountability_circle_members.user_id = auth.uid()
            AND accountability_circle_members.status = 'active'
        )
    );

CREATE POLICY "Circle partners can insert attestations"
    ON public.circle_attestations
    FOR INSERT
    WITH CHECK (
        attester_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.accountability_circle_members
            WHERE accountability_circle_members.circle_id = circle_attestations.circle_id
            AND accountability_circle_members.user_id = auth.uid()
            AND accountability_circle_members.role IN ('owner', 'accountability_partner', 'member')
            AND accountability_circle_members.status = 'active'
        )
    );

-- 6. charity_pledges Policies
CREATE POLICY "Users can manage their own charity pledges"
    ON public.charity_pledges
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Indexes for performance and lookup
CREATE INDEX IF NOT EXISTS idx_accountability_circles_owner ON public.accountability_circles(owner_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_lookup ON public.accountability_circle_members(circle_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_circle_invitations_token_hash ON public.circle_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_circle_shared_commitments_lookup ON public.circle_shared_commitments(circle_id, commitment_id);
CREATE INDEX IF NOT EXISTS idx_circle_attestations_lookup ON public.circle_attestations(circle_id, commitment_id);
CREATE INDEX IF NOT EXISTS idx_charity_pledges_user ON public.charity_pledges(user_id, commitment_id);
