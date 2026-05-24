import Link from "next/link";
import { LOGIN_ROUTE } from "../../lib/routes";

export function CtaSection(): React.ReactElement {
  return (
    <section className="l-section l-container" id="cta">
      <div className="l-card l-reveal mx-auto max-w-3xl border-[#D85A30]/30 bg-[#14100c] px-6 py-12 text-center md:px-10">
        <h2 className="l-display text-4xl md:text-5xl">
          Empieza a recuperar
          <em className="l-accent text-[#EF9F27]"> esta semana</em>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-[#9a9088] md:text-base">
          Importa tu cartera, aplica un paquete de reglas y deja que CobraAI
          priorice y contacte por ti.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="l-btn l-btn-primary" href={LOGIN_ROUTE}>
            Comenzar gratis
          </Link>
          <Link className="l-btn l-btn-ghost" href={LOGIN_ROUTE}>
            Solicitar demo
          </Link>
        </div>
        <p className="mt-6 text-xs text-[#9a9088]">
          Sin tarjeta de crédito · Setup en minutos · Reglas 100% editables
        </p>
      </div>
    </section>
  );
}
