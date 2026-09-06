'use server';

import { createClient } from '@/lib/supabase/server';
import { createProjectSchema, updateProjectSchema } from '@/lib/validations/domain';
import { Project } from '@/types/domain';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export interface ProjectActionResult<T = Project> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to create a new Project for the authenticated user.
 * Ownership (user_id) is derived strictly from the server-verified auth session.
 * Cross-user goal linkage is verified server-side prior to insertion.
 */
export async function createProjectAction(
  payload: unknown
): Promise<ProjectActionResult<Project>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to create a project.' };
    }

    const validation = createProjectSchema.safeParse(payload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return { success: false, error: firstIssue?.message || 'Invalid project details provided.' };
    }

    const { title, goal_id, description, color_accent } = validation.data;

    // Server-side authorization check: verify parent goal belongs to authenticated user
    if (goal_id) {
      const { data: targetGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('id', goal_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!targetGoal) {
        return { success: false, error: 'You can only associate a project with a goal you own.' };
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        goal_id: goal_id || null,
        title,
        description: description || null,
        color_accent: color_accent || null,
        status: 'active',
      })
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: 'Failed to create project. Please try again.' };
    }

    revalidatePath('/app/projects');
    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: data as Project };
  } catch {
    return { success: false, error: 'An unexpected error occurred while creating the project.' };
  }
}

/**
 * Server action to update an existing Project owned by the authenticated user.
 * Enforces strict ownership and parent goal linkage verification.
 */
export async function updateProjectAction(
  projectId: string,
  payload: unknown
): Promise<ProjectActionResult<Project>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to update project.' };
    }

    if (!projectId || typeof projectId !== 'string') {
      return { success: false, error: 'Invalid project identifier.' };
    }

    const validation = updateProjectSchema.safeParse(payload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return { success: false, error: firstIssue?.message || 'Invalid project update details.' };
    }

    const { goal_id } = validation.data;

    // If goal_id is provided and non-null, verify ownership server-side
    if (goal_id) {
      const { data: targetGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('id', goal_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!targetGoal) {
        return { success: false, error: 'You can only associate a project with a goal you own.' };
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (validation.data.title !== undefined) updatePayload.title = validation.data.title;
    if (validation.data.goal_id !== undefined) updatePayload.goal_id = validation.data.goal_id;
    if (validation.data.description !== undefined) updatePayload.description = validation.data.description;
    if (validation.data.color_accent !== undefined) updatePayload.color_accent = validation.data.color_accent;
    if (validation.data.status !== undefined) updatePayload.status = validation.data.status;

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: 'Failed to update project or access denied.' };
    }

    revalidatePath('/app/projects');
    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: data as Project };
  } catch {
    return { success: false, error: 'An unexpected error occurred while updating the project.' };
  }
}

/**
 * Server action to archive a Project owned by the authenticated user.
 */
export async function archiveProjectAction(projectId: string): Promise<ProjectActionResult<Project>> {
  return updateProjectAction(projectId, { status: 'archived' });
}

/**
 * Server action to delete a Project owned by the authenticated user.
 */
export async function deleteProjectAction(projectId: string): Promise<ProjectActionResult<null>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to delete project.' };
    }

    const uuidValidation = z.string().uuid().safeParse(projectId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid project identifier format.' };
    }

    const { error, count } = await supabase
      .from('projects')
      .delete({ count: 'exact' })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: 'Failed to delete project.' };
    }

    if (count === 0) {
      return { success: false, error: 'Project not found or access denied.' };
    }

    revalidatePath('/app/projects');
    revalidatePath('/app/goals');
    revalidatePath('/app');

    return { success: true, data: null };
  } catch {
    return { success: false, error: 'An unexpected error occurred while deleting the project.' };
  }
}
