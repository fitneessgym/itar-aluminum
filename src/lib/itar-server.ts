import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export const loadWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: unknown }>`
      select payload from itar_workspace where user_id = ${context.userId} limit 1
    `;
    return rows[0]?.payload ?? null;
  });

export const saveWorkspace = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ payload: z.unknown() }))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const json = JSON.stringify(data.payload ?? {});
    await sql.query(
      `insert into itar_workspace (user_id, payload, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (user_id) do update set payload = excluded.payload, updated_at = now()`,
      [context.userId, json],
    );
    return { ok: true as const };
  });
