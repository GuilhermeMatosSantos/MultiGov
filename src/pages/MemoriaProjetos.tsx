import { useEffect, useState } from "react";
import { ModulePage, distinctOptions } from "../components/ModulePage";
import type { ColumnConfig, FieldConfig, FilterConfig } from "../components/ModulePage";
import { projetosRepoAsync } from "../data/asyncRepos";
import type { Projeto } from "../types";

const columns: ColumnConfig<Projeto>[] = [
  { key: "titulo", label: "Projeto" },
  { key: "territorio", label: "Território" },
  { key: "programa", label: "Programa" },
  { key: "periodo", label: "Período" },
  {
    key: "boaPratica",
    label: "Boa prática",
    render: (p) => (p.boaPratica ? <span className="badge badge-aberto">Sim</span> : "—"),
  },
];

const fields: FieldConfig<Projeto>[] = [
  { key: "titulo", label: "Título do projeto", type: "text", required: true, fullWidth: true },
  { key: "territorio", label: "Território", type: "text", required: true },
  { key: "programa", label: "Programa", type: "text" },
  { key: "periodo", label: "Período", type: "text" },
  { key: "oQueResultou", label: "O que resultou", type: "textarea", fullWidth: true },
  { key: "oQueNaoResultou", label: "O que não resultou", type: "textarea", fullWidth: true },
  {
    key: "condicoesReplicabilidade",
    label: "Condições de replicabilidade",
    type: "textarea",
    fullWidth: true,
  },
  { key: "boaPratica", label: "Marcar como boa prática a replicar", type: "checkbox" },
  { key: "fonte", label: "Fonte", type: "text", fullWidth: true },
];

export function MemoriaProjetos() {
  const [projetosAtuais, setProjetosAtuais] = useState<Projeto[]>([]);

  useEffect(() => {
    projetosRepoAsync.list().then(setProjetosAtuais).catch(() => {});
  }, []);

  const filters: FilterConfig<Projeto>[] = [
    { key: "territorio", label: "Território", options: distinctOptions(projetosAtuais, "territorio") },
    { key: "programa", label: "Programa", options: distinctOptions(projetosAtuais, "programa") },
    {
      key: "boaPratica",
      label: "Boa prática",
      options: [
        { value: "true", label: "Sim" },
        { value: "false", label: "Não" },
      ],
    },
  ];

  return (
    <ModulePage<Projeto>
      title="Memória de projetos e boas práticas"
      description="Antes de fazer, ver o que já se fez. O que resultou, o que não resultou e em que condições é replicável — não faturas, mas lições estruturadas."
      ajuda={{
        oQueE: "Um repositório do que resultou e do que não resultou em projetos e avisos anteriores, por território e programa.",
        paraQueServe: "Para as lições aprendidas deixarem de se perder quando um aviso semelhante é desenhado de raiz, sobretudo as condições que tornam uma boa prática replicável ou não noutro contexto.",
        comoUsar: "Preenche sempre \"condições de replicabilidade\", não só o resultado. É a parte que costuma faltar e que mais ajuda quem está a decidir se algo funciona no seu território.",
      }}
      repo={projetosRepoAsync}
      columns={columns}
      fields={fields}
      searchKeys={["titulo", "territorio", "programa"]}
      filters={filters}
      itemLabel={(p) => p.titulo}
      emptyItem={() => ({
        titulo: "",
        territorio: "",
        programa: "",
        periodo: "",
        oQueResultou: "",
        oQueNaoResultou: "",
        condicoesReplicabilidade: "",
        boaPratica: false,
        fonte: "",
      })}
    />
  );
}
