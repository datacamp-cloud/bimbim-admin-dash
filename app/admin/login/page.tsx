"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error ?? "Connexion impossible.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Espace administrateur</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous avec vos accès Bimbim.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Identifiant ou email</span>
              <input
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                autoComplete="username"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="admin"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Mot de passe</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="••••••••"
                  required
                />
              </div>
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          L’accès administrateur est créé par un responsable. Aucun compte ne peut être créé depuis cette page.
        </p>
      </div>
    </main>
  );
}
