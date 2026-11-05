"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, MapPin, RefreshCw, Save, Search, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";

type ZoneTariff = {
  id: number;
  nom_zone: string;
  ville: string;
  zone_active: boolean;
  montant: number;
  actif: boolean;
  tarif_configure: boolean;
};

type Draft = { montant: number; actif: boolean };

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

export function DestinationPricingModule() {
  const [zones, setZones] = useState<ZoneTariff[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [canEdit, setCanEdit] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  async function loadZones() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/admin/destination-tariffs", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Impossible de charger les zones.");
      setZones(payload.zones ?? []);
      setCanEdit(Boolean(payload.canEdit));
      setDrafts({});
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadZones();
  }, []);

  const filteredZones = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    if (!normalized) return zones;
    return zones.filter((zone) =>
      `${zone.nom_zone} ${zone.ville}`.toLocaleLowerCase("fr").includes(normalized),
    );
  }, [zones, query]);

  const groups = useMemo(() => {
    return filteredZones.reduce<Record<string, ZoneTariff[]>>((acc, zone) => {
      (acc[zone.ville] ??= []).push(zone);
      return acc;
    }, {});
  }, [filteredZones]);

  const activeCount = zones.filter((zone) => zone.actif).length;

  function getDraft(zone: ZoneTariff): Draft {
    return drafts[zone.id] ?? { montant: zone.montant, actif: zone.actif };
  }

  function updateDraft(zone: ZoneTariff, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [zone.id]: { ...getDraft(zone), ...patch },
    }));
    setSavedId(null);
    setRowErrors((current) => ({ ...current, [zone.id]: "" }));
  }

  async function saveZone(zone: ZoneTariff) {
    const draft = getDraft(zone);
    if (!Number.isSafeInteger(draft.montant) || draft.montant < 1) {
      setRowErrors((current) => ({ ...current, [zone.id]: "Saisissez un montant entier supérieur à 0." }));
      return;
    }

    setSavingId(zone.id);
    setSavedId(null);
    setRowErrors((current) => ({ ...current, [zone.id]: "" }));
    try {
      const response = await fetch("/api/admin/destination-tariffs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId: zone.id, ...draft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Enregistrement impossible.");

      setZones((current) =>
        current.map((item) =>
          item.id === zone.id
            ? { ...item, montant: payload.tarif.montant, actif: payload.tarif.actif, tarif_configure: true }
            : item,
        ),
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[zone.id];
        return next;
      });
      setSavedId(zone.id);
    } catch (error) {
      setRowErrors((current) => ({
        ...current,
        [zone.id]: error instanceof Error ? error.message : "Une erreur est survenue.",
      }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminShell
      title="Tarifs des zones"
      subtitle="Configurez le prix de chaque livraison selon sa zone de destination."
      action={
        <button
          type="button"
          onClick={() => void loadZones()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Zones configurées</p>
            <p className="mt-2 text-2xl font-bold">{zones.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Secteurs opérationnels enregistrés</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Tarifs actifs</p>
            <p className="mt-2 text-2xl font-bold">{activeCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Secteurs ouverts à la tarification</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Tarif de lancement</p>
            <p className="mt-2 text-2xl font-bold">1 000 FCFA</p>
            <p className="mt-1 text-xs text-muted-foreground">Valeur initiale par secteur</p>
          </div>
        </div>

        {!canEdit && !loading && (
          <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-warning" />
            <p>Consultation uniquement. Seul un super administrateur peut modifier les tarifs.</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Grille tarifaire par secteur</h2>
            <p className="mt-1 text-sm text-muted-foreground">Le prix dépend de la destination, sans supplément lié à la distance ni aux transferts entre coursiers.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une commune ou un secteur"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
        </div>

        {loadError && (
          <div role="alert" className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">{loadError}</div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            <LoaderCircle className="mx-auto mb-3 size-5 animate-spin" /> Chargement des zones...
          </div>
        ) : Object.keys(groups).length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Aucune zone ne correspond à cette recherche.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groups).map(([commune, communeZones]) => (
              <section key={commune} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    <h3 className="font-semibold">{commune}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{communeZones.length} secteur{communeZones.length > 1 ? "s" : ""}</span>
                </div>
                <div className="divide-y divide-border">
                  {communeZones.map((zone) => {
                    const draft = getDraft(zone);
                    const dirty = draft.montant !== zone.montant || draft.actif !== zone.actif;
                    const saving = savingId === zone.id;
                    return (
                      <div key={zone.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px_130px_120px] md:items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{zone.nom_zone}</p>
                          {!zone.zone_active && <p className="mt-1 text-xs text-warning">Secteur désactivé dans la couverture</p>}
                          {!zone.tarif_configure && <p className="mt-1 text-xs text-warning">Tarif à initialiser — valeur affichée provisoire</p>}
                        </div>
                        <label className="block">
                          <span className="mb-1 block text-[11px] text-muted-foreground">Montant (FCFA)</span>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={draft.montant}
                            disabled={!canEdit || saving}
                            onChange={(event) => updateDraft(zone, { montant: Number(event.target.value) })}
                            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                          />
                        </label>
                        <div className="flex items-center justify-between gap-3 md:block">
                          <span className="text-[11px] text-muted-foreground md:mb-1 md:block">Tarif actif</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={draft.actif}
                            disabled={!canEdit || saving}
                            onClick={() => updateDraft(zone, { actif: !draft.actif })}
                            className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${draft.actif ? "bg-primary" : "bg-muted"}`}
                          >
                            <span className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${draft.actif ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                          <span className="sr-only">{draft.actif ? "Actif" : "Inactif"}</span>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          {savedId === zone.id && !dirty && <span className="text-xs font-medium text-success"><Check className="mr-1 inline size-3.5" /> Enregistré</span>}
                          <button
                            type="button"
                            onClick={() => void saveZone(zone)}
                            disabled={!canEdit || !dirty || saving}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {saving ? <LoaderCircle className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                            Enregistrer
                          </button>
                        </div>
                        {rowErrors[zone.id] && <p role="alert" className="text-xs text-danger md:col-span-4">{rowErrors[zone.id]}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
