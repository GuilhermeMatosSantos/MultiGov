import { useEffect, useState } from "react";
import { ModulePage, distinctOptions } from "../components/ModulePage";
import type { ColumnConfig, FieldConfig, FilterConfig } from "../components/ModulePage";
import { decisoesRepoAsync } from "../data/asyncRepos";
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
  const [decisoesAtuais, setDecisoesAtuais] = useState<Decisao[]>([]);

  useEffect(() => {
    decisoesRepoAsync.list().then(setDecisoesAtuais).catch(() => {});
  }, []);

  const filters: FilterConfig<Decisao>[] = [
    { key: "estado", label: "Estado", options: estados },
    { key: "nivel", label: "Nível", options: distinctOptions(decisoesAtuais, "nivel") },
    { key: "entidade", label: "Entidade", options: distinctOptions(decisoesAtuais, "entidade") },
  ];

  return (
    <ModulePage<Decisao>
      title="Camada de transparência e disseminação"
      description="Regista as decisões de coordenação entre níveis de governação — quem decidiu o quê, com que entidade, em que momento e com que resultado. Serve para consultar o histórico de decisões de um programa ou território e perceber como uma decisão anterior influenciou o que veio a seguir."
      ajuda={{
        oQueE: "O registo das decisões de coordenação entre níveis de governação — quem decidiu o quê, com que entidade e em que momento.",
        paraQueServe: "Para haver um histórico consultável do processo de decisão de um programa ou território, e não só do seu resultado final.",
        comoUsar: "Regista uma decisão assim que for tomada, com o nível e a entidade responsável, e volta a ela mais tarde para documentar os resultados observados.",
      }}
      repo={decisoesRepoAsync}
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
