import { useEffect, useState } from "react";
import { authClient, authEnabled } from "./client";
import { getEmployeeProfile, type EmployeeRole } from "./employee-auth";

/** Normalized user shape used across the app, auth on or off. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  /** True only for the local development fallback user. */
  isDevFallback: boolean;
  role: EmployeeRole | null;
  username: string | null;
};

/**
 * Development fallback user. Production uses a real authenticated session.
 */
export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
  role: "manager",
  username: "manager",
};

/** `useCurrentUserState()` result: the user plus the session-loading flag. */
export type CurrentUserState = {
  /** The user — `null` BOTH while the session loads and when signed out. */
  user: AppUser | null;
  /** True while the session is still resolving — don't treat `user: null` as signed out yet. */
  isPending: boolean;
};

/**
 * Current user + loading state. Authenticated users come from the same-origin
 * Better Auth session at `/api/auth/get-session`.
 *
 * Protect a route by waiting out `isPending` before acting on `user` —
 * redirecting on `user: null` alone bounces signed-in visitors to sign-in on
 * every hard reload:
 *
 *   import { RedirectToSignIn } from "@/lib/auth/gates";
 *   const { user, isPending } = useCurrentUserState();
 *   if (isPending) return null;              // still resolving — don't redirect yet
 *   if (!user) return <RedirectToSignIn />;  // definitely signed out
 *
 * `authEnabled` is a module-level constant fixed at load, so the guarded hook
 * call keeps a stable hook order across every render of a given component.
 */
export function useCurrentUserState(): CurrentUserState {
  if (!authEnabled) return { user: DEV_USER, isPending: false };
  // eslint-disable-next-line react-hooks/rules-of-hooks -- authEnabled is constant for the app's lifetime
  const { data, isPending } = authClient.useSession();
  const sessionUser = data?.user;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- stable per app lifetime
  const [profile, setProfile] = useState<{ role: EmployeeRole; username: string } | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks -- stable per app lifetime
  const [profilePending, setProfilePending] = useState(Boolean(sessionUser));
  // eslint-disable-next-line react-hooks/rules-of-hooks -- stable per app lifetime
  useEffect(() => {
    let alive = true;
    if (!sessionUser) {
      setProfile(null);
      setProfilePending(false);
      return () => { alive = false; };
    }
    setProfilePending(true);
    void getEmployeeProfile()
      .then((result) => {
        if (!alive) return;
        setProfile(result ? { role: result.role, username: result.username } : null);
      })
      .catch(() => {
        if (alive) setProfile(null);
      })
      .finally(() => {
        if (alive) setProfilePending(false);
      });
    return () => { alive = false; };
  }, [sessionUser?.id]);

  const user = sessionUser
    ? {
        id: sessionUser.id,
        displayName: sessionUser.name ?? null,
        primaryEmail: sessionUser.email ?? null,
        profileImageUrl: sessionUser.image ?? null,
        isDevFallback: false,
        role: profile?.role ?? null,
        username: profile?.username ?? null,
      }
    : null;
  return { user, isPending: isPending || profilePending };
}

/**
 * Convenience view of `useCurrentUserState().user` for display (e.g.
 * `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
 * for redirects/guards use `useCurrentUserState()` and check `isPending`.
 */
export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
