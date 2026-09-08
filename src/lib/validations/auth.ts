import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters long.').optional(),
  timezone: z.string().min(1, 'Timezone is required.').default('UTC'),
});

export const signInSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
