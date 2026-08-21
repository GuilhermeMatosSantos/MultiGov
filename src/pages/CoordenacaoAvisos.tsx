import { useState } from "react";
import { useLocation } from "react-router-dom";
import { avisosRepo } from "../data/repos";
import { newId } from "../lib/id";
import type { Aviso } from "../types";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { Timeline } from "../components/Timeline";
import { useIdentidade } from "../lib/session";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { distinctOptions } from "../components/ModulePage";
import { toast } from "../lib/toast";
import { confirmDialog } from "../lib/confirm";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { Breadcrumb } from "../components/Breadcrumb";
import { registarAtividade } from "../lib/atividade";
import { usePagination } from "../lib/usePagination";

const estados: Aviso["estado"][] = ["Planeado", "Em preparação", "Aberto", "Fechado"];

// Protege contra registos guardados antes de "comentarios"/"confirmacoes"
// existirem no esquema de dados.
function normalizar(avisos: Aviso[]): Aviso[] {
  return avisos.map((a) => ({
    ...a,
    comentarios: a.comentarios ?? [],
    confirmacoes: a.confirmacoes ?? [],
  }));
}

function emptyForm(): Omit<Aviso, "id" | "comentarios" | "confirmacoes"> {
  return {
    titulo: "",
    programa: "",
    entidadeResponsavel: "",
    entidadesEnvolvidas: "",
    dataPrevistaAbertura: "",
    dataPrevistaFecho: "",
    estado: "Planeado",
    notasAlinhamento: "",
  };
}

