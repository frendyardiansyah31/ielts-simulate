import { z } from "zod";

export const loginSchemaForm = z.object({
  email: z.email("Please enter a valid email").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginForm = z.infer<typeof loginSchemaForm>;

export const registerSchemaForm = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Please enter a valid email").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterForm = z.infer<typeof registerSchemaForm>;
