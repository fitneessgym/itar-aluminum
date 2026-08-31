import { useEffect, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadWorkspace, saveWorkspace } from "@/lib/itar-server";
import { useItar } from "@/lib/itar-store";
import { workspaceSnapshot as snapshot } from "@/lib/workspace-backup";


export function CloudSync() {
  const { user, isPending } = useCurrentUserState();
  const ready = useRef(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    if (isPending || !user) return;
    let alive = true;
    ready.current = false;
    void loadWorkspace()
      .then((payload) => {
        if (!alive) return;
        if (payload && typeof payload === "object") {
          useItar.getState().hydrateCloud(payload as Record<string, unknown>);
        } else {
          void saveWorkspace({ data: { payload: snapshot() } });
        }
        ready.current = true;
      })
      .catch(() => {
        ready.current = true;
      });
    const unsub = useItar.subscribe(() => {
      if (!ready.current) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        void saveWorkspace({ data: { payload: snapshot() } }).catch(() => {});
      }, 800);
    });
    return () => {
      alive = false;
      window.clearTimeout(timer.current);
      unsub();
    };
  }, [user, isPending]);

  return null;
}
