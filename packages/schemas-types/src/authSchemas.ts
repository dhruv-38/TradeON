import { z } from "zod"

export const RegisterUserSchema = z.object({
  username: z.string(),
  email: z.email(),
  password: z.string().min(8),
});

export const LoginUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export type LoginUserInput = z.infer<typeof LoginUserSchema>;
