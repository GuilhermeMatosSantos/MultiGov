import { ModulePage, distinctOptions } from "../components/ModulePage";
import type { ColumnConfig, FieldConfig, FilterConfig } from "../components/ModulePage";
import { wrapSync } from "../lib/asyncRepository";
import { notificacoesRepo, processosRepo } from "../data/repos";
import type { Notificacao } from "../types";
import { useIdentidade } from "../lib/session";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { useMarkSeenOnMount, isNovo } from "../lib/lastSeen";
import { toast } from "../lib/toast";

const notificacoesRepoAsync = wrapSync(notificacoesRepo);

const tipos: Notificacao["tipo"][] = [
  "Regra",
  "Orientação técnica",
  "Aviso",
  "Prazo",
  "Alteração de plataforma",
];

export function Notificacoes() {
  const [identidade] = useIdentidade();
  const lastSeen = useMarkSeenOnMount("notificacoes");
  const processos = processosRepo.list();
  const notificacoesAtuais = notificacoesRepo.list();

  function processoTitulo(processoId: string): string {
    if (!processoId) return "";
    return processos.find((p) => p.id === processoId)?.titulo ?? "";
  }

  function relevante(n: Notificacao): boolean {
    if (!identidade.entidade) return false;
    const alvo = n.entidadesAfetadas.toLowerCase();
    return alvo.includes(identidade.entidade.toLowerCase()) || alvo.includes("todas");
  }

  const columns: ColumnConfig<Notificacao>[] = [
    {
      key: "titulo",
      label: "Título",
      render: (n) => (
        <span>
          {isNovo(n.criadoEm, lastSeen) && <span className="badge-novo">Novo</span>}
          {identidade.entidade && relevante(n) && <span className="dot-relevante" title="Relevante para a minha entidade" />}
          {n.riscoDescompromisso && (
            <span className="badge badge-danger-soft" title="Risco de descompromisso de fundos (N+3)" style={{ marginRight: 6 }}>
              ⚠ N+3
            </span>
          )}
          {n.titulo}
        </span>
      ),
    },
    { key: "tipo", label: "Tipo" },
    { key: "entidadeOrigem", label: "Origem" },
    {
      key: "processoId",
      label: "Processo associado",
      render: (n) => processoTitulo(n.processoId) || "—",
    },
    { key: "dataPublicacao", label: "Publicado em" },
    {
      key: "prazo",
      label: "Prazo",
      render: (n) => (n.prazo ? <UrgencyBadge prazo={n.prazo} /> : "—"),
    },
    {
      key: "lida",
      label: "Estado",
      render: (n) => (
        <span className={`badge ${n.lida ? "badge-neutral" : "badge-alert"}`}>
          {n.lida ? "Lida" : "Por ler"}
        </span>
      ),
    },
  ];

  const fields: FieldConfig<Notificacao>[] = [
    { key: "titulo", label: "Título", type: "text", required: true, fullWidth: true },
    { key: "tipo", label: "Tipo", type: "select", options: tipos, required: true },
    { key: "entidadeOrigem", label: "Entidade de origem", type: "text", required: true },
    { key: "entidadesAfetadas", label: "Entidades afetadas", type: "text", fullWidth: true },
    {
      key: "processoId",
      label: "Processo associado (opcional)",
      type: "select",
      fullWidth: true,
      options: processos.map((p) => ({ value: p.id, label: p.titulo })),
      onValueChange: (processoId) => {
        const processo = processos.find((p) => p.id === processoId);
        if (!processo) return;
        return { entidadeOrigem: processo.entidadeResponsavel, entidadesAfetadas: processo.programa };
      },
    },
    { key: "dataPublicacao", label: "Data de publicação", type: "date", required: true },
    { key: "prazo", label: "Prazo (se aplicável)", type: "date" },
    { key: "descricao", label: "Descrição", type: "textarea", fullWidth: true },
    { key: "lida", label: "Marcar como lida", type: "checkbox" },
    {
      key: "riscoDescompromisso",
      label: "Assinalar risco de descompromisso de fundos por atraso (regra N+3)",
      type: "checkbox",
    },
  ];

  const filters: FilterConfig<Notificacao>[] = [
    { key: "tipo", label: "Tipo", options: tipos },
    {
      key: "lida",
      label: "Estado",
      options: [
        { value: "false", label: "Por ler" },
        { value: "true", label: "Lida" },
      ],
    },
    { key: "entidadeOrigem", label: "Origem", options: distinctOptions(notificacoesAtuais, "entidadeOrigem") },
  ];

  return (
    <ModulePage<Notificacao>
      title="Feed de notificações proativas"
      description="Alertas quando muda uma orientação, regra, aviso ou prazo. O ponto azul marca as notificações relevantes para a entidade com que estás a navegar."
      repo={notificacoesRepoAsync}
      columns={columns}
      fields={fields}
      searchKeys={["titulo", "entidadeOrigem", "tipo"]}
      filters={filters}
      defaultSortKey="dataPublicacao"
      itemLabel={(n) => n.titulo}
      extraActions={(n, refresh) =>
        n.lida ? null : (
          <button
            className="btn btn-ghost btn-icon"
            title="Marcar como lida"
            aria-label={`Marcar "${n.titulo}" como lida`}
            onClick={async () => {
              await notificacoesRepoAsync.update(n.id, { lida: true });
              await refresh();
              toast("Notificação marcada como lida.");
            }}
          >
            ✓
          </button>
        )
      }
      bulkActions={(selecionados, refresh, clearSelection) => {
        const porLer = selecionados.filter((n) => !n.lida);
        if (porLer.length === 0) return null;
        return (
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await Promise.all(porLer.map((n) => notificacoesRepoAsync.update(n.id, { lida: true })));
              await refresh();
              clearSelection();
              toast(`${porLer.length} notificação(ões) marcada(s) como lida(s).`);
            }}
          >
            Marcar como lidas
          </button>
        );
      }}
      emptyItem={() => ({
        titulo: "",
        tipo: "Aviso",
        descricao: "",
        entidadeOrigem: "",
        entidadesAfetadas: "",
        dataPublicacao: new Date().toISOString().slice(0, 10),
        prazo: "",
        lida: false,
        processoId: "",
        criadoEm: new Date().toISOString(),
        riscoDescompromisso: false,
      })}
    />
  );
}
