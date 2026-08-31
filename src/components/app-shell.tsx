import { useEffect } from "react";
import {
  BookOpen,
  ClipboardCheck,
  Palette,
  Hammer,
  LayoutDashboard,
  Receipt,
  Users,
  UserRoundCheck,
  Warehouse,
  Cloud,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { EmployeeRole } from "@/lib/auth/employee-auth";
import { type View, useItar } from "@/lib/itar-store";
import { cn } from "@/lib/utils";
import { HomeView } from "./home-view";
import { StockView } from "./stock-view";
import { ShopView } from "./shop-view";
import { SalesView } from "./sales-view";
import { BooksView } from "./books-view";
import { CrewView, FieldView } from "./crew-view";
import { QualityView } from "./quality-view";
import { DesignRequestsView } from "./design-requests-view";
import { EmployeeView } from "./employee-view";
import { FilesView } from "./files-view";

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "home", label: "الرئيسية", icon: LayoutDashboard },
  { id: "stock", label: "المستودع", icon: Warehouse },
  { id: "shop", label: "الورشة", icon: Hammer },
  { id: "quality", label: "جودة", icon: ClipboardCheck },
  { id: "designs", label: "تصاميم العملاء", icon: Palette },
  { id: "sales", label: "فواتير", icon: Receipt },
  { id: "crew", label: "فريق", icon: Users },
  { id: "employees", label: "الموظفون", icon: UserRoundCheck },
  { id: "books", label: "حسابات", icon: BookOpen },
  { id: "files", label: "ملفات سحابية", icon: Cloud },
];



const ROLE_VIEWS: Record<EmployeeRole, View[]> = {
  manager: NAV.map((item) => item.id),
  warehouse: ["home", "stock"],
  production: ["home", "shop", "quality"],
  engineer: ["home", "designs", "shop", "quality"],
  technician: ["home", "crew"],
  delivery: ["home", "crew"],
};

function canView(role: EmployeeRole | null, view: View) {
  return !!role && ROLE_VIEWS[role].includes(view);
}


export function AppShell() {
  const view = useItar((s) => s.view);
  const mode = useItar((s) => s.mode);
  const hydrated = useItar((s) => s.hydrated);
  const user = useCurrentUser();
  const role = user?.role ?? null;
  const allowedNav = NAV.filter((item) => canView(role, item.id));
  const mobileNav = allowedNav.filter((item) => item.id !== "sales");

  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) useItar.getState().setHydrated(true);
    };
    void Promise.resolve(useItar.persist.rehydrate()).then(done, done);
    const t = window.setTimeout(done, 80);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="no-print hidden w-60 shrink-0 flex-col border-e border-border bg-surface md:flex">
        <Brand />
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {allowedNav.map((item) => (
            <NavBtn key={item.id} item={item} active={view === item.id} />
          ))}
        </nav>
        <p className="px-5 pb-5 text-xs leading-relaxed text-subtle">
          <Link to="/" className="hover:text-fg">
            الموقع الإلكتروني
          </Link>
          <br />
          العملاق للزجاج والألمنيوم
          <br />
          الخليل
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-sm md:px-8">
          <div className="md:hidden">
            <Brand compact />
          </div>
          <p className="hidden text-sm text-muted md:block">{role === "manager" ? "لوحة الإدارة الكاملة" : `بوابة ${role === "warehouse" ? "المستودع" : role === "production" ? "الإنتاج" : role === "engineer" ? "الهندسة" : role === "technician" ? "الفني" : role === "delivery" ? "التوصيل" : "الموظف"}`}</p>
          <div className="flex items-center gap-2">
            <AuthChip />
            {(role === "manager" || role === "technician" || role === "delivery") && (
              <button
                type="button"
                className="h-11 rounded-md px-3 text-sm ring-1 ring-border"
                onClick={() => useItar.getState().setMode(mode === "desk" ? "field" : "desk")}
              >
                {mode === "desk" ? "ميدان" : "مكتب"}
              </button>
            )}
            {role === "manager" ? (
              <button
                type="button"
                className="h-11 rounded-md px-3 text-sm text-muted ring-1 ring-border hover:text-fg"
                onClick={() => useItar.getState().resetDemo()}
              >
                تجريبي
              </button>
            ) : null}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 md:px-8 md:pb-10">
          {!hydrated ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-surface" />
              ))}
            </div>
          ) : mode === "field" && canView(role, "crew") ? (
            <FieldView />
          ) : !canView(role, view) ? (
            <HomeView />
          ) : view === "home" ? (
            <HomeView />
          ) : view === "stock" ? (
            <StockView />
          ) : view === "shop" ? (
            <ShopView />
          ) : view === "sales" ? (
            <SalesView />
          ) : view === "crew" ? (
            <CrewView />
          ) : view === "employees" ? (
            <EmployeeView />
          ) : view === "quality" ? (
            <QualityView />
          ) : view === "designs" ? (
            <DesignRequestsView />
          ) : view === "files" ? (
            <FilesView />
          ) : (
            <BooksView />
          )}
        </main>
      </div>

      {mode === "desk" ? (
        <nav className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-elevated pb-[env(safe-area-inset-bottom)] md:hidden">
          {mobileNav.map((item) => (
            <NavBtn key={item.id} item={item} active={view === item.id} stacked />
          ))}
        </nav>
      ) : null}
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", compact ? "" : "px-5 py-6")}>
      <span className="inline-flex size-9 items-center justify-center rounded-md bg-accent text-accent-fg">
        <FrameMark />
      </span>
      <div>
        <p className="font-display text-lg leading-none tracking-tight">العملاق</p>
        {compact ? null : <p className="mt-1 text-xs text-subtle">ألمنيوم · شبابيك · زجاج</p>}
      </div>
    </div>
  );
}

function FrameMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function NavBtn({
  item,
  active,
  stacked,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  stacked?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => useItar.getState().setView(item.id)}
      className={cn(
        "flex items-center gap-2 rounded-md text-sm transition-colors duration-150",
        stacked ? "min-h-14 flex-col justify-center gap-0.5 px-0.5 text-[11px]" : "h-11 px-3",
        active ? "bg-accent/10 text-accent" : "text-muted hover:bg-elevated hover:text-fg",
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {item.label}
    </button>
  );
}

function AuthChip() {
  const user = useCurrentUser();
  if (!user) return null;
  const roleLabel = user.role === "manager" ? "مدير" : user.role === "warehouse" ? "مستودع" : user.role === "production" ? "إنتاج" : user.role === "engineer" ? "مهندس" : user.role === "technician" ? "فني" : user.role === "delivery" ? "توصيل" : "…";
  return (
    <button
      type="button"
      title={`${user.username ?? ""} — ${roleLabel}`}
      className="h-11 max-w-52 truncate rounded-md px-3 text-sm text-muted ring-1 ring-border hover:text-fg"
      onClick={() => void signOut()}
    >
      {user.username ? `${user.username} · ${roleLabel} · خروج` : `خروج`}
    </button>
  );
}
