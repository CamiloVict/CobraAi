const COUNTRIES = ["Colombia", "México", "Perú", "Chile"];
const ERPS = ["SAP", "Siigo", "Odoo", "Helisa", "API REST"];
const GATEWAYS = ["Wompi", "Mercado Pago", "Stripe", "PayU"];

export function ComplianceSection(): React.ReactElement {
  return (
    <section className="l-section l-container" id="compliance">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="l-reveal">
          <p className="l-eyebrow">Compliance LATAM</p>
          <h2 className="l-display mt-3 text-4xl md:text-5xl">
            Cobrar bien
            <em className="l-accent text-[#1D9E75]"> también es cobrar más</em>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#9a9088] md:text-base">
            Horarios de contacto, consentimientos por canal, auditoría de cada
            ejecución y trazabilidad por tenant. CobraAI está diseñado para equipos
            que no pueden permitirse multas ni reputación dañada.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <ComplianceList
            delay="l-delay-1"
            items={COUNTRIES}
            title="Países"
          />
          <ComplianceList delay="l-delay-2" items={ERPS} title="ERPs" />
          <ComplianceList
            delay="l-delay-3"
            items={GATEWAYS}
            title="Pasarelas"
          />
        </div>
      </div>
    </section>
  );
}

function ComplianceList({
  title,
  items,
  delay
}: {
  title: string;
  items: string[];
  delay: string;
}): React.ReactElement {
  return (
    <article className={`l-card l-reveal ${delay}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#EF9F27]">
        {title}
      </h3>
      <ul className="mt-3 space-y-1.5 text-sm text-[#9a9088]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
