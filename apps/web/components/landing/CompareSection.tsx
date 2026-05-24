const COMPETITORS = [
  "Excel / manual",
  "CRM genérico",
  "Kobra",
  "CollectAI",
  "Salesforce",
  "HubSpot",
  "CobraAI"
];

const DIMENSIONS = [
  "Score IA por deuda",
  "Automatización workflows",
  "Omnicanal LATAM",
  "Voz IA",
  "Paquetes pre-config",
  "Compliance horarios",
  "ROI medible"
];

/** true = full, "partial" = limited, false = no */
const MATRIX: Record<string, (boolean | "partial")[]> = {
  "Excel / manual": [false, false, "partial", false, false, false, false],
  "CRM genérico": ["partial", "partial", "partial", false, false, false, "partial"],
  Kobra: [false, "partial", true, false, false, true, "partial"],
  CollectAI: [true, true, "partial", "partial", false, "partial", true],
  Salesforce: ["partial", "partial", "partial", false, false, "partial", "partial"],
  HubSpot: [false, "partial", "partial", false, false, false, "partial"],
  CobraAI: [true, true, true, true, true, true, true]
};

function Cell({ value }: { value: boolean | "partial" }): React.ReactElement {
  if (value === true) {
    return <span className="l-check">✓</span>;
  }
  if (value === "partial") {
    return <span className="text-[#EF9F27]">~</span>;
  }
  return <span className="l-cross">—</span>;
}

export function CompareTable(): React.ReactElement {
  return (
    <table className="l-compare-table">
      <thead>
        <tr>
          <th>Dimensión</th>
          {COMPETITORS.map((name) => (
            <th
              className={name === "CobraAI" ? "l-highlight-col" : undefined}
              key={name}
            >
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {DIMENSIONS.map((dimension, rowIndex) => (
          <tr key={dimension}>
            <td>{dimension}</td>
            {COMPETITORS.map((competitor) => (
              <td
                className={competitor === "CobraAI" ? "l-highlight-col" : undefined}
                key={`${dimension}-${competitor}`}
              >
                <Cell value={MATRIX[competitor]?.[rowIndex] ?? false} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CompareSection(): React.ReactElement {
  return (
    <section className="l-section l-container" id="compare">
      <div className="l-reveal text-center">
        <p className="l-eyebrow">Comparativa</p>
        <h2 className="l-display mt-3 text-4xl md:text-5xl">
          Por qué
          <em className="l-accent text-[#D85A30]"> CobraAI</em>
        </h2>
      </div>
      <div className="l-compare-wrap l-reveal l-delay-2 mt-10">
        <CompareTable />
      </div>
    </section>
  );
}
