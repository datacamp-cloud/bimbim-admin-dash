"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Package,
  RefreshCw,
  Truck,
  Users,
  CircleDollarSign,
  ArrowRight,
  Star,
  MapPinned,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { DashboardCharts, DashboardMap } from "@/components/dashboard/dashboard-visuals";
import { cn } from "@/lib/utils";

type Data = {
  counters: {
    clients: number;
    partners: number;
    livreurs: number;
    commandes: number;
    livraisons: number;
    pendingReturns: number;
    onlineLivreurs: number;
    activeCouriers: number;
  };
  wallet: {
    totalBalance: number;
  };
  revenue: { current: number; previous: number };
  orders30d: Record<string, number>;
  dailyOrders: { label: string; value: number }[];
  recentOrders: {
    id: number | string;
    statut: string;
    total: number;
    date: string;
    client: string;
    livraisons: number;
    courier?: string;
  }[];
  recentTransactions: {
    id: number | string;
    montant: number;
    type_transaction: string;
    statut: string;
    date_operation: string;
  }[];
  returns: {
    id: number | string;
    date: string;
    courier: string;
    statut: string;
  }[];
  positions: {
    id: number;
    latitude: number;
    longitude: number;
    status: string;
    courier: string;
  }[];
};

const money = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const status = (s: string) =>
  ({
    en_attente: "En attente",
    en_cours: "En cours",
    livre: "Livrée",
    retour: "Retour",
    echec: "Échec",
    terminee: "Terminée",
  })[s] ?? s;

