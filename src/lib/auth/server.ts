/**
 * Self-hosted Better Auth for the ALI employee portal.
 *
 * Authentication is intentionally same-origin and uses email/password.
 * No external identity broker is required. Sessions are stored in the same
 * database as the application data.
 */
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { pgliteDialect } from "./pglite-dialect";

void ensureDbReady();

const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value || undefined;
};

const databaseUrl = env("DATABASE_URL");
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

const LOCAL_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];

const explicitBaseURL = env("BETTER_AUTH_URL");
const baseURL = explicitBaseURL ?? "http://localhost:8080";
const trustedOrigins = Array.from(new Set([baseURL, ...LOCAL_ORIGINS]));

const globalAuth = globalThis as typeof globalThis & {
  __aliAuthSecret__?: string;
};
const secret =
  env("BETTER_AUTH_SECRET") ??
  (globalAuth.__aliAuthSecret__ ??= randomBytes(32).toString("hex"));

export const authConfigured = true;
export const SESSION_TOKEN_COOKIE = "__Host-ali-auth.session_token";

export const auth = betterAuth({
  baseURL,
  secret,
  database,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: {
      secure: true,
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
    },
  },
  plugins: [tanstackStartCookies()],
});


const PREDEFINED_EMPLOYEES = [
  { username: "manager", email: "manager@ali.local", name: "مدير النظام", password: "ALI@2026#M", role: "manager" },
  { username: "warehouse", email: "warehouse@ali.local", name: "موظف المستودع", password: "ALI@2026#W", role: "warehouse" },
  { username: "production", email: "production@ali.local", name: "مسؤول الإنتاج", password: "ALI@2026#P", role: "production" },
  { username: "engineer", email: "engineer@ali.local", name: "المهندس", password: "ALI@2026#E", role: "engineer" },
  { username: "technician", email: "technician@ali.local", name: "الفني", password: "ALI@2026#T", role: "technician" },
  { username: "delivery", email: "delivery@ali.local", name: "مندوب التوصيل", password: "ALI@2026#D", role: "delivery" },
] as const;

async function ensurePredefinedEmployees() {
  await ensureDbReady();
  const sql = await (await import("../db")).getSql();
  for (const employee of PREDEFINED_EMPLOYEES) {
    const existing = await sql.query<{ id: string }>(
      `select id from "user" where email = $1 limit 1`,
      [employee.email],
    );
    let userId = existing[0]?.id;
    if (!userId) {
      const result = await auth.api.signUpEmail({
        body: { email: employee.email, password: employee.password, name: employee.name },
      });
      userId = result?.user?.id;
      if (!userId) throw new Error(`تعذر إنشاء حساب الموظف ${employee.username}`);
    }
    await sql.query(
      `insert into employee_accounts (user_id, username, role, active)
       values ($1, $2, $3, true)
       on conflict (user_id) do update set username = excluded.username, role = excluded.role, active = true, updated_at = current_timestamp`,
      [userId, employee.username, employee.role],
    );
  }
}

export const employeeAccountsReady = ensurePredefinedEmployees().catch((error) => {
  console.error("[auth] predefined employee bootstrap failed:", error);
  throw error;
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}

