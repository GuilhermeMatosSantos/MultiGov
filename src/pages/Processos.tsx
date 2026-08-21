import { useState } from "react";
import { useLocation } from "react-router-dom";
import { processosRepo, avisosRepo, notificacoesRepo, registoInformalRepo } from "../data/repos";
import { newId } from "../lib/id";
import type { Processo } from "../types";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { distinctOptions } from "../components/ModulePage";
import { toast } from "../lib/toast";
import { confirmDialog } from "../lib/confirm";
import { Breadcrumb } from "../components/Breadcrumb";
import { registarAtividade } from "../lib/atividade";
import { usePagination } from "../lib/usePagination";

const estados: Processo["estado"][] = [
  "Submetido",
  "Em análise",
  "Aprovado",
  "Em execução",
  "Concluído",
  "Indeferido",
];

function emptyForm(): Omit<Processo, "id"> {
  return {
    titulo: "",
    avisoId: "",
    entidadeResponsavel: "",
    programa: "",
    estado: "Submetido",
    dataAbertura: new Date().toISOString().slice(0, 10),
    notas: "",
  };
}

export function Processos() {
  const location = useLocation();
  const deepLinkId = (location.state as { selectId?: string } | null)?.selectId;
  const [processos, setProcessos] = useState<Processo[]>(() => processosRepo.list());
  const [activeId, setActiveId] = useState<string | null>(deepLinkId ?? processos[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [programaFiltro, setProgramaFiltro] = useState("");
  const [entidadeFiltro, setEntidadeFiltro] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Processo | null>(null);
  const [formData, setFormData] = useState<Omit<Processo, "id">>(emptyForm());

  const avisos = avisosRepo.list();
  const notificacoes = notificacoesRepo.list();
  const registos = registoInformalRepo.list();

  function refresh() {
    setProcessos(processosRepo.list());
  }

  const filtered = processos
    .filter((p) => {
      if (
        search &&
        !`${p.titulo} ${p.entidadeResponsavel} ${p.programa}`.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (estadoFiltro && p.estado !== estadoFiltro) return false;
      if (programaFiltro && p.programa !== programaFiltro) return false;
      if (entidadeFiltro && p.entidadeResponsavel !== entidadeFiltro) return false;
      return true;
    })
    .sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura));

  const { page, setPage, totalPages, paginated } = usePagination(filtered, [
    search,
    estadoFiltro,
    programaFiltro,
    entidadeFiltro,
  ]);

  const active = processos.find((p) => p.id === activeId) ?? null;
  const avisoDoProcesso = active ? avisos.find((a) => a.id === active.avisoId) : undefined;
  const notificacoesLigadas = active ? notificacoes.filter((n) => n.processoId === active.id) : [];
  const registosLigados = active ? registos.filter((r) => r.processoId === active.id) : [];

  function openCreate() {
    setEditing(null);
    setFormData(emptyForm());
    setFormOpen(true);
  }

  function openEdit(p: Processo) {
    setEditing(p);
    setFormData({ ...p });
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      processosRepo.update(editing.id, formData);
      toast("Alterações guardadas.");
      registarAtividade("editar", "Processos", formData.titulo);
    } else {
      const id = newId();
      processosRepo.create({ id, ...formData });
      setActiveId(id);
      toast("Processo criado.");
      registarAtividade("criar", "Processos", formData.titulo);
    }
    refresh();
    setFormOpen(false);
  }

  async function handleDelete(p: Processo) {
    const ok = await confirmDialog(`Remover o processo "${p.titulo}"? Esta ação não pode ser desfeita.`, "Remover");
    if (!ok) return;
    processosRepo.remove(p.id);
    refresh();
    if (activeId === p.id) setActiveId(null);
    toast("Processo removido.", "info");
    registarAtividade("remover", "Processos", p.titulo);
  }

  return (
    <div className="page">
      <Breadcrumb items={active ? [{ label: "Processos", to: "/processos" }, { label: active.titulo }] : [{ label: "Processos" }]} />
      <div className="page-header">
        <div>
          <h1>Processos e candidaturas</h1>
          <p className="page-description">
            O fio condutor entre notificações, registos informais e avisos — acompanha uma candidatura do
            início ao fim, em vez de espalhar a sua história por vários módulos separados.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Novo processo
        </button>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar processos..."
        resultCount={filtered.length}
        resultLabel="processo(s)"
        filters={[
          { label: "Estado", value: estadoFiltro, onChange: setEstadoFiltro, options: estados.map((e) => ({ value: e, label: e })) },
          { label: "Programa", value: programaFiltro, onChange: setProgramaFiltro, options: distinctOptions(processos, "programa") },
          { label: "Entidade", value: entidadeFiltro, onChange: setEntidadeFiltro, options: distinctOptions(processos, "entidadeResponsavel") },
        ]}
      />

      <div className="forum-layout">
        <div className="forum-list">
          {filtered.length === 0 && (
            <EmptyState
              message={
                processos.length === 0
                  ? "Sem processos ainda."
                  : "Nenhum processo corresponde à pesquisa ou aos filtros aplicados."
              }
            />
          )}
          {paginated.map((p) => (
            <button
              key={p.id}
              className={`forum-list-item ${activeId === p.id ? "forum-list-item-active" : ""}`}
              onClick={() => setActiveId(p.id)}
            >
              <span className={`badge badge-${p.estado.replace(/\s/g, "-").toLowerCase()}`}>{p.estado}</span>
              <div className="forum-list-item-title">{p.titulo}</div>
              <div className="feed-item-meta">
                {p.entidadeResponsavel} · {p.programa}
              </div>
            </button>
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>

        <div className="forum-thread">
          {!active && <EmptyState message="Seleciona um processo para ver o histórico completo." />}
          {active && (
            <>
              <div className="forum-thread-header">
                <div>
                  <h2>{active.titulo}</h2>
                  <div className="feed-item-meta">
                    {active.entidadeResponsavel} · {active.programa} · aberto em {active.dataAbertura}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost" onClick={() => openEdit(active)}>
                    ✏️ Editar
                  </button>
                  <button className="btn btn-ghost btn-danger" onClick={() => handleDelete(active)}>
                    🗑️ Remover
                  </button>
                </div>
              </div>

              {avisoDoProcesso && (
                <p className="page-description">
                  Aviso de origem: <strong>{avisoDoProcesso.titulo}</strong>
                </p>
              )}
              {active.notas && <p className="page-description">{active.notas}</p>}

              <div className="processo-timeline">
                <h3>Linha do tempo</h3>
                {notificacoesLigadas.length === 0 && registosLigados.length === 0 && (
                  <p className="page-description">
                    Ainda sem notificações ou notas informais ligadas a este processo. Liga-as a partir dos
                    módulos de Notificações ou Registo do Informal.
                  </p>
                )}
                {[
                  ...notificacoesLigadas.map((n) => ({
                    tipo: "Notificação",
                    titulo: n.titulo,
                    detalhe: n.descricao,
                    data: n.dataPublicacao,
                  })),
                  ...registosLigados.map((r) => ({
                    tipo: r.tipo,
                    titulo: r.resumo,
                    detalhe: `${r.participantes} · ${r.entidade}`,
                    data: r.data,
                  })),
                ]
                  .sort((a, b) => a.data.localeCompare(b.data))
                  .map((evento, idx) => (
                    <div key={idx} className="forum-message">
                      <div className="forum-message-header">
                        <strong>{evento.tipo}</strong>
                        <span className="feed-item-meta">{evento.data}</span>
                      </div>
                      <p>{evento.titulo}</p>
                      {evento.detalhe && <p className="feed-item-meta">{evento.detalhe}</p>}
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {formOpen && (
        <Modal title={editing ? "Editar processo" : "Novo processo"} onClose={() => setFormOpen(false)}>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-field form-field-full">
              <label>
                Título<span className="required">*</span>
              </label>
              <input
                required
                value={formData.titulo}
                onChange={(e) => setFormData((p) => ({ ...p, titulo: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Entidade responsável</label>
              <input
                value={formData.entidadeResponsavel}
                onChange={(e) => setFormData((p) => ({ ...p, entidadeResponsavel: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Programa</label>
              <input
                value={formData.programa}
                onChange={(e) => setFormData((p) => ({ ...p, programa: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Aviso de origem (opcional)</label>
              <select
                value={formData.avisoId}
                onChange={(e) => setFormData((p) => ({ ...p, avisoId: e.target.value }))}
              >
                <option value="">Nenhum</option>
                {avisos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.titulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData((p) => ({ ...p, estado: e.target.value as Processo["estado"] }))}
              >
                {estados.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Data de abertura</label>
              <input
                type="date"
                value={formData.dataAbertura}
                onChange={(e) => setFormData((p) => ({ ...p, dataAbertura: e.target.value }))}
              />
            </div>
            <div className="form-field form-field-full">
              <label>Notas</label>
              <textarea
                rows={3}
                value={formData.notas}
                onChange={(e) => setFormData((p) => ({ ...p, notas: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
