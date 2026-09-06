import assert from 'node:assert';
import { signUpSchema, signInSchema } from '../src/lib/validations/auth';

/**
 * Phase 1 Unit & Security Validation Tests
 * Executed via node assertion runner.
 */
function runAuthValidationTests() {
  console.log('Running Phase 1 Auth Schema Validation Tests...');

  // Test 1: signUpSchema accepts valid input
  const validData = {
    email: 'alex@example.com',
    password: 'SecurePassword123!',
    fullName: 'Alex Morgan',
    timezone: 'America/New_York',
  };
  const res1 = signUpSchema.safeParse(validData);
  assert.strictEqual(res1.success, true, 'signUpSchema failed on valid input');

  // Test 2: signUpSchema rejects invalid email
  const invalidEmail = {
    email: 'not-an-email',
    password: 'SecurePassword123!',
    timezone: 'UTC',
  };
  const res2 = signUpSchema.safeParse(invalidEmail);
  assert.strictEqual(res2.success, false, 'signUpSchema allowed invalid email');

  // Test 3: signUpSchema rejects short password
  const invalidPassword = {
    email: 'alex@example.com',
    password: 'short',
    timezone: 'UTC',
  };
  const res3 = signUpSchema.safeParse(invalidPassword);
  assert.strictEqual(res3.success, false, 'signUpSchema allowed short password');

  // Test 4: signInSchema accepts valid credentials
  const validAuth = {
    email: 'alex@example.com',
    password: 'anypassword',
  };
  const res4 = signInSchema.safeParse(validAuth);
  assert.strictEqual(res4.success, true, 'signInSchema failed on valid auth');

  // Test 5: signInSchema rejects empty password
  const emptyPassword = {
    email: 'alex@example.com',
    password: '',
  };
  const res5 = signInSchema.safeParse(emptyPassword);
  assert.strictEqual(res5.success, false, 'signInSchema allowed empty password');

  console.log('✅ All Phase 1 Auth Validation Tests Passed Successfully!');
}

runAuthValidationTests();
