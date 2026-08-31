import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-elevated p-4 shadow-[var(--shadow-card)] ring-1 ring-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warn" | "danger";
}) {
  return (
    <Card>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-medium tabular tracking-tight",
          tone === "ok" && "text-ok",
          tone === "warn" && "text-warn",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export const fieldClass =
  "h-11 w-full rounded-md bg-surface px-3 text-sm text-fg ring-1 ring-border outline-none transition-colors duration-150 placeholder:text-subtle focus:ring-accent";

export function Btn({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-40",
        variant === "primary" && "bg-accent text-accent-fg",
        variant === "ghost" && "bg-surface text-fg ring-1 ring-border hover:bg-elevated",
        variant === "danger" && "bg-danger text-accent-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "ok" | "warn" | "danger" | "accent";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium",
        tone === "muted" && "bg-surface text-muted",
        tone === "ok" && "bg-ok/10 text-ok",
        tone === "warn" && "bg-warn/10 text-warn",
        tone === "danger" && "bg-danger/10 text-danger",
        tone === "accent" && "bg-accent/10 text-accent",
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-fg/40"
        aria-label="إغلاق"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-elevated p-5 shadow-[var(--shadow-card)] sm:rounded-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-fg"
          >
            إغلاق
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-surface px-4 py-10 text-center ring-1 ring-border">
      <p className="font-display text-lg text-fg">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
