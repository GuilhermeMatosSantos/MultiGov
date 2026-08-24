import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  listarAvisos,
  criarAviso,
  atualizarAviso,
  removerAviso,
  adicionarComentarioAviso,
  definirConfirmacaoAviso,
  removerConfirmacaoAviso,
} from "../lib/avisosRepository";
import type { Aviso } from "../types";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { Timeline } from "../components/Timeline";
import { useIdentidade } from "../lib/session";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { distinctOptions } from "../components/ModulePage";
import { ModuleHelp } from "../components/ModuleHelp";
import { toast } from "../lib/toast";
import { confirmDialog } from "../lib/confirm";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { Breadcrumb } from "../components/Breadcrumb";
import { registarAtividade } from "../lib/atividade";
import { usePagination } from "../lib/usePagination";
import { podeEscrever } from "../lib/permissoes";

const estados: Aviso["estado"][] = ["Planeado", "Em preparação", "Aberto", "Fechado"];

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
  const podeEditar = podeEscrever(identidade.nivel, "coordenacao-avisos");
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [activeId, setActiveId] = useState<string | null>(deepLinkId ?? null);
  const [vista, setVista] = useState<"lista" | "calendario">("lista");
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [programaFiltro, setProgramaFiltro] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Aviso | null>(null);
  const [formData, setFormData] = useState(emptyForm());
  const [novaEntidade, setNovaEntidade] = useState("");
  const [novoComentario, setNovoComentario] = useState("");

  async function refresh() {
    const lista = await listarAvisos();
    setAvisos(lista);
    if (activeId === null && lista.length > 0) setActiveId(lista[0].id);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Sobreposição temática/territorial entre avisos de fundos diferentes é um
  // "gap de política" clássico (fragmentação setorial) — sinalizar antes de
  // publicar, não descobrir depois de já estarem ambos no terreno.
  function avisosSobrepostos(alvo: Aviso): Aviso[] {
    const territoriosAlvo = alvo.entidadesEnvolvidas
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const inicioAlvo = alvo.dataPrevistaAbertura;
    const fimAlvo = alvo.dataPrevistaFecho || "9999-12-31";
    return avisos.filter((a) => {
      if (a.id === alvo.id || a.estado === "Fechado") return false;
      const mesmoPrograma = a.programa && a.programa === alvo.programa;
      const territoriosA = a.entidadesEnvolvidas.split(",").map((t) => t.trim().toLowerCase());
      const territorioComum = territoriosA.some((t) => t && territoriosAlvo.includes(t));
      if (!mesmoPrograma && !territorioComum) return false;
      const inicioA = a.dataPrevistaAbertura;
      const fimA = a.dataPrevistaFecho || "9999-12-31";
      if (!inicioAlvo || !inicioA) return mesmoPrograma || territorioComum;
      return inicioAlvo <= fimA && inicioA <= fimAlvo;
    });
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await atualizarAviso(editing.id, formData);
        toast("Alterações guardadas.");
        registarAtividade("editar", "Coordenação de Avisos", formData.titulo);
      } else {
        const criado = await criarAviso(formData);
        setActiveId(criado.id);
        toast("Aviso criado.");
        registarAtividade("criar", "Coordenação de Avisos", formData.titulo);
      }
      await refresh();
      setFormOpen(false);
    } catch (err) {
      console.error(err);
      toast("Erro ao guardar. Tenta novamente.", "error");
    }
  }

  async function handleDelete(a: Aviso) {
    const ok = await confirmDialog(`Remover o aviso "${a.titulo}"? Esta ação não pode ser desfeita.`, "Remover");
    if (!ok) return;
    try {
      await removerAviso(a.id);
      if (activeId === a.id) setActiveId(null);
      await refresh();
      toast("Aviso removido.", "info");
      registarAtividade("remover", "Coordenação de Avisos", a.titulo);
    } catch (err) {
      console.error(err);
      toast("Erro ao remover. Tenta novamente.", "error");
    }
  }

  async function toggleConfirmacao(a: Aviso, entidade: string) {
    const atual = a.confirmacoes.find((c) => c.entidade === entidade);
    try {
      await definirConfirmacaoAviso(a.id, entidade, !(atual?.confirmado ?? false));
      await refresh();
    } catch (err) {
      console.error(err);
      toast("Erro ao atualizar confirmação. Tenta novamente.", "error");
    }
  }

  async function addEntidade(a: Aviso) {
    if (!novaEntidade.trim()) return;
    try {
      await definirConfirmacaoAviso(a.id, novaEntidade, false);
      setNovaEntidade("");
      await refresh();
    } catch (err) {
      console.error(err);
      toast("Erro ao adicionar entidade. Tenta novamente.", "error");
    }
  }

  async function removeEntidade(a: Aviso, entidade: string) {
    try {
      await removerConfirmacaoAviso(a.id, entidade);
      await refresh();
    } catch (err) {
      console.error(err);
      toast("Erro ao remover entidade. Tenta novamente.", "error");
    }
  }

  async function addComentario(e: React.FormEvent, a: Aviso) {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    try {
      await adicionarComentarioAviso(a.id, {
        autor: identidade.nome || "Eu",
        entidade: identidade.entidade || "—",
        texto: novoComentario,
        data: new Date().toISOString().slice(0, 10),
      });
      setNovoComentario("");
      await refresh();
    } catch (err) {
      console.error(err);
      toast("Erro ao comentar. Tenta novamente.", "error");
    }
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
          <h1>
            Espaço de coordenação de avisos
            <ModuleHelp
              titulo="Espaço de coordenação de avisos"
              oQueE="O espaço onde a Autoridade de Gestão e os Organismos Intermédios negoceiam calendário e critérios de um aviso antes de o publicarem."
              paraQueServe="Para o calendário de um aviso deixar de ser uma tabela imposta por uma pessoa e passar a ser uma proposta que cada entidade envolvida pode comentar e confirmar."
              comoUsar="Antes de criares um aviso, consulta a Memória de Projetos para veres se já houve avisos semelhantes. Adiciona as entidades que têm de se alinhar e usa as confirmações para acompanhares quem já concordou."
            />
          </h1>
          <p className="page-description">
            Autoridade de Gestão e Organismos Intermédios negoceiam calendário e critérios: não é só uma
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
          {podeEditar ? (
            <button className="btn btn-primary" onClick={openCreate}>
              + Novo aviso
            </button>
          ) : (
            <span
              className="badge badge-neutral"
              title="O teu perfil tem acesso de leitura à criação de avisos. Podes sempre comentar e confirmar"
            >
              🔒 Acesso de leitura
            </span>
          )}
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
                    {avisosSobrepostos(active).length > 0 && (
                      <p className="field-hint">
                        ⚠ Possível sobreposição temática/territorial com:{" "}
                        {avisosSobrepostos(active).map((a) => a.titulo).join(", ")}
                      </p>
                    )}
                  </div>
                  {podeEditar && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost" onClick={() => openEdit(active)}>
                        ✏️ Editar
                      </button>
                      <button className="btn btn-ghost btn-danger" onClick={() => handleDelete(active)}>
                        🗑️ Remover
                      </button>
                    </div>
                  )}
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
          {!editing && (
            <p className="field-hint" style={{ marginBottom: 12 }}>
              💡 Antes de desenhar critérios de raiz, vale a pena consultar a{" "}
              <Link to="/memoria-projetos">Memória de Projetos</Link>: lições de avisos anteriores no mesmo
              território/programa raramente são reutilizadas se não forem consultadas ativamente.
            </p>
          )}
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
