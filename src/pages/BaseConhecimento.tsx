import { useEffect, useState } from "react";
import { ModulePage, distinctOptions } from "../components/ModulePage";
import type { ColumnConfig, FieldConfig, FilterConfig } from "../components/ModulePage";
import { faqRepoAsync } from "../data/asyncRepos";
import type { FAQEntry } from "../types";

const columns: ColumnConfig<FAQEntry>[] = [
  {
    key: "pergunta",
    label: "Pergunta",
    render: (f) => (
      <span>
        {f.vinculativa && (
          <span className="badge badge-info" title="Resposta oficial vinculativa" style={{ marginRight: 6 }}>
            Vinculativa
          </span>
        )}
        {f.pergunta}
      </span>
    ),
  },
  { key: "categoria", label: "Categoria" },
  { key: "programaRelacionado", label: "Programa" },
  { key: "atualizadoEm", label: "Atualizado em" },
];

const fields: FieldConfig<FAQEntry>[] = [
  { key: "pergunta", label: "Pergunta", type: "text", required: true, fullWidth: true },
  { key: "resposta", label: "Resposta / entendimento", type: "textarea", required: true, fullWidth: true },
  { key: "categoria", label: "Categoria", type: "text", required: true },
  { key: "programaRelacionado", label: "Programa relacionado", type: "text" },
  { key: "fonte", label: "Fonte do entendimento", type: "text" },
  { key: "atualizadoEm", label: "Atualizado em", type: "date" },
  { key: "tags", label: "Tags (separadas por vírgula)", type: "text", fullWidth: true },
  {
    key: "vinculativa",
    label: "Marcar como resposta oficial vinculativa (arbitragem de conflito de interpretação)",
    type: "checkbox",
  },
];

export function BaseConhecimento() {
  const [faqAtual, setFaqAtual] = useState<FAQEntry[]>([]);

  useEffect(() => {
    faqRepoAsync.list().then(setFaqAtual).catch(() => {});
  }, []);

  const filters: FilterConfig<FAQEntry>[] = [
    { key: "categoria", label: "Categoria", options: distinctOptions(faqAtual, "categoria") },
    { key: "programaRelacionado", label: "Programa", options: distinctOptions(faqAtual, "programaRelacionado") },
  ];

  return (
    <ModulePage<FAQEntry>
      title="Base de conhecimento e FAQ"
      description="Repositório pesquisável de esclarecimentos e decisões-tipo, para que a mesma dúvida tenha a mesma resposta entre técnicos e regiões."
      ajuda={{
        oQueE: "Um repositório pesquisável de esclarecimentos e decisões-tipo sobre dúvidas recorrentes.",
        paraQueServe: "Para a mesma dúvida ter sempre a mesma resposta, independentemente de quem a coloca ou em que região — evita interpretações divergentes entre técnicos e entidades.",
        comoUsar: "Marca uma resposta como \"vinculativa\" quando resolve um conflito de interpretação entre entidades, para lhe dar peso de arbitragem oficial.",
      }}
      repo={faqRepoAsync}
      columns={columns}
      fields={fields}
      searchKeys={["pergunta", "categoria", "programaRelacionado", "tags"]}
      filters={filters}
      defaultSortKey="atualizadoEm"
      itemLabel={(f) => f.pergunta}
      emptyItem={() => ({
        pergunta: "",
        resposta: "",
        categoria: "",
        programaRelacionado: "",
        fonte: "",
        atualizadoEm: new Date().toISOString().slice(0, 10),
        tags: "",
        vinculativa: false,
      })}
    />
  );
}