export function DashboardOverview() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const load = async () => {
    setError("");
    try {
      const r = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      setError("Impossible de charger les données du dashboard.");
    }
  };
  useEffect(() => {
    load();
  }, []);
  if (error)
    return (
      <AdminShell title="Dashboard" subtitle="">
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-6 text-sm text-danger">
          {error}
        </div>
      </AdminShell>
    );
  if (!data)
    return (
      <AdminShell title="Dashboard" subtitle="">
        <div className="p-10 text-center text-sm text-muted-foreground">
          Chargement des données...
        </div>
      </AdminShell>
    );
  const kpis = [
    [
      "Total commandes",
      data.counters.commandes,
      Package,
      "text-primary bg-primary/10",
    ],
    [
      "Livraisons effectuées",
      data.counters.livraisons,
      CheckCircle2,
      "text-success bg-success/10",
    ],
    [
      "Partenaires actifs",
      data.counters.partners,
      Users,
      "text-info bg-info/10",
    ],
    [
      "Coursiers actifs",
      data.counters.activeCouriers,
      Truck,
      "text-warning bg-warning/10",
    ],
    [
      "bimbim Pay (Solde global)",
      money(data.wallet.totalBalance),
      CircleDollarSign,
      "text-primary bg-primary/10",
    ],
  ] as const;
  const totalCommandes = Math.max(
    data.counters.commandes ||
      Object.values(data.orders30d).reduce((sum, value) => sum + value, 0),
    1,
  );

  const repartition = Object.entries({
    terminee: "Livrées",
    en_cours: "En cours",
    en_attente: "En attente",
    annulee: "Annulées",
  }).map(([key, label]) => {
    const count = data.orders30d[key] ?? 0;
    const pct = totalCommandes > 0 ? Math.round((count / totalCommandes) * 100) : 0;
    const palette: Record<string, string> = {
      terminee: "bg-success",
      en_cours: "bg-info",
      en_attente: "bg-warning",
      annulee: "bg-danger",
    };
    return {
      label,
      color: palette[key] ?? "bg-muted",
      value: count,
      count,
      pct,
    };
  });

  const recentRows = data.recentOrders.slice(0, 5).map((order) => {
    const tone =
      order.statut === "terminee"
        ? "success"
        : order.statut === "en_cours"
          ? "warning"
          : order.statut === "en_attente"
            ? "muted"
            : "danger";
    const percent =
      order.statut === "terminee"
        ? 100
        : order.statut === "en_cours"
          ? 60
          : order.statut === "en_attente"
            ? 30
            : 0;

    return {
      id: `#BM-${String(order.id).padStart(4, "0")}`,
      date: new Date(order.date).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      deliveries: order.livraisons,
      courier: order.courier || "—",
      rating: null,
      percent,
      tone,
      orderId: order.id,
    };
  });

  const performance = [
    { label: "Temps moyen de livraison", value: "—", delta: "—" },
    { label: "Taux d'acceptation", value: "—", delta: "—" },
    { label: "Note moyenne", value: "—", delta: "—" },
    { label: "Livraisons terminées", value: String(data.counters.livraisons || 0), delta: "—" },
  ];

  const walletTransactions = data.recentTransactions.slice(0, 3).map((tx) => ({
    label:
      tx.type_transaction === "credit"
        ? "Dépôt par partenaire"
        : tx.type_transaction === "debit"
          ? "Retrait vers compte"
          : "Frais de service",
    amount: Number(tx.montant),
    date: new Date(tx.date_operation).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const trips = (data.recentOrders ?? []).slice(0, 3).map((order, index) => ({
    id: `#CR-${String(order.id).padStart(4, "0")}`,
    type: ["PICK", "SWITCH", "DROP"][index] ?? "PICK",
    deliveries: order.livraisons || 1,
    courier: order.courier || "—",
    recipient: order.client || "—",
    status: order.statut === "terminee" ? "Terminé" : order.statut === "en_cours" ? "En cours" : "À venir",
  }));

  const returnRows = (data.returns ?? []).slice(0, 3).map((item) => ({
    id: `#RT-${String(item.id).padStart(4, "0")}`,
    date: new Date(item.date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    courier: item.courier || "—",
    status: item.statut === "valide" ? "Livré" : item.statut === "en_attente" ? "En attente" : "En cours",
    tone: item.statut === "valide" ? "success" : item.statut === "en_attente" ? "muted" : "warning",
  }));

  const mapPoints = (data.positions ?? []).slice(0, 20).map((point) => ({
    ...point,
    status:
      point.status === "en_cours"
        ? "en_cours"
        : point.status === "a_venir"
          ? "a_venir"
          : point.status === "retour"
            ? "retour"
            : "terminee",
  }));

  const peakDay = data.dailyOrders.reduce<{ label: string; value: number } | null>((max, day) => {
    if (!max || day.value > max.value) return day;
    return max;
  }, null);

  const mapCounts = {
    en_cours: mapPoints.filter((point) => point.status === "en_cours").length,
    a_venir: mapPoints.filter((point) => point.status === "a_venir").length,
    terminee: mapPoints.filter((point) => point.status === "terminee").length,
    retour: mapPoints.filter((point) => point.status === "retour").length,
  };

  return (
    <AdminShell title="Dashboard" subtitle="Vue réelle des données Bimbim.">
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map(([label, value, Icon, tone]) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl",
                  tone,
                )}
              >
                <Icon className="size-4" />
              </span>
              <p className="mt-4 text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">
                {typeof value === "number"
                  ? value.toLocaleString("fr-FR")
                  : value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Répartition des commandes</h3>
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Ce mois
              </span>
            </div>
            <DashboardCharts type="donut" data={data.orders30d} total={totalCommandes} />
            <div className="mt-4 space-y-2 text-xs">
              {repartition.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", item.color)} />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span>{item.pct}%</span>
                    <span className="text-muted-foreground">→ {item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Évolution des commandes</h3>
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Cette semaine
              </span>
            </div>
            <DashboardCharts type="line" data={data.orders30d} daily={data.dailyOrders} />
            <div className="mt-2 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span>Pic visible</span>
              <span className="font-medium text-foreground">
                {peakDay ? `${peakDay.label} → ${peakDay.value} commandes` : "Aucune donnée"}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Livraisons du jour</h3>
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Aujourd'hui
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_180px] xl:grid-cols-[1fr]">
              <DashboardMap positions={mapPoints} />
              <div className="space-y-2 pt-1">
                {[
                  { label: "En cours", count: mapCounts.en_cours, color: "bg-orange-500" },
                  { label: "À venir", count: mapCounts.a_venir, color: "bg-blue-500" },
                  { label: "Terminées", count: mapCounts.terminee, color: "bg-green-500" },
                  { label: "Retours", count: mapCounts.retour, color: "bg-violet-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-block size-2.5 rounded-full", item.color)} />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.45fr_.8fr_.9fr]">
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-semibold">Commandes récentes</h3>
              <Link href="/deliveries" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Voir toutes les commandes <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/30 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">N° commande</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Livraisons</th>
                    <th className="px-4 py-3">Coursier</th>
                    <th className="px-4 py-3">Taux de livraison</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((row) => (
                    <tr key={row.orderId} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-primary">{row.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
                      <td className="px-4 py-3">{row.deliveries} livraison{row.deliveries > 1 ? "s" : ""}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {row.courier === "—"
                              ? "—"
                              : row.courier.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{row.courier || "—"}</div>
                            {row.rating && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-500">
                                <Star className="size-3 fill-current" />
                                {row.rating}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                row.tone === "success" && "bg-green-500",
                                row.tone === "warning" && "bg-amber-500",
                                row.tone === "danger" && "bg-red-500",
                              )}
                              style={{ width: `${row.percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{row.percent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Mes performances aujourd'hui</h3>
              <Link href="#" className="text-xs font-semibold text-primary">Voir plus <ArrowRight className="size-3.5 inline" /></Link>
            </div>
            <div className="space-y-3 text-sm">
              {performance.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{metric.label}</span>
                    <span className={cn("text-xs font-medium", metric.delta.startsWith("-") ? "text-red-500" : "text-green-500")}>{metric.delta}</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-xl font-bold">{metric.value}</span>
                    <Activity className="size-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-primary" />
                <h3 className="font-semibold">Bimbim Pay</h3>
              </div>
              <Link href="#" className="text-xs font-semibold text-primary">Voir plus <ArrowRight className="size-3.5 inline" /></Link>
            </div>
            <p className="text-3xl font-bold text-foreground">{money(data.wallet.totalBalance)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">+ Dépôt</button>
              <button className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold">↑ Retrait</button>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Transactions récentes</p>
              <div className="space-y-2">
                {walletTransactions.map((item, index) => {
                  const isPositive = item.amount > 0;
                  return (
                    <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.label}</div>
                        <div className="text-[11px] text-muted-foreground">{item.date}</div>
                      </div>
                      <div className={cn("flex items-center gap-1 text-sm font-semibold", isPositive ? "text-green-600" : "text-red-600")}>
                        {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                        {money(Math.abs(item.amount))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Courses en cours</h3>
              <Link href="#" className="text-xs font-semibold text-primary">Voir toutes <ArrowRight className="size-3.5 inline" /></Link>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-muted/30 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">N° course</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Livraison(s)</th>
                    <th className="px-3 py-2">Coursier</th>
                    <th className="px-3 py-2">Destinataire</th>
                    <th className="px-3 py-2">Statut</th>
                    <th className="px-3 py-2">Suivi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trips.length > 0 ? trips.map((trip) => (
                    <tr key={trip.id} className="bg-background">
                      <td className="px-3 py-2 font-medium text-primary">{trip.id}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-muted px-2 py-1 font-medium text-[10px]">{trip.type}</span>
                      </td>
                      <td className="px-3 py-2">{trip.deliveries}</td>
                      <td className="px-3 py-2">{trip.courier}</td>
                      <td className="px-3 py-2">{trip.recipient}</td>
                      <td className="px-3 py-2 text-muted-foreground">{trip.status}</td>
                      <td className="px-3 py-2">
                        <button className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">&gt;</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">Aucune course en cours.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Retour de colis</h3>
              <Link href="#" className="text-xs font-semibold text-primary">Voir toutes <ArrowRight className="size-3.5 inline" /></Link>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-muted/30 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">N° retour</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Coursier</th>
                    <th className="px-3 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {returnRows.length > 0 ? returnRows.map((row) => (
                    <tr key={row.id} className="bg-background">
                      <td className="px-3 py-2 font-medium text-primary">{row.id}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.date}</td>
                      <td className="px-3 py-2">{row.courier}</td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          "rounded-full px-2 py-1 font-medium",
                          row.tone === "warning" && "bg-orange-100 text-orange-700",
                          row.tone === "muted" && "bg-muted text-muted-foreground",
                          row.tone === "success" && "bg-green-100 text-green-700",
                        )}>{row.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">Aucun retour de colis.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Package className="size-6" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <h3 className="text-lg font-semibold">Colis retour</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Gérez les retours de colis depuis la livraison jusqu'à la réception.
                </p>
              </div>
              <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground">
                Accéder au suivi <ArrowRight className="size-4" />
              </button>
            </div>
          </section>
        </div>

        <div className="flex justify-end">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw className="size-4" />
            Actualiser
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
