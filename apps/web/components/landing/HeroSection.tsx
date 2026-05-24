import Link from "next/link";
import { LOGIN_ROUTE } from "../../lib/routes";

const STAT_DELAYS = ["l-delay-2", "l-delay-3", "l-delay-4"] as const;

const STATS = [
  { value: "38%", label: "Recuperación promedio" },
  { value: "4.2×", label: "Más contactos efectivos" },
  { value: "72h", label: "Time-to-value" }
];

export function HeroSection(): React.ReactElement {
  return (
    <section className="l-hero l-container">
      <div className="l-hero-grid">
        <div>
          <p className="l-eyebrow l-reveal">
            <span className="l-eyebrow-dot" />
            Cobranza inteligente LATAM
          </p>
          <h1 className="l-display l-reveal l-delay-1 mt-4 text-5xl md:text-6xl lg:text-7xl">
            Recupera más.
            <br />
            <em className="l-accent text-[#EF9F27]">Con menos fricción.</em>
          </h1>
          <p className="l-reveal l-delay-2 mt-5 max-w-xl text-base leading-relaxed text-[#9a9088] md:text-lg">
            CobraAI segmenta tu cartera, automatiza contactos omnicanal y escala
            casos críticos — con compliance local desde el día uno.
          </p>
          <div className="l-reveal l-delay-3 mt-8 flex flex-wrap gap-3">
            <Link className="l-btn l-btn-primary" href={LOGIN_ROUTE}>
              Comenzar gratis
            </Link>
            <Link className="l-btn l-btn-ghost" href={LOGIN_ROUTE}>
              Solicitar demo
            </Link>
          </div>
        </div>
        <div className="l-hero-stats">
          {STATS.map((stat, index) => (
            <div
              className={`l-card l-reveal ${STAT_DELAYS[index] ?? "l-delay-2"}`}
              key={stat.label}
            >
              <p className="l-hero-stat-value">{stat.value}</p>
              <p className="mt-1 text-xs text-[#9a9088]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
