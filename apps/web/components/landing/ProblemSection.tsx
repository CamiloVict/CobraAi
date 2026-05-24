const DELAYS = [
  "l-delay-1",
  "l-delay-2",
  "l-delay-3",
  "l-delay-4",
  "l-delay-5",
  "l-delay-1"
] as const;

const PROBLEMS = [
  {
    title: "Cartera sin priorizar",
    body: "Todos los deudores parecen iguales. Pierdes tiempo en cuentas de bajo impacto."
  },
  {
    title: "Contactos manuales",
    body: "WhatsApp, llamadas y emails dispersos sin trazabilidad ni secuencia."
  },
  {
    title: "Promesas incumplidas",
    body: "No hay alertas cuando un pagador rompe compromiso — el caso se enfría."
  },
  {
    title: "Compliance frágil",
    body: "Horarios, consentimientos y canales sin control centralizado."
  },
  {
    title: "Reportes tardíos",
    body: "El equipo descubre el DSO cuando ya es tarde para actuar."
  },
  {
    title: "Escalamiento reactivo",
    body: "Legal y humano entran tarde, cuando la cuenta ya está crítica."
  }
];

export function ProblemSection(): React.ReactElement {
  return (
    <section className="l-section l-container" id="problem">
      <div className="l-section-header-2col">
        <div className="l-reveal">
          <p className="l-eyebrow">El problema</p>
          <h2 className="l-display mt-3 text-4xl md:text-5xl">
            Cobrar manualmente
            <em className="l-accent text-[#D85A30]"> no escala</em>
          </h2>
        </div>
        <p className="l-reveal l-delay-1 text-sm leading-relaxed text-[#9a9088] md:text-base">
          Equipos de cartera en LATAM operan con Excel, CRM genérico y mensajes
          sueltos. El resultado: baja recuperación, alto costo por cuenta y
          riesgo regulatorio.
        </p>
      </div>
      <div className="l-grid-6">
        {PROBLEMS.map((item, index) => (
          <article
            className={`l-card l-reveal ${DELAYS[index] ?? "l-delay-1"}`}
            key={item.title}
          >
            <h3 className="font-semibold text-[#f5f0ea]">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#9a9088]">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