export function CoordenacaoAvisos() {
  const location = useLocation();
  const deepLinkId = (location.state as { selectId?: string } | null)?.selectId;
  const [identidade] = useIdentidade();
  const [avisos, setAvisos] = useState<Aviso[]>(() => normalizar(avisosRepo.list()));
  const [activeId, setActiveId] = useState<string | null>(deepLinkId ?? avisos[0]?.id ?? null);
  const [vista, setVista] = useState<"lista" | "calendario">("lista");
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [programaFiltro, setProgramaFiltro] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Aviso | null>(null);
  const [formData, setFormData] = useState(emptyForm());
  const [novaEntidade, setNovaEntidade] = useState("");
  const [novoComentario, setNovoComentario] = useState("");

  function refresh() {
    setAvisos(normalizar(avisosRepo.list()));
  }

  const filtered = avisos
    .filter((a) => {
      if (search && !`${a.titulo} ${a.programa} ${a.entidadeResponsavel}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (estadoFiltro && a.estado !== estadoFiltro) return false;
      if (programaFiltro && a.programa !== programaFiltro) return false;
      return true;
    })
    .sort((a, b) => (a.dataPrevistaAbertura || "9999").localeCompare(b.dataPrevistaAbertura || "9999"));

  const { page, setPage, totalPages, paginated } = usePagination(filtered, [search, estadoFiltro, programaFiltro]);

  const active = avisos.find((a) => a.id === activeId) ?? null;

  function openCreate() {
    setEditing(null);
    setFormData(emptyForm());
    setFormOpen(true);
  }

  function openEdit(a: Aviso) {
    setEditing(a);
    setFormData({ ...a });
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      avisosRepo.update(editing.id, formData);
      toast("Alterações guardadas.");
      registarAtividade("editar", "Coordenação de Avisos", formData.titulo);
    } else {
      const id = newId();
      avisosRepo.create({ id, ...formData, comentarios: [], confirmacoes: [] });
      setActiveId(id);
      toast("Aviso criado.");
      registarAtividade("criar", "Coordenação de Avisos", formData.titulo);
    }
    refresh();
    setFormOpen(false);
  }

  async function handleDelete(a: Aviso) {
    const ok = await confirmDialog(`Remover o aviso "${a.titulo}"? Esta ação não pode ser desfeita.`, "Remover");
    if (!ok) return;
    avisosRepo.remove(a.id);
    refresh();
    if (activeId === a.id) setActiveId(null);
    toast("Aviso removido.", "info");
    registarAtividade("remover", "Coordenação de Avisos", a.titulo);
  }

  function toggleConfirmacao(a: Aviso, entidade: string) {
    const confirmacoes = a.confirmacoes.map((c) =>
      c.entidade === entidade ? { ...c, confirmado: !c.confirmado } : c
    );
    avisosRepo.update(a.id, { confirmacoes });
    refresh();
  }

  function addEntidade(a: Aviso) {
    if (!novaEntidade.trim()) return;
    avisosRepo.update(a.id, { confirmacoes: [...a.confirmacoes, { entidade: novaEntidade, confirmado: false }] });
    setNovaEntidade("");
    refresh();
  }

  function removeEntidade(a: Aviso, entidade: string) {
    avisosRepo.update(a.id, { confirmacoes: a.confirmacoes.filter((c) => c.entidade !== entidade) });
    refresh();
  }

  function addComentario(e: React.FormEvent, a: Aviso) {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    avisosRepo.update(a.id, {
      comentarios: [
        ...a.comentarios,
        {
          id: newId(),
          autor: identidade.nome || "Eu",
          entidade: identidade.entidade || "—",
          texto: novoComentario,
          data: new Date().toISOString().slice(0, 10),
        },
      ],
    });
    setNovoComentario("");
    refresh();
  }

  const confirmadas = active ? active.confirmacoes.filter((c) => c.confirmado).length : 0;

  return (
    <div className="page">
      <Breadcrumb
        items={
          active
            ? [{ label: "Coordenação de Avisos", to: "/coordenacao-avisos" }, { label: active.titulo }]
            : [{ label: "Coordenação de Avisos" }]
        }
      />
      <div className="page-header">
        <div>
          <h1>Espaço de coordenação de avisos</h1>
          <p className="page-description">
            Autoridade de Gestão e Organismos Intermédios negoceiam calendário e critérios — não é só uma
            tabela preenchida por uma pessoa, é uma proposta que cada entidade comenta e confirma.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className={`btn ${vista === "lista" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setVista("lista")}
          >
            Lista
          </button>
          <button
            className={`btn ${vista === "calendario" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setVista("calendario")}
          >
            Calendário
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            + Novo aviso
          </button>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar avisos..."
        resultCount={filtered.length}
        resultLabel="aviso(s)"
        filters={[
          { label: "Estado", value: estadoFiltro, onChange: setEstadoFiltro, options: estados.map((e) => ({ value: e, label: e })) },
          { label: "Programa", value: programaFiltro, onChange: setProgramaFiltro, options: distinctOptions(avisos, "programa") },
        ]}
      />

      {vista === "calendario" ? (
        <Timeline avisos={filtered} onSelect={(id) => { setActiveId(id); setVista("lista"); }} />
      ) : (
        <div className="forum-layout">
          <div className="forum-list">
            {filtered.length === 0 && (
              <EmptyState
                message={
                  avisos.length === 0
                    ? "Sem avisos ainda."
                    : "Nenhum aviso corresponde à pesquisa ou aos filtros aplicados."
                }
              />
            )}
            {paginated.map((a) => (
              <button
                key={a.id}
                className={`forum-list-item ${activeId === a.id ? "forum-list-item-active" : ""}`}
                onClick={() => setActiveId(a.id)}
              >
                <span className={`badge badge-${a.estado.replace(/\s/g, "-").toLowerCase()}`}>{a.estado}</span>
                <div className="forum-list-item-title">{a.titulo}</div>
                <div className="feed-item-meta">
                  {a.programa} · abre {a.dataPrevistaAbertura || "—"}
                </div>
              </button>
            ))}
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>

          <div className="forum-thread">
            {!active && <EmptyState message="Seleciona um aviso para ver a negociação." />}
            {active && (
              <>
                <div className="forum-thread-header">
                  <div>
                    <h2>{active.titulo}</h2>
                    <div className="feed-item-meta">
                      {active.programa} · {active.entidadeResponsavel} · {active.dataPrevistaAbertura || "—"} a{" "}
                      {active.dataPrevistaFecho || "—"}
                      {active.estado !== "Fechado" && active.dataPrevistaFecho && (
                        <>
                          {" "}
                          · <UrgencyBadge prazo={active.dataPrevistaFecho} />
                        </>
                      )}
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

                {active.notasAlinhamento && <p className="page-description">{active.notasAlinhamento}</p>}

                <div className="processo-timeline">
                  <h3>
                    Confirmações de alinhamento ({confirmadas}/{active.confirmacoes.length})
                  </h3>
                  {active.confirmacoes.length === 0 && (
                    <p className="page-description">Sem entidades associadas ainda.</p>
                  )}
                  <ul className="confirmacao-list">
                    {active.confirmacoes.map((c) => (
                      <li key={c.entidade} className="confirmacao-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={c.confirmado}
                            onChange={() => toggleConfirmacao(active, c.entidade)}
                          />
                          {c.entidade}
                        </label>
                        <button className="btn btn-ghost btn-danger" onClick={() => removeEntidade(active, c.entidade)}>
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="inline-add">
                    <input
                      placeholder="Nome da entidade"
                      value={novaEntidade}
                      onChange={(e) => setNovaEntidade(e.target.value)}
                    />
                    <button className="btn btn-ghost" onClick={() => addEntidade(active)}>
                      + Adicionar entidade
                    </button>
                  </div>
                </div>

                <div className="processo-timeline">
                  <h3>Negociação</h3>
                  <div className="forum-messages">
                    {active.comentarios.length === 0 && (
                      <p className="page-description">Ainda sem comentários.</p>
                    )}
                    {active.comentarios.map((m) => (
                      <div key={m.id} className="forum-message">
                        <div className="forum-message-header">
                          <strong>{m.autor}</strong>
                          <span className="feed-item-meta">
                            {m.entidade} · {m.data}
                          </span>
                        </div>
                        <p>{m.texto}</p>
                      </div>
                    ))}
                  </div>
                  <form className="forum-reply-form" onSubmit={(e) => addComentario(e, active)}>
                    <textarea
                      placeholder="Comentar a proposta de calendário/critérios..."
                      value={novoComentario}
                      onChange={(e) => setNovoComentario(e.target.value)}
                      rows={2}
                    />
                    <button type="submit" className="btn btn-primary">
                      Comentar
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {formOpen && (
        <Modal title={editing ? "Editar aviso" : "Novo aviso"} onClose={() => setFormOpen(false)}>
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
              <label>Programa(s)</label>
              <input
                value={formData.programa}
                onChange={(e) => setFormData((p) => ({ ...p, programa: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Entidade responsável</label>
              <input
                value={formData.entidadeResponsavel}
                onChange={(e) => setFormData((p) => ({ ...p, entidadeResponsavel: e.target.value }))}
              />
            </div>
            <div className="form-field form-field-full">
              <label>Entidades envolvidas</label>
              <input
                value={formData.entidadesEnvolvidas}
                onChange={(e) => setFormData((p) => ({ ...p, entidadesEnvolvidas: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Data prevista de abertura</label>
              <input
                type="date"
                value={formData.dataPrevistaAbertura}
                onChange={(e) => setFormData((p) => ({ ...p, dataPrevistaAbertura: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Data prevista de fecho</label>
              <input
                type="date"
                value={formData.dataPrevistaFecho}
                onChange={(e) => setFormData((p) => ({ ...p, dataPrevistaFecho: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData((p) => ({ ...p, estado: e.target.value as Aviso["estado"] }))}
              >
                {estados.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field form-field-full">
              <label>Notas de alinhamento</label>
              <textarea
                rows={3}
                value={formData.notasAlinhamento}
                onChange={(e) => setFormData((p) => ({ ...p, notasAlinhamento: e.target.value }))}
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
