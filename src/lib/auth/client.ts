import { createAuthClient } from "better-auth/react";

/** Same-origin Better Auth client used by the employee and management portal. */
export const authClient = createAuthClient({});

/** Authentication is always enabled for the production employee portal. */
export const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";

export async function signIn(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await authClient.signIn.email({
    email,
    password,
    callbackURL: "/app",
  });
  if (error) throw new Error(error.message ?? "تعذر تسجيل الدخول");
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const { error } = await authClient.signUp.email({
    name,
    email,
    password,
    callbackURL: "/app",
  });
  if (error) throw new Error(error.message ?? "تعذر إنشاء الحساب");
}

export async function signOut(): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) throw new Error(error.message ?? "تعذر تسجيل الخروج");
}
