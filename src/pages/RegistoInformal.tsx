import { ModulePage, distinctOptions } from "../components/ModulePage";
import type { ColumnConfig, FieldConfig, FilterConfig } from "../components/ModulePage";
import { registoInformalRepo, processosRepo } from "../data/repos";
import type { RegistoInformal as RegistoInformalType } from "../types";
import { useIdentidade } from "../lib/session";

const tipos: RegistoInformalType["tipo"][] = [
  "Telefonema",
  "Reunião informal",
  "Decisão informal",
  "Outro",
];

const estados: NonNullable<RegistoInformalType["estado"]>[] = ["A confirmar formalmente", "Decisório"];

export function RegistoInformal() {
  const [identidade] = useIdentidade();
  const processos = processosRepo.list();
  const registosAtuais = registoInformalRepo.list();

  function processoTitulo(processoId: string): string {
    if (!processoId) return "";
    return processos.find((p) => p.id === processoId)?.titulo ?? "";
  }

  const columns: ColumnConfig<RegistoInformalType>[] = [
    { key: "tipo", label: "Tipo" },
    {
      key: "processoAssociado",
      label: "Processo associado",
      render: (r) => processoTitulo(r.processoId) || r.processoAssociado || "—",
    },
    { key: "entidade", label: "Entidade(s)" },
    { key: "data", label: "Data" },
    {
      key: "estado",
      label: "Estado",
      render: (r) =>
        r.estado ? (
          <span className={`badge ${r.estado === "Decisório" ? "badge-alert" : "badge-neutral"}`}>
            {r.estado}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  const fields: FieldConfig<RegistoInformalType>[] = [
    { key: "tipo", label: "Tipo de interação", type: "select", options: tipos, required: true },
    {
      key: "processoId",
      label: "Ligar a um processo/candidatura (opcional)",
      type: "select",
      fullWidth: true,
      options: processos.map((p) => ({ value: p.id, label: p.titulo })),
      onValueChange: (processoId) => {
        const processo = processos.find((p) => p.id === processoId);
        if (!processo) return;
        return { processoAssociado: processo.titulo, entidade: processo.entidadeResponsavel };
      },
    },
    { key: "processoAssociado", label: "Descrição livre do processo", type: "text", fullWidth: true },
    { key: "participantes", label: "Participantes", type: "text" },
    { key: "entidade", label: "Entidade(s)", type: "text" },
    { key: "data", label: "Data", type: "date", required: true },
    { key: "resumo", label: "Resumo do que foi decidido/esclarecido", type: "textarea", fullWidth: true },
    {
      key: "estado",
      label: "Classificação para trilho de auditoria",
      type: "select",
      options: estados,
    },
    { key: "prazoRegularizacao", label: "Prazo para regularização formal (se aplicável)", type: "date" },
  ];

  const filters: FilterConfig<RegistoInformalType>[] = [
    { key: "tipo", label: "Tipo", options: tipos },
    { key: "entidade", label: "Entidade", options: distinctOptions(registosAtuais, "entidade") },
  ];

  return (
    <ModulePage<RegistoInformalType>
      title="Registo leve do informal"
      description="Transforma um telefonema ou decisão informal numa nota associada ao processo — rastreabilidade sem a burocracia do ofício ou da ata."
      repo={registoInformalRepo}
      columns={columns}
      fields={fields}
      searchKeys={["processoAssociado", "entidade", "tipo"]}
      filters={filters}
      defaultSortKey="data"
      itemLabel={(r) => r.processoAssociado || processoTitulo(r.processoId)}
      emptyItem={() => ({
        tipo: "Telefonema",
        processoAssociado: "",
        processoId: "",
        participantes: "",
        entidade: identidade.entidade,
        resumo: "",
        data: new Date().toISOString().slice(0, 10),
        estado: "A confirmar formalmente",
        prazoRegularizacao: "",
      })}
    />
  );
}
