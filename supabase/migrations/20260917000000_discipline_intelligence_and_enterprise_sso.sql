-- Migration: 20260917000000_discipline_intelligence_and_enterprise_sso.sql
-- Description: Phase 14 Autonomous Discipline Insights and Enterprise SSO Provider Configuration

-- 1. Discipline Insights Table
CREATE TABLE IF NOT EXISTS public.discipline_insights (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.85,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  metrics_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.discipline_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own discipline insights"
  ON public.discipline_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own discipline insights"
  ON public.discipline_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discipline insights"
  ON public.discipline_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discipline insights"
  ON public.discipline_insights FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_discipline_insights_user_id ON public.discipline_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_discipline_insights_severity ON public.discipline_insights(severity);

-- 2. Enterprise SSO Providers Table
CREATE TABLE IF NOT EXISTS public.sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'OIDC' CHECK (provider_type IN ('OIDC', 'SAML2')),
  issuer_url TEXT NOT NULL,
  client_id TEXT NOT NULL,
  saml_metadata_url TEXT,
  default_role TEXT NOT NULL DEFAULT 'member' CHECK (default_role IN ('owner', 'admin', 'member', 'observer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace owners can manage SSO providers"
  ON public.sso_providers FOR ALL
  USING (auth.uid() = workspace_id)
  WITH CHECK (auth.uid() = workspace_id);

CREATE POLICY "Allow public discovery of active SSO providers by domain"
  ON public.sso_providers FOR SELECT
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_sso_providers_domain ON public.sso_providers(domain);
CREATE INDEX IF NOT EXISTS idx_sso_providers_workspace_id ON public.sso_providers(workspace_id);

-- 3. Enterprise SSO Audit Logs Table
CREATE TABLE IF NOT EXISTS public.sso_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  email TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sso_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace owners can view SSO audit logs"
  ON public.sso_audit_logs FOR SELECT
  USING (auth.uid() = workspace_id);

CREATE POLICY "Server can insert SSO audit logs"
  ON public.sso_audit_logs FOR INSERT
  WITH CHECK (auth.uid() = workspace_id);

CREATE INDEX IF NOT EXISTS idx_sso_audit_logs_workspace_id ON public.sso_audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sso_audit_logs_created_at ON public.sso_audit_logs(created_at);
