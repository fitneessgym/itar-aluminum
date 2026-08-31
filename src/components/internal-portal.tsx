import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { signIn } from "@/lib/auth/client";
import { getEmployeeProfile, type EmployeeRole } from "@/lib/auth/employee-auth";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

const ROLE_LABEL: Record<EmployeeRole, string> = {
  manager: "المدير",
  warehouse: "المستودع",
  production: "الإنتاج",
  engineer: "الهندسة",
  technician: "الفني",
  delivery: "التوصيل",
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="internal-portal min-h-dvh px-4 py-6 text-fg sm:px-6">
      <div className="portal-shell mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl items-center justify-center">
        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="portal-brand">
      <div className="portal-logo">ALI</div>
      <div>
        <div className="portal-company">العملاق للزجاج والألمنيوم</div>
        <div className="portal-system">البوابة الداخلية للموظفين والإدارة</div>
      </div>
    </div>
  );
}

export function InternalPortalHome() {
  return (
    <Shell>
      <div className="portal-topline">
        <Brand />
        <span className="portal-status"><i /> النظام الداخلي</span>
      </div>

      <section className="portal-hero">
        <div className="portal-hero-copy">
          <span className="portal-kicker">ALI · INTERNAL WORKSPACE</span>
          <h1>بوابة العمل<br /><span>والإدارة</span></h1>
          <p>الوصول إلى أنظمة الشركة من مكان واحد، مع صلاحيات مستقلة لكل موظف وقسم.</p>
          <div className="portal-meta-row">
            <span>آمن</span><span>مخصص</span><span>مباشر</span>
          </div>
        </div>
        <div className="portal-hero-panel">
          <div className="panel-orb orb-a" /><div className="panel-orb orb-b" />
          <div className="panel-grid" />
          <div className="panel-center"><b>G</b><span>GIANT</span><small>Glass & Aluminum</small></div>
          <div className="panel-chip chip-one">ADMIN</div>
          <div className="panel-chip chip-two">WORKFORCE</div>
        </div>
      </section>

      <div className="portal-choice-grid">
        <PortalCard title="دخول المدير" subtitle="لوحة الإدارة الكاملة والصلاحيات العليا" href="/portal/manager" accent icon="◆" label="MANAGEMENT" />
        <PortalCard title="دخول الموظفين" subtitle="المستودع · الإنتاج · الهندسة · الفني · التوصيل" href="/portal/employee" icon="◈" label="WORKFORCE" />
      </div>

      <div className="portal-footer-row">
        <div className="portal-footer-note"><span /> يتم تسجيل الدخول والتحقق من الصلاحيات قبل الوصول للنظام.</div>
        <Link to="/" className="portal-client-link">موقع العملاء ↗</Link>
      </div>
    </Shell>
  );
}

function PortalCard({ title, subtitle, href, accent = false, icon, label }: { title: string; subtitle: string; href: "/portal/manager" | "/portal/employee"; accent?: boolean; icon: string; label: string }) {
  return (
    <Link to={href} className={`portal-choice ${accent ? "is-manager" : ""}`}>
      <div className="portal-choice-top"><span className="portal-choice-label">{label}</span><span className="portal-arrow">↗</span></div>
      <div className="portal-choice-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div className="portal-choice-bottom"><span>الدخول إلى النظام</span><span className="portal-line" /></div>
    </Link>
  );
}

function LoginBox({ managerOnly }: { managerOnly: boolean }) {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [username, setUsername] = useState(managerOnly ? "manager" : "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isPending || !user?.role) return;
    if ((managerOnly && user.role === "manager") || (!managerOnly && user.role !== "manager")) {
      void navigate({ to: "/app" });
    }
  }, [isPending, user?.role, managerOnly, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const normalized = username.trim().toLowerCase();
      if (!normalized) throw new Error("أدخل اسم المستخدم");
      const email = `${normalized}@ali.local`;
      await signIn(email, password);
      const profile = await getEmployeeProfile();
      if (!profile || !profile.active) throw new Error("الحساب غير مفعل");
      if (managerOnly && profile.role !== "manager") throw new Error("هذه البوابة مخصصة للمدير فقط");
      if (!managerOnly && profile.role === "manager") throw new Error("حساب المدير يستخدم بوابة المدير");
      await navigate({ to: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-lg">
        <div className="portal-topline"><Brand /><Link to="/portal" className="portal-back">البوابة الرئيسية ←</Link></div>
        <div className="portal-login-card">
          <div className="portal-login-head">
            <span className="portal-kicker">{managerOnly ? "MANAGEMENT ACCESS" : "WORKFORCE ACCESS"}</span>
            <div className="portal-login-icon">{managerOnly ? "◆" : "◈"}</div>
          </div>
          <h1>{managerOnly ? "دخول المدير" : "دخول الموظفين"}</h1>
          <p>{managerOnly ? "الوصول الإداري الكامل للنظام." : "استخدم اسم المستخدم وكلمة المرور المحددين من الإدارة."}</p>
          <form onSubmit={submit} className="portal-login-form">
            <label><span>اسم المستخدم</span><input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required placeholder={managerOnly ? "manager" : "username"} /></label>
            <label><span>كلمة المرور</span><div className="portal-password"><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? "إخفاء" : "إظهار"}</button></div></label>
            {error ? <div className="portal-error">{error}</div> : null}
            <button className="portal-submit" disabled={busy}>{busy ? "جارٍ التحقق…" : "دخول آمن ↗"}</button>
          </form>
          <div className="portal-secure-note"><i /> اتصال داخلي محمي · صلاحيات مخصصة</div>
        </div>
      </div>
    </Shell>
  );
}

export function ManagerLogin() { return <LoginBox managerOnly />; }
export function EmployeeLogin() { return <LoginBox managerOnly={false} />; }
export { ROLE_LABEL };
