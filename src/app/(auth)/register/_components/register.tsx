"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/common/form-input-field";
import {
  INITIAL_REGISTER_FORM,
  INITIAL_STATE_REGISTER_FORM,
} from "@/constants/auth-constant";
import { RegisterForm, registerSchemaForm } from "@/validations/auth-validation";
import { startTransition, useActionState, useEffect } from "react";
import { register } from "../actions";

export default function Register() {
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchemaForm),
    defaultValues: INITIAL_REGISTER_FORM,
  });

  const [registerState, registerAction, isPendingRegister] = useActionState(
    register,
    INITIAL_STATE_REGISTER_FORM,
  );

  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    startTransition(async () => {
      registerAction(formData);
    });
  });

  useEffect(() => {
    if (registerState?.status === "error") {
      startTransition(() => {
        registerAction(null);
      });
    }
  }, [registerState, registerAction]);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Sign up to start practicing</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-rhf-register" onSubmit={onSubmit}>
          <FieldGroup>
            <FormInputField
              id="form-rhf-register-name"
              name="name"
              control={form.control}
              label="Name"
              placeholder="Your name"
              autoComplete="name"
            />
            <FormInputField
              id="form-rhf-register-email"
              name="email"
              control={form.control}
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
            />
            <FormInputField
              id="form-rhf-register-password"
              name="password"
              control={form.control}
              label="Password"
              type="password"
              autoComplete="new-password"
            />
            <Button type="submit" className="w-full" disabled={isPendingRegister}>
              Sign up
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Login
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
