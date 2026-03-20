import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*?[a-z])(?=.*?[0-9])/, 'Requires 1 letter & 1 number'),
    fullname: z.string().min(2).max(100)
});

export type RegisterInput = z.infer<typeof registerSchema>;
