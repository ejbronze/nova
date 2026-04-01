"use client";

"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/components/shared/AuthGate";

const navItems = [
  { href: "/", label: "Home", activeClass: "bg-nova-text text-white" },
  { href: "/money", label: "💰 Money", activeClass: "bg-money text-white" },
  { href: "/health", label: "🌿 Health", activeClass: "bg-health text-white" },
  { href: "/life", label: "🗂 Life", activeClass: "bg-life text-white" },
];

export function Nav() {
  const pathname = usePathname();
  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateLabel = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

  return (
    <nav className="sticky top-0 z-50 flex items-center gap-2 px-6 h-14 bg-theme-nav-bg border-b border-theme-nav-border" style={{ color: "var(--theme-nav-text)" }}>
      <Link href="/" className="flex items-center gap-2 mr-4">
        <Image src="/logo.svg" alt="Nova" width={28} height={28} className="rounded-lg" />
        <span className="font-serif text-xl tracking-tight">Nova<span className="text-money">.</span></span>
      </Link>

      {navItems.map((item) => {
        const isActive = item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all",
              isActive ? item.activeClass : "hover:bg-black/5"
            )}
            style={isActive ? undefined : { color: "var(--theme-nav-text)", opacity: 0.7 }}
          >
            {item.label}
          </Link>
        );
      })}

      <div className="flex-1" />
      <span className="text-xs mr-3" style={{ color: "var(--theme-nav-text)", opacity: 0.5 }}>{dateLabel}</span>
      <Link
        href="/settings"
        className={cn("px-3 py-1.5 rounded-full text-[13px] font-medium transition-all",
          pathname === "/settings" ? "bg-theme-accent text-theme-accent-text" : "hover:bg-black/5"
        )}
        style={pathname === "/settings" ? undefined : { color: "var(--theme-nav-text)", opacity: 0.7 }}
      >
        ⚙️
      </Link>
      <button
        onClick={signOut}
        className="ml-1 px-3 py-1.5 rounded-full text-[13px] font-medium hover:bg-black/5 transition-all"
        style={{ color: "var(--theme-nav-text)", opacity: 0.6 }}
        title="Sign out"
      >
        ↩
      </button>
    </nav>
  );
}
