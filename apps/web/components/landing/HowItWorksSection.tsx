const STEP_DELAYS = [
  "l-delay-1",
  "l-delay-2",
  "l-delay-3",
  "l-delay-4",
  "l-delay-5"
] as const;

const STEPS = [
  { num: "01", title: "Importa cartera", body: "CSV o ERP. Deudas segmentadas al instante." },
  { num: "02", title: "Score IA", body: "Priorización automática por riesgo y perfil." },
  { num: "03", title: "Aplica paquete", body: "Reglas pre-configuradas editables desde día uno." },
  { num: "04", title: "Automatiza", body: "Contactos omnicanal con compliance integrado." },
  { num: "05", title: "Recupera", body: "Pagos, promesas y escalamiento en un solo lugar." }
];

export function HowItWorksSection(): React.ReactElement {
  return (
    <section className="l-section l-container" id="how-it-works">
      <div className="l-reveal text-center">
        <p className="l-eyebrow">Cómo funciona</p>
        <h2 className="l-display mt-3 text-4xl md:text-5xl">
          De importación a
          <em className="l-accent text-[#EF9F27]"> recuperación</em>
        </h2>
      </div>
      <div className="l-steps mt-10">
        {STEPS.map((step, index) => (
          <article
            className={`l-card l-reveal ${STEP_DELAYS[index] ?? "l-delay-1"} relative z-[1]`}
            key={step.num}
          >
            <p className="l-step-num">{step.num}</p>
            <h3 className="mt-2 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-[#9a9088]">{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
