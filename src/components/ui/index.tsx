"use client";
import React from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("bg-white border border-nova-border rounded-2xl p-5 shadow-card", className)} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-between mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("font-semibold text-nova-text", className)}>{children}</h3>;
}

const BADGE_VARIANTS = {
  money: "bg-money/10 text-money",
  health: "bg-health/10 text-health",
  life: "bg-life/10 text-life",
  danger: "bg-danger/10 text-danger",
  warning: "bg-amber-50 text-amber-600",
  muted: "bg-nova-bg text-nova-muted",
};

export function Badge({ children, variant = "muted" }: { children: React.ReactNode; variant?: keyof typeof BADGE_VARIANTS }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", BADGE_VARIANTS[variant])}>
      {children}
    </span>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-money text-white hover:bg-money/90 shadow-sm",
  outline: "border border-nova-border text-nova-text hover:bg-nova-bg",
  ghost: "text-nova-text hover:bg-nova-bg",
  danger: "bg-danger text-white hover:bg-danger/90",
};

export function Button({ children, variant = "outline", onClick, disabled, icon, className = "" }: {
  children?: React.ReactNode; variant?: keyof typeof BUTTON_VARIANTS; onClick?: () => void;
  disabled?: boolean; icon?: React.ReactNode; className?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed", BUTTON_VARIANTS[variant], className)}>
      {icon}{children}
    </button>
  );
}

export function StatCard({ label, value, sub, accent, icon, className = "" }: {
  label: string; value: string; sub?: string; accent?: "money" | "health" | "life"; icon?: React.ReactNode; className?: string;
}) {
  const colors = { money: "text-money", health: "text-health", life: "text-life" };
  return (
    <div className={cn("bg-white border border-nova-border rounded-2xl p-5 shadow-card hover:shadow-md transition-shadow", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-nova-muted">{label}</p>
        {icon && <span className="opacity-50 text-nova-muted">{icon}</span>}
      </div>
      <p className={cn("font-serif text-2xl leading-none mb-1", accent ? colors[accent] : "text-nova-text")}>{value}</p>
      {sub && <p className="text-xs text-nova-muted mt-1">{sub}</p>}
    </div>
  );
}

export function ProgressBar({ value, color = "money" }: { value: number; color?: "money" | "health" | "life" | "danger" }) {
  const colors = { money: "bg-money", health: "bg-health", life: "bg-life", danger: "bg-danger" };
  return (
    <div className="h-2 bg-nova-bg rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", colors[color])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function AlertBanner({ type, title, subtitle, className = "" }: {
  type: "danger" | "warning" | "info"; title: string; subtitle?: string; className?: string;
}) {
  const styles = { danger: "bg-danger/10 border-danger/20 text-danger", warning: "bg-amber-50 border-amber-200 text-amber-700", info: "bg-money/10 border-money/20 text-money" };
  const dots = { danger: "bg-danger", warning: "bg-amber-500", info: "bg-money" };
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border", styles[type], className)}>
      <span className={cn("w-2 h-2 rounded-full mt-1 flex-shrink-0", dots[type])} />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-xs opacity-80">{subtitle}</p>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h1 className="font-serif text-3xl text-nova-text">{title}</h1>
        {subtitle && <p className="text-nova-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-3">{emoji}</span>
      <p className="font-medium text-nova-text">{title}</p>
      {subtitle && <p className="text-sm text-nova-muted mt-1">{subtitle}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={cn("w-11 h-6 rounded-full transition-all relative flex-shrink-0", checked ? "bg-health" : "bg-nova-border")}>
      <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", checked ? "left-5" : "left-0.5")} />
    </button>
  );
}

export function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp">
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 mb-4">
            <h2 className="font-serif text-xl">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-nova-bg text-nova-muted">✕</button>
          </div>
        )}
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
