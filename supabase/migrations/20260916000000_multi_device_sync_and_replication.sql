-- ============================================================================
-- PACT OS Phase 13: Multi-Device Offline Sync & Local-First Replication Schema
-- ============================================================================

-- 1. Device Registry: Tracks registered client devices and individual sync cursors
CREATE TABLE IF NOT EXISTS public.device_registry (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    client_type TEXT NOT NULL DEFAULT 'web_desktop' CHECK (client_type IN ('web_desktop', 'web_mobile', 'pwa', 'native_companion')),
    sync_cursor TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Sync Delta Logs: Append-only delta logs for deterministic replication across devices
CREATE TABLE IF NOT EXISTS public.sync_delta_logs (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('tasks', 'thoughts', 'habits', 'focus_logs', 'sunset_drafts', 'preferences')),
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('UPSERT', 'DELETE')),
    delta JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    logical_clock BIGINT NOT NULL DEFAULT 1,
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Staged Proof Attachments: Offline evidence attachments for commitment verification
CREATE TABLE IF NOT EXISTS public.staged_proof_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    commitment_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    sha256_hash TEXT NOT NULL,
    storage_path TEXT,
    status TEXT NOT NULL DEFAULT 'STAGED_OFFLINE' CHECK (status IN ('STAGED_OFFLINE', 'UPLOADING', 'UPLOADED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.device_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_delta_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staged_proof_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY users_manage_own_devices
    ON public.device_registry
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_manage_own_delta_logs
    ON public.sync_delta_logs
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_manage_own_staged_attachments
    ON public.staged_proof_attachments
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Performance Composite Indexes
CREATE INDEX IF NOT EXISTS idx_device_registry_user_seen
    ON public.device_registry(user_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_delta_logs_user_server_ts
    ON public.sync_delta_logs(user_id, server_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sync_delta_logs_user_entity
    ON public.sync_delta_logs(user_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_staged_proof_attachments_user_commitment
    ON public.staged_proof_attachments(user_id, commitment_id, status);
