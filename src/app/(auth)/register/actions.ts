"use server";

import { createClient } from "@/lib/supabase/server";
import { AuthFormState } from "@/types/auth";
import { registerSchemaForm } from "@/validations/auth-validation";
import { flattenError } from "zod";
import { redirect } from "next/navigation";
import { INITIAL_STATE_REGISTER_FORM } from "@/constants/auth-constant";

export async function register(
  prevState: AuthFormState,
  formData: FormData | null,
) {
  if (!formData) {
    return INITIAL_STATE_REGISTER_FORM;
  }
  const validatedFields = registerSchemaForm.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: flattenError(validatedFields.error).fieldErrors,
    };
  }

  const supabase = await createClient();

  const { name, email, password } = validatedFields.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) {
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: [error.message],
      },
    };
  }

  redirect("/login");
}
