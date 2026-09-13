-- ==============================================================================
-- PACT OS Phase 9: WebAuthn / Passkey Credentials Engine
-- Durable storage for FIDO2 / WebAuthn passkey public credentials with RLS.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.passkey_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    device_name TEXT NOT NULL,
    transports TEXT[] DEFAULT '{}',
    aaguid TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ
);

-- Enable Row-Level Security
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

-- Strict user isolation policies
CREATE POLICY "Users can view their own passkey credentials"
    ON public.passkey_credentials
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own passkey credentials"
    ON public.passkey_credentials
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own passkey credentials"
    ON public.passkey_credentials
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passkey credentials"
    ON public.passkey_credentials
    FOR DELETE
    USING (auth.uid() = user_id);

-- Performance and lookup indexes
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id ON public.passkey_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_credential_id ON public.passkey_credentials(credential_id);
