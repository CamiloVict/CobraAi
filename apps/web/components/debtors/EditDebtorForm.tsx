"use client";

import { useState } from "react";
import { useUpdateDebtor } from "../../hooks/use-portfolios";

type Props = {
  debtorId: string;
  initial: {
    name: string;
    email?: string | null;
    phones: string[];
    whatsappOptIn: boolean;
  };
  onSaved?: () => void;
};

export function EditDebtorForm({
  debtorId,
  initial,
  onSaved
}: Props): React.ReactElement {
  const update = useUpdateDebtor(debtorId);
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email ?? "");
  const [phonesText, setPhonesText] = useState(initial.phones.join("\n"));
  const [whatsappOptIn, setWhatsappOptIn] = useState(initial.whatsappOptIn);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    const phones = phonesText
      .split(/[\n,;]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      await update.mutateAsync({
        name: name.trim(),
        email: email.trim() === "" ? "" : email.trim(),
        phones,
        whatsapp_opt_in: whatsappOptIn
      });
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el deudor"
      );
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Datos de contacto
      </h2>
      <p className="text-xs text-slate-500">
        El canal sugerido de cada deuda se recalcula al guardar según la
        información disponible (email, teléfono, opt-in WhatsApp).
      </p>

      <label className="block text-sm">
        <span className="text-slate-500">Nombre</span>
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          onChange={(e) => setName(e.target.value)}
          required
          type="text"
          value={name}
        />
      </label>

      <label className="block text-sm">
        <span className="text-slate-500">Email</span>
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          type="email"
          value={email}
        />
      </label>

      <label className="block text-sm">
        <span className="text-slate-500">Teléfonos (uno por línea)</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
          onChange={(e) => setPhonesText(e.target.value)}
          placeholder="+573001234567"
          rows={3}
          value={phonesText}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          checked={whatsappOptIn}
          onChange={(e) => setWhatsappOptIn(e.target.checked)}
          type="checkbox"
        />
        <span>Opt-in WhatsApp</span>
      </label>

      {error ? (
        <p className="text-sm text-[#A32D2D]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="rounded-lg bg-[#D85A30] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        disabled={update.isPending}
        type="submit"
      >
        {update.isPending ? "Guardando…" : "Guardar y recalcular canal"}
      </button>
    </form>
  );
}
