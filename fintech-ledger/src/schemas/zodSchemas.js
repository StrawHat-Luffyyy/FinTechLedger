import { z } from 'zod';

//SignUp Schema
export const signupSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

//Login Schema
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

// Transfer Schema
export const transferSchema = z.object({
  body: z.object({
    fromAccountId: z.string().uuid('Invalid account ID format'),
    toAccountId: z.string().uuid('Invalid account ID format'),
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be greater than zero')
      .gt(0, 'Amount cannot be zero'),
  }),
});
