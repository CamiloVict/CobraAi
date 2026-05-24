const METRICS = [
  { value: "+38%", label: "recuperación vs. manual" },
  { value: "4.2×", label: "contactos por agente" },
  { value: "−62%", label: "DSO promedio" },
  { value: "98%", label: "cumplimiento horario" },
  { value: "3", label: "paquetes listos" },
  { value: "5", label: "canales activos" },
  { value: "12min", label: "setup inicial" },
  { value: "24/7", label: "motor de reglas" },
  { value: "0", label: "hojas de Excel" },
  { value: "∞", label: "reglas editables" }
];

export function TickerBar(): React.ReactElement {
  const items = [...METRICS, ...METRICS];

  return (
    <div aria-hidden className="l-ticker-wrap">
      <div className="l-ticker-track">
        {items.map((item, index) => (
          <span className="l-ticker-item" key={`${item.label}-${index}`}>
            <strong>{item.value}</strong>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
