"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Box,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Settings,
  Truck,
  Users,
  X,
  MapPin,
  Wallet,
  FileText,
  MessageSquare,
  Newspaper,
  ShieldCheck,
  ScrollText,
  UserRound,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  {
    section: "",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    section: "UTILISATEURS",
    items: [
      { label: "Partenaires", href: "/users?type=partners", icon: Users },
      { label: "Coursiers", href: "/couriers", icon: Truck },
      { label: "Utilisateurs", href: "/users", icon: UserRound },
    ],
  },
  {
    section: "COMMANDES & LIVRAISONS",
    items: [
      {
        label: "Toutes les commandes",
        href: "/deliveries?view=orders",
        icon: Box,
      },
      { label: "Toutes les livraisons", href: "/deliveries", icon: Box },
      {
        label: "Suivi en temps réel",
        href: "/deliveries?view=live",
        icon: MapPin,
      },
      {
        label: "Retour de colis",
        href: "/deliveries?view=returns",
        icon: Package,
        count: 3,
      },
    ],
  },
  {
    section: "BIMBIM PAY",
    items: [
      {
        label: "Transactions",
        href: "/settings?tab=transactions",
        icon: Wallet,
      },
      {
        label: "Retraits / Dépôts",
        href: "/settings?tab=wallet",
        icon: Wallet,
      },
      { label: "Factures", href: "/settings?tab=invoices", icon: FileText },
    ],
  },
  {
    section: "CONTENU & COMMUNICATION",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, count: 3 },
      {
        label: "Messages",
        href: "/notifications?view=messages",
        icon: MessageSquare,
      },
      {
        label: "Actualités",
        href: "/notifications?view=news",
        icon: Newspaper,
      },
    ],
  },
  {
    section: "PARAMÈTRES",
    items: [
      { label: "Paramètres généraux", href: "/settings", icon: Settings },
      { label: "Sécurité", href: "/settings?tab=security", icon: ShieldCheck },
      { label: "Logs système", href: "/settings?tab=logs", icon: ScrollText },
    ],
  },
];

const BIMBIM_WEBSITE_URL =
  process.env.NEXT_PUBLIC_BIMBIM_WEBSITE_URL ||
  "https://bimbim-landing-page.vercel.app";

function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="mt-7 flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
      {nav.map((group) => (
        <div key={group.section || "main"} className="space-y-1">
          {group.section && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
              {group.section}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const [base, query = ""] = item.href.split("?");
            const itemParams = new URLSearchParams(query);
            const active =
              pathname === base &&
              Array.from(itemParams.entries()).every(
                ([key, value]) => searchParams.get(key) === value,
              ) &&
              (itemParams.size > 0 ||
                Array.from(searchParams.keys()).length === 0);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active &&
                    "bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary hover:text-primary-foreground",
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-[16px]" />
                  {item.label}
                </span>
                {item.count && (
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px]",
                      active ? "bg-white/15" : "bg-danger/10 text-danger",
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function SidebarNavFallback() {
  return (
    <div className="mt-7 flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
      {nav.map((group) => (
        <div key={group.section || "main"} className="space-y-1">
          {group.section && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
              {group.section}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-[16px]" />
                  {item.label}
                </span>
                {item.count && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-danger/10 text-[10px] text-danger">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function AdminShell({
  children,
  title,
  subtitle,
  action,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [today, setToday] = useState("");

  useEffect(
    () =>
      setToday(
        new Intl.DateTimeFormat("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date()),
      ),
    [],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-3">
          <a
            href={BIMBIM_WEBSITE_URL}
            className="group flex items-center gap-3"
            aria-label="Bimbim"
          >
            <span className="flex h-10 w-[116px] items-center overflow-hidden rounded-lg">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-without-bg2-qlNlsreNIjCCrlqZNvED14ELbeLXEf.png"
                alt="bimbim"
                className="h-auto w-full object-contain"
              />
            </span>
          </a>
          <button
            className="rounded-lg p-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 lg:hidden"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <p className="mt-1 px-3 text-[10px] font-medium text-muted-foreground">
          Espace administrateur
        </p>

        <Suspense fallback={<SidebarNavFallback />}>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </Suspense>

        <div className="flex flex-col gap-2 border-t border-sidebar-border pt-4">
          <div className="rounded-xl bg-sidebar-accent p-3">
            <p className="text-xs font-semibold">Besoin d’aide ?</p>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              Contactez le support Bimbim.
            </p>
            <a
              href="mailto:support@bimbim.ci"
              className="mt-2 inline-block text-[11px] font-semibold text-primary hover:underline"
            >
              Contacter le support
            </a>
          </div>
          <a
            href={BIMBIM_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink className="size-[17px]" />
            Voir le site Bimbim
          </a>
          <div className="group relative">
            <button
              type="button"
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#D8A77C] text-xs font-semibold text-white">
                CM
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">Campbell M.</span>
                <span className="block text-xs text-muted-foreground">
                  Administrateur
                </span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
            <div className="invisible absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border bg-background p-1 opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                {loggingOut ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] lg:hidden"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 lg:hidden"
              aria-label="Ouvrir"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <div>
              <p
                className="text-xs text-muted-foreground"
                suppressHydrationWarning
              >
                {today}
              </p>
              <p className="text-sm font-semibold">Bonjour Campbell</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success sm:flex">
              <i className="size-1.5 rounded-full bg-success" />
              En ligne
            </span>
            <button
              className="relative rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                3
              </span>
            </button>
            <button
              className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              aria-label="Messages"
            >
              <MessageSquare className="size-5" />
            </button>
            {action}
            <span className="hidden h-8 w-px bg-border sm:block" />
            <div className="flex size-9 items-center justify-center rounded-full bg-[#D8A77C] text-xs font-semibold text-white">
              CM
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1480px] px-5 py-7 md:px-8 md:py-8">
          {title && (
            <div className="mb-6">
              <p
                className="mb-1 text-sm text-muted-foreground"
                suppressHydrationWarning
              >
                {today}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  link,
}: {
  title: string;
  link?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold">{title}</h2>
      {link && (
        <Link
          href={link}
          className="rounded-md text-sm font-medium text-primary transition-colors hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Voir tout <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Livrée" || status === "Disponible" || status === "Actif"
      ? "status-success"
      : status === "En attente" || status === "Hors ligne"
        ? "status-warning"
        : status === "Annulée"
          ? "status-danger"
          : "status-info";
  return (
    <span className={cn("status-badge", tone)}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
export function Avatar({
  initials,
  color = "bg-[#D8A77C]",
}: {
  initials: string;
  color?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
        color,
      )}
    >
      {initials}
    </span>
  );
}
export function MapCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "map-surface relative overflow-hidden rounded-2xl border border-border",
        compact ? "h-72" : "h-80",
      )}
    >
      <div className="map-road road-a" />
      <div className="map-road road-b" />
      <div className="map-road road-c" />
      <div className="map-zone zone-a" />
      <div className="map-zone zone-b" />
      <div className="map-label label-a">Cocody</div>
      <div className="map-label label-b">Plateau</div>
      <div className="map-label label-c">Marcory</div>
    </div>
  );
}
