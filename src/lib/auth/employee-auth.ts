import { createServerFn } from "@tanstack/react-start";

export type EmployeeRole =
  | "manager"
  | "warehouse"
  | "production"
  | "engineer"
  | "technician"
  | "delivery";

export const ROLE_LABEL: Record<EmployeeRole, string> = {
  manager: "مدير",
  warehouse: "مستودع",
  production: "إنتاج",
  engineer: "مهندس",
  technician: "فني",
  delivery: "توصيل",
};

/** Fixed employee usernames. Passwords are seeded server-side and never shipped to the browser. */
export const EMPLOYEE_USERNAMES = [
  "manager",
  "warehouse",
  "production",
  "engineer",
  "technician",
  "delivery",
] as const;

export type EmployeeProfile = {
  userId: string;
  username: string;
  role: EmployeeRole;
  active: boolean;
};

export const getEmployeeProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmployeeProfile | null> => {
    const { employeeAccountsReady } = await import("./server");
    await employeeAccountsReady;
    const { getSessionUser } = await import("./verify.server");
    const user = await getSessionUser();
    if (!user) return null;
    const { getSql } = await import("../db");
    const sql = await getSql();
    const rows = await sql.query<EmployeeProfile>(
      `select user_id as "userId", username, role, active
       from employee_accounts
       where user_id = $1
       limit 1`,
      [user.id],
    );
    return rows[0] ?? null;
  },
);
