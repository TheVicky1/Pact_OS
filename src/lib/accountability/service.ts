import { createClient } from '@/lib/supabase/server';
import {
  ConsequenceDefinition,
  UserAccountabilityPreferences,
  CreateConsequenceDefinitionInput,
  UpdateConsequenceDefinitionInput,
  UpdateUserAccountabilityPreferencesInput,
} from '@/types/domain';
import {
  createConsequenceDefinitionSchema,
  updateConsequenceDefinitionSchema,
  updateUserAccountabilityPreferencesSchema,
} from '@/lib/validations/accountability';

export async function getConsequenceDefinitions(): Promise<ConsequenceDefinition[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('consequence_definitions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch consequence definitions: ${error.message}`);
  }

  return data as ConsequenceDefinition[];
}

export async function getConsequenceDefinitionById(id: string): Promise<ConsequenceDefinition | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('consequence_definitions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch consequence definition: ${error.message}`);
  }

  return data as ConsequenceDefinition;
}

export async function createConsequenceDefinition(
  input: CreateConsequenceDefinitionInput
): Promise<ConsequenceDefinition> {
  const validated = createConsequenceDefinitionSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  // If this definition is marked default, unset existing default flags for this user
  if (validated.is_default) {
    await supabase
      .from('consequence_definitions')
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  const { data, error } = await supabase
    .from('consequence_definitions')
    .insert({
      user_id: user.id,
      title: validated.title,
      consequence_type: validated.consequence_type,
      action_statement: validated.action_statement,
      description: validated.description ?? null,
      is_enabled: validated.is_enabled ?? true,
      is_default: validated.is_default ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create consequence definition: ${error.message}`);
  }

  // If marked default, also update default_consequence_id in user_accountability_preferences
  if (validated.is_default) {
    await supabase
      .from('user_accountability_preferences')
      .upsert({
        user_id: user.id,
        default_consequence_id: data.id,
        updated_at: new Date().toISOString(),
      });
  }

  return data as ConsequenceDefinition;
}

export async function updateConsequenceDefinition(
  id: string,
  input: UpdateConsequenceDefinitionInput
): Promise<ConsequenceDefinition> {
  const validated = updateConsequenceDefinitionSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  if (validated.is_default) {
    await supabase
      .from('consequence_definitions')
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  const { data, error } = await supabase
    .from('consequence_definitions')
    .update({
      ...validated,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update consequence definition: ${error.message}`);
  }

  if (validated.is_default) {
    await supabase
      .from('user_accountability_preferences')
      .upsert({
        user_id: user.id,
        default_consequence_id: data.id,
        updated_at: new Date().toISOString(),
      });
  }

  return data as ConsequenceDefinition;
}

export async function deleteConsequenceDefinition(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { error } = await supabase
    .from('consequence_definitions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete consequence definition: ${error.message}`);
  }
}

export async function getUserAccountabilityPreferences(): Promise<UserAccountabilityPreferences | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('user_accountability_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No preferences record created yet
    throw new Error(`Failed to fetch user accountability preferences: ${error.message}`);
  }

  return data as UserAccountabilityPreferences;
}

export async function updateUserAccountabilityPreferences(
  input: UpdateUserAccountabilityPreferencesInput
): Promise<UserAccountabilityPreferences> {
  const validated = updateUserAccountabilityPreferencesSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('user_accountability_preferences')
    .upsert({
      user_id: user.id,
      ...validated,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user accountability preferences: ${error.message}`);
  }

  return data as UserAccountabilityPreferences;
}

/**
 * Resolves the active default consequence definition for task creation.
 * Returns null if master engine is disabled, auto_apply_default is false, or no default is configured/enabled.
 */
export async function resolveDefaultConsequence(): Promise<ConsequenceDefinition | null> {
  const prefs = await getUserAccountabilityPreferences();

  if (!prefs || !prefs.is_enabled || !prefs.auto_apply_default || !prefs.default_consequence_id) {
    return null;
  }

  const consequence = await getConsequenceDefinitionById(prefs.default_consequence_id);
  if (!consequence || !consequence.is_enabled) {
    return null; // Disabled or deleted consequence cannot become active default
  }

  return consequence;
}
