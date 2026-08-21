import { ModulePage, distinctOptions } from "../components/ModulePage";
import type { ColumnConfig, FieldConfig, FilterConfig } from "../components/ModulePage";
import { decisoesRepo } from "../data/repos";
import type { Decisao } from "../types";

const estados: Decisao["estado"][] = ["Decidida", "Em execução", "Concluída"];

const columns: ColumnConfig<Decisao>[] = [
  { key: "titulo", label: "Título" },
  { key: "entidade", label: "Entidade" },
  { key: "nivel", label: "Nível" },
  {
    key: "estado",
    label: "Estado",
    render: (d) => <span className={`badge badge-${d.estado.replace(/\s/g, "-").toLowerCase()}`}>{d.estado}</span>,
  },
  { key: "data", label: "Data" },
];

const fields: FieldConfig<Decisao>[] = [
  { key: "titulo", label: "Título", type: "text", required: true, fullWidth: true },
  { key: "descricao", label: "Descrição", type: "textarea", fullWidth: true },
  { key: "entidade", label: "Entidade", type: "text", required: true },
  { key: "nivel", label: "Nível", type: "text" },
  { key: "estado", label: "Estado", type: "select", options: estados, required: true },
  { key: "data", label: "Data", type: "date", required: true },
  { key: "resultados", label: "Resultados / efeitos observados", type: "textarea", fullWidth: true },
];

export function Transparencia() {
  const decisoesAtuais = decisoesRepo.list();

  const filters: FilterConfig<Decisao>[] = [
    { key: "estado", label: "Estado", options: estados },
    { key: "nivel", label: "Nível", options: distinctOptions(decisoesAtuais, "nivel") },
    { key: "entidade", label: "Entidade", options: distinctOptions(decisoesAtuais, "entidade") },
  ];

  return (
    <ModulePage<Decisao>
      title="Camada de transparência e disseminação"
      description="O que está a ser decidido e executado — visibilidade da coordenação multinível e disseminação clara de resultados."
      repo={decisoesRepo}
      columns={columns}
      fields={fields}
      searchKeys={["titulo", "entidade", "nivel"]}
      filters={filters}
      defaultSortKey="data"
      itemLabel={(d) => d.titulo}
      emptyItem={() => ({
        titulo: "",
        descricao: "",
        entidade: "",
        nivel: "",
        estado: "Decidida",
        data: new Date().toISOString().slice(0, 10),
        resultados: "",
      })}
    />
  );
}
