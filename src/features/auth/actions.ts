'use server';

import { createClient } from '@/lib/supabase/server';
import { signInSchema, signUpSchema } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';

export interface AuthActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Server action for user registration.
 * Validates payload with Zod, invokes Supabase Auth, and handles profile initialization.
 */
export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName') || undefined,
    timezone: formData.get('timezone') || 'UTC',
  };

  const validation = signUpSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Invalid registration details.',
    };
  }

  const { email, password, fullName, timezone } = validation.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        timezone,
      },
    },
  });

  if (error) {
    // Return sanitized generic message to avoid exposing internal details
    return { error: 'Registration failed. Please check your credentials and try again.' };
  }

  if (data.session) {
    redirect('/app');
  }

  return { success: true };
}

/**
 * Server action for user sign-in.
 * Uses generic error messages to prevent account enumeration.
 */
export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const validation = signInSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || 'Invalid email or password.',
    };
  }

  const { email, password } = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Generic error message prevents account enumeration
    return { error: 'Invalid email or password.' };
  }

  redirect('/app');
}

/**
 * Server action for user sign-out.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/?auth=signin');
}
