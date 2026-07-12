"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { createUserWithPassword, findUserByEmail } from "@/lib/queries/users";
import { signupSchema } from "@/lib/validators";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the signup form.",
    };
  }

  const existingUser = await findUserByEmail(parsed.data.email);

  if (existingUser) {
    return {
      error: "An account with this email already exists.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await createUserWithPassword({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
  });

  revalidatePath("/login");
  redirect("/login?registered=1");
}

export async function logoutAction() {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  revalidatePath("/");
}
