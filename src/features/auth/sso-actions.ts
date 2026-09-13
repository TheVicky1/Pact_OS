'use server';

import { createClient } from '@/lib/supabase/server';
import {
  generateSsoState,
  consumeSsoState,
  validateSsoDomain,
  mapIdpRole,
  parseOidcTokenPayload,
  SsoProviderConfig,
  SsoValidationResult,
  SsoWorkspaceRole,
  SsoProviderType,
} from '@/lib/auth/sso-engine';
import { logger } from '@/lib/observability/logger';

export interface SsoInitiationResult {
  success: boolean;
  authorizationUrl?: string;
  state?: string;
  error?: string;
}

export interface SaveSsoProviderInput {
  domain: string;
  providerType: SsoProviderType;
  issuerUrl: string;
  clientId: string;
  samlMetadataUrl?: string | null;
  defaultRole?: SsoWorkspaceRole;
}

/**
 * Initiates an Enterprise SSO handshake by generating a single-use cryptographically bound state.
 */
export async function initiateSsoLoginAction(domain: string): Promise<SsoInitiationResult> {
  try {
    const supabase = await createClient();
    const cleanDomain = domain.toLowerCase().trim();

    // Query active SSO provider config for domain
    const { data: provider, error } = await supabase
      .from('sso_providers')
      .select('id, workspace_id, domain, provider_type, issuer_url, client_id, saml_metadata_url, default_role, is_active, created_at')
      .eq('domain', cleanDomain)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !provider) {
      return {
        success: false,
        error: `No active Enterprise SSO provider configured for domain @${cleanDomain}`,
      };
    }

    const { state, nonce } = generateSsoState(cleanDomain);

    let authUrl: string;
    if (provider.provider_type === 'OIDC') {
      const parsedUrl = new URL(provider.issuer_url);
      if (!parsedUrl.pathname.endsWith('/authorize')) {
        parsedUrl.pathname = parsedUrl.pathname.replace(/\/$/, '') + '/oauth2/v2.0/authorize';
      }
      parsedUrl.searchParams.set('client_id', provider.client_id);
      parsedUrl.searchParams.set('response_type', 'code');
      parsedUrl.searchParams.set('scope', 'openid email profile');
      parsedUrl.searchParams.set('state', state);
      parsedUrl.searchParams.set('nonce', nonce);
      parsedUrl.searchParams.set(
        'redirect_uri',
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/sso/callback`
      );
      authUrl = parsedUrl.toString();
    } else {
      // SAML2 redirect
      authUrl = `${provider.saml_metadata_url || provider.issuer_url}?RelayState=${state}`;
    }

    return {
      success: true,
      authorizationUrl: authUrl,
      state,
    };
  } catch (err: unknown) {
    logger.error('Failed to initiate SSO login', err instanceof Error ? err : new Error(String(err)));
    return { success: false, error: 'Failed to initiate SSO login' };
  }
}

/**
 * Validates the callback response from an enterprise IdP.
 */
export async function validateSsoCallbackAction(
  state: string,
  idTokenPayload: Record<string, unknown>
): Promise<SsoValidationResult> {
  try {
    const challenge = consumeSsoState(state);
    if (!challenge) {
      return { success: false, error: 'Invalid or expired SSO state challenge (replay protection triggered)' };
    }

    const oidcData = parseOidcTokenPayload(idTokenPayload);
    if (!oidcData) {
      return { success: false, error: 'Malformed or missing identity claims in IdP payload' };
    }

    if (!validateSsoDomain(oidcData.email, challenge.domain)) {
      return {
        success: false,
        error: `Identity claim email domain does not match expected workspace domain @${challenge.domain}`,
      };
    }

    const assignedRole = mapIdpRole(
      (idTokenPayload.roles as string | string[]) || (idTokenPayload.groups as string | string[]),
      'member'
    );

    return {
      success: true,
      email: oidcData.email,
      name: oidcData.name,
      domain: challenge.domain,
      assignedRole,
    };
  } catch (err: unknown) {
    logger.error('Failed to process SSO callback', err instanceof Error ? err : new Error(String(err)));
    return { success: false, error: 'Failed to process SSO callback' };
  }
}

/**
 * Saves or updates an Enterprise SSO Provider configuration for the user's workspace.
 */
export async function saveSsoProviderAction(
  input: SaveSsoProviderInput
): Promise<{ success: boolean; config?: SsoProviderConfig; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const cleanDomain = input.domain.toLowerCase().trim();
    if (!cleanDomain || !cleanDomain.includes('.')) {
      return { success: false, error: 'Invalid corporate email domain' };
    }

    const { data, error } = await supabase
      .from('sso_providers')
      .upsert(
        {
          workspace_id: user.id, // Direct workspace owner
          domain: cleanDomain,
          provider_type: input.providerType,
          issuer_url: input.issuerUrl.trim(),
          client_id: input.clientId.trim(),
          saml_metadata_url: input.samlMetadataUrl?.trim() || null,
          default_role: input.defaultRole || 'member',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'domain' }
      )
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      config: {
        id: data.id,
        workspaceId: data.workspace_id,
        domain: data.domain,
        providerType: data.provider_type,
        issuerUrl: data.issuer_url,
        clientId: data.client_id,
        samlMetadataUrl: data.saml_metadata_url,
        defaultRole: data.default_role,
        isActive: data.is_active,
        createdAt: data.created_at,
      },
    };
  } catch (err: unknown) {
    logger.error('Failed to save SSO provider configuration', err instanceof Error ? err : new Error(String(err)));
    return { success: false, error: 'Failed to save SSO provider configuration' };
  }
}
