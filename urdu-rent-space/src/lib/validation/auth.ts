import { z } from 'zod';

// Mirrors the backend's password rule (urdu-rent-space-backend/src/utils/validation.js
// isValidPassword): at least 8 chars, one uppercase, one lowercase, one number.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number');

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

// Registration is a two-step wizard sharing one form instance; step 1's
// "Next" button validates only REGISTER_STEP_1_FIELDS via form.trigger(),
// final submit validates the whole schema (including the cross-field
// password check and step 2's fields).
export const REGISTER_STEP_1_FIELDS = ['fullName', 'email', 'phone', 'password', 'confirmPassword'] as const;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Full name must be under 100 characters'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    phone: z.string().trim().min(7, 'Enter a valid phone number'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['owner', 'borrower', 'both']),
    agreeToTerms: z.boolean().refine((v) => v === true, { message: 'You must agree to the terms and conditions' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit code'),
});
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
