import { ModulePage, distinctOptions } from "../components/ModulePage";
import type { ColumnConfig, FieldConfig, FilterConfig } from "../components/ModulePage";
import { indicadoresRepo } from "../data/repos";
import type { IndicadorTerritorial } from "../types";

const tiposTerritorio: IndicadorTerritorial["tipoTerritorio"][] = [
  "Município",
  "CIM",
  "Área Metropolitana",
  "Região",
];

const dimensoes: IndicadorTerritorial["dimensao"][] = [
  "Económica",
  "Social",
  "Ambiental",
  "Cultural",
  "Governação",
];

const columns: ColumnConfig<IndicadorTerritorial>[] = [
  { key: "territorio", label: "Território" },
  { key: "tipoTerritorio", label: "Tipo" },
  { key: "dimensao", label: "Dimensão" },
  { key: "indicador", label: "Indicador" },
  { key: "valor", label: "Valor", render: (i) => `${i.valor} ${i.unidade}` },
  { key: "ano", label: "Ano" },
];

const fields: FieldConfig<IndicadorTerritorial>[] = [
  { key: "territorio", label: "Território", type: "text", required: true },
  { key: "tipoTerritorio", label: "Tipo de território", type: "select", options: tiposTerritorio, required: true },
  { key: "dimensao", label: "Dimensão", type: "select", options: dimensoes, required: true },
  { key: "indicador", label: "Indicador", type: "text", required: true, fullWidth: true },
  { key: "valor", label: "Valor", type: "text", required: true },
  { key: "unidade", label: "Unidade", type: "text" },
  { key: "ano", label: "Ano", type: "text" },
  { key: "fonte", label: "Fonte", type: "text", fullWidth: true },
];

function extrairNumero(valor: string): number | null {
  const encontrado = valor.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return encontrado ? parseFloat(encontrado[0]) : null;
}

function renderGrafico(filtrados: IndicadorTerritorial[]) {
  const grupos = new Map<string, IndicadorTerritorial[]>();
  for (const i of filtrados) {
    if (extrairNumero(i.valor) === null) continue;
    const grupo = grupos.get(i.indicador) ?? [];
    grupo.push(i);
    grupos.set(i.indicador, grupo);
  }
  const gruposComparaveis = Array.from(grupos.entries()).filter(([, items]) => items.length >= 2);
  if (gruposComparaveis.length === 0) return null;

  return (
    <section className="chart-section">
      <h2>Comparação por indicador</h2>
      {gruposComparaveis.map(([indicador, items]) => {
        const valores = items.map((i) => ({ item: i, num: extrairNumero(i.valor) ?? 0 }));
        const max = Math.max(...valores.map((v) => v.num), 1);
        const ordenados = [...valores].sort((a, b) => b.num - a.num);
        return (
          <div key={indicador} className="chart-group">
            <div className="chart-group-title">{indicador}</div>
            {ordenados.map(({ item, num }) => (
              <div key={item.id} className="chart-bar-row">
                <span className="chart-bar-label" title={item.territorio}>
                  {item.territorio}
                </span>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${Math.max((num / max) * 100, 3)}%` }} />
                </div>
                <span className="chart-bar-value">
                  {item.valor} {item.unidade}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}

export function MonitorizacaoTerritorial() {
  const indicadoresAtuais = indicadoresRepo.list();

  const filters: FilterConfig<IndicadorTerritorial>[] = [
    { key: "tipoTerritorio", label: "Tipo de território", options: tiposTerritorio },
    { key: "dimensao", label: "Dimensão", options: dimensoes },
    { key: "territorio", label: "Território", options: distinctOptions(indicadoresAtuais, "territorio") },
    { key: "ano", label: "Ano", options: distinctOptions(indicadoresAtuais, "ano") },
  ];

  return (
    <ModulePage<IndicadorTerritorial>
      title="Painel de monitorização territorial"
      description="Indicadores por território cruzando dimensões económica, social, ambiental e cultural, para fundamentar decisões e comunicar resultados."
      repo={indicadoresRepo}
      columns={columns}
      fields={fields}
      searchKeys={["territorio", "indicador", "dimensao"]}
      filters={filters}
      renderAbove={renderGrafico}
      defaultSortKey="ano"
      itemLabel={(i) => `${i.territorio} — ${i.indicador}`}
      emptyItem={() => ({
        territorio: "",
        tipoTerritorio: "Município",
        dimensao: "Económica",
        indicador: "",
        valor: "",
        unidade: "",
        ano: String(new Date().getFullYear()),
        fonte: "",
      })}
    />
  );
}
