'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createCircleSchema,
  inviteCircleMemberSchema,
  respondCircleInvitationSchema,
  removeCircleMemberSchema,
  shareCommitmentWithCircleSchema,
  submitCircleAttestationSchema,
  CreateCircleInput,
  RespondCircleInvitationInput,
  RemoveCircleMemberInput,
  ShareCommitmentWithCircleInput,
  PeerAttestationInput,
  AccountabilityCircle,
} from '@/lib/validations/circles';
import {
  generateCircleInvitation,
  hashCircleInvitationToken,
  evaluateCirclePermissions,
} from '@/lib/accountability/circles';

export interface CircleActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action: Creates a new accountability circle with the caller as 'owner'.
 */
export async function createCircleAction(
  rawInput: CreateCircleInput
): Promise<CircleActionResult<AccountabilityCircle>> {
  const validation = createCircleSchema.safeParse(rawInput);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid circle details.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { name, description, require_unanimous_verdict } = validation.data;

  // Insert circle
  const { data: circle, error: circleError } = await supabase
    .from('accountability_circles')
    .insert({
      name,
      description: description || null,
      owner_id: user.id,
      require_unanimous_verdict: require_unanimous_verdict || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (circleError || !circle) {
    return { success: false, error: 'Failed to create accountability circle.' };
  }

  // Insert owner membership
  await supabase
    .from('accountability_circle_members')
    .insert({
      circle_id: circle.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    });

  return { success: true, data: circle as AccountabilityCircle };
}

/**
 * Server action: Generates a cryptographic invitation link to join an accountability circle.
 */
export async function createCircleInvitationAction(
  rawInput: { circle_id: string; invitee_email?: string; role?: 'member' | 'accountability_partner' | 'observer' }
): Promise<CircleActionResult<{ invite_url: string; token: string }>> {
  const validation = inviteCircleMemberSchema.safeParse(rawInput);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid invitation details.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { circle_id, invitee_email, role, expires_in_days } = validation.data;

  // Verify caller is owner or authorized partner
  const { data: membership } = await supabase
    .from('accountability_circle_members')
    .select('role')
    .eq('circle_id', circle_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership || !evaluateCirclePermissions(membership.role).canInvite) {
    return { success: false, error: 'You do not have permission to invite members to this circle.' };
  }

  const generated = generateCircleInvitation({
    circleId: circle_id,
    inviterId: user.id,
    inviteeEmail: invitee_email,
    role,
    expiresInDays: expires_in_days,
  });

  const { error: inviteError } = await supabase
    .from('circle_invitations')
    .insert({
      circle_id,
      inviter_id: user.id,
      invitee_email: invitee_email ? invitee_email.toLowerCase() : null,
      token_hash: generated.invitation.tokenHash,
      role,
      status: 'pending',
      expires_at: generated.invitation.expiresAt,
      created_at: generated.invitation.createdAt,
    });

  if (inviteError) {
    return { success: false, error: 'Failed to record circle invitation.' };
  }

  return { success: true, data: { invite_url: generated.invitationUrl, token: generated.rawToken } };
}

export const inviteCircleMemberAction = createCircleInvitationAction;

/**
 * Server action: Responds to a circle invitation (accept / decline).
 */
export async function respondToCircleInvitationAction(
  rawInput: RespondCircleInvitationInput
): Promise<CircleActionResult<{ joinedCircleId?: string }>> {
  const validation = respondCircleInvitationSchema.safeParse(rawInput);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid response.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized. Please sign in to accept invitation.' };
  }

  const { token, decision } = validation.data;
  const tokenHash = hashCircleInvitationToken(token);

  // Fetch invitation record
  const { data: invite, error: inviteError } = await supabase
    .from('circle_invitations')
    .select('*')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (inviteError || !invite) {
    return { success: false, error: 'Invitation not found or invalid.' };
  }

  if (invite.status !== 'pending') {
    return { success: false, error: `Invitation has already been ${invite.status}.` };
  }

  const now = new Date();
  if (new Date(invite.expires_at).getTime() < now.getTime()) {
    await supabase
      .from('circle_invitations')
      .update({ status: 'expired' })
      .eq('id', invite.id);
    return { success: false, error: 'Invitation has expired.' };
  }

  const nowIso = now.toISOString();

  if (decision === 'decline') {
    await supabase
      .from('circle_invitations')
      .update({ status: 'declined' })
      .eq('id', invite.id);
    return { success: true };
  }

  // Accept invitation: update invitation and add membership
  await supabase
    .from('circle_invitations')
    .update({ status: 'accepted', accepted_at: nowIso })
    .eq('id', invite.id);

  const { error: memberError } = await supabase
    .from('accountability_circle_members')
    .upsert(
      {
        circle_id: invite.circle_id,
        user_id: user.id,
        role: invite.role,
        status: 'active',
        joined_at: nowIso,
      },
      { onConflict: 'circle_id,user_id' }
    );

  if (memberError) {
    return { success: false, error: 'Failed to complete circle membership.' };
  }

  return { success: true, data: { joinedCircleId: invite.circle_id } };
}

/**
 * Server action: Removes a member from an accountability circle.
 */
export async function removeCircleMemberAction(
  rawInput: RemoveCircleMemberInput
): Promise<CircleActionResult> {
  const validation = removeCircleMemberSchema.safeParse(rawInput);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid parameters.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { circle_id, member_user_id } = validation.data;

  // Check permissions: either the circle owner or the member self-leaving
  const isSelf = user.id === member_user_id;

  const { data: circle } = await supabase
    .from('accountability_circles')
    .select('owner_id')
    .eq('id', circle_id)
    .maybeSingle();

  if (!circle) {
    return { success: false, error: 'Circle not found.' };
  }

  const isOwner = circle.owner_id === user.id;

  if (!isSelf && !isOwner) {
    return { success: false, error: 'Only the circle owner can remove other members.' };
  }

  if (isOwner && isSelf) {
    return { success: false, error: 'Circle owners cannot leave their own circle without transferring ownership.' };
  }

  const { error: deleteError } = await supabase
    .from('accountability_circle_members')
    .delete()
    .eq('circle_id', circle_id)
    .eq('user_id', member_user_id);

  if (deleteError) {
    return { success: false, error: 'Failed to remove circle member.' };
  }

  return { success: true };
}

/**
 * Server action: Shares an active commitment with a circle for peer accountability.
 */
export async function shareCommitmentWithCircleAction(
  rawInput: ShareCommitmentWithCircleInput
): Promise<CircleActionResult> {
  const validation = shareCommitmentWithCircleSchema.safeParse(rawInput);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid share parameters.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { circle_id, commitment_id, masked_consequence } = validation.data;

  // Insert shared commitment
  const { error: shareError } = await supabase
    .from('circle_shared_commitments')
    .insert({
      circle_id,
      commitment_id,
      user_id: user.id,
      masked_consequence: masked_consequence || '[CONFIDENTIAL CONSEQUENCE: Masked for circle review]',
      verification_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (shareError) {
    return { success: false, error: 'Commitment already shared with this circle or insert failed.' };
  }

  return { success: true };
}

/**
 * Server action: Submits a peer attestation for a commitment shared in a circle.
 */
export async function recordPeerAttestationAction(
  rawInput: PeerAttestationInput
): Promise<CircleActionResult> {
  const validation = submitCircleAttestationSchema.safeParse(rawInput);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid attestation details.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { shared_commitment_id, verdict, attestation_notes } = validation.data;

  // Record attestation
  const { error: insertError } = await supabase
    .from('circle_attestations')
    .insert({
      shared_commitment_id,
      attester_id: user.id,
      verdict,
      attestation_notes: attestation_notes || null,
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    return { success: false, error: 'Failed to record peer attestation.' };
  }

  return { success: true };
}

export const submitCircleAttestationAction = recordPeerAttestationAction;

/**
 * Server action: Lists all circles the current user belongs to or owns.
 */
export async function listUserCirclesAction(): Promise<CircleActionResult<unknown[]>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { data, error } = await supabase
    .from('accountability_circles')
    .select(`
      id,
      name,
      description,
      owner_id,
      created_at,
      accountability_circle_members (
        id,
        user_id,
        role,
        status,
        joined_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: 'Failed to load accountability circles.' };
  }

  return { success: true, data: data || [] };
}
