import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { topicosRepo } from "../data/repos";
import { newId } from "../lib/id";
import type { Topico } from "../types";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { getIdentidade, useIdentidade } from "../lib/session";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { distinctOptions } from "../components/ModulePage";
import { toast } from "../lib/toast";
import { confirmDialog } from "../lib/confirm";
import { Breadcrumb } from "../components/Breadcrumb";
import { registarAtividade } from "../lib/atividade";
import { usePagination } from "../lib/usePagination";
import { podeEscrever } from "../lib/permissoes";

const categorias: Topico["categoria"][] = ["CIM–CIM", "AG–AG", "CCDR–CCDR", "Boas práticas", "Outro"];
const tiposPedido: NonNullable<Topico["tipoPedido"]>[] = ["Pergunta", "Pedido de intercâmbio", "Partilha de boas práticas"];
const formatos: NonNullable<Topico["formatoIntercambio"]>[] = ["Reunião", "Visita", "Workshop", "Documento partilhado"];

export function CanalHorizontal() {
  const location = useLocation();
  const deepLinkId = (location.state as { selectId?: string } | null)?.selectId;
  const [identidade] = useIdentidade();
  const podeEditar = podeEscrever(identidade.nivel, "canal-horizontal");
  const [topicos, setTopicos] = useState<Topico[]>(() => topicosRepo.list());
  const [activeId, setActiveId] = useState<string | null>(deepLinkId ?? null);
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [entidadeFiltro, setEntidadeFiltro] = useState("");
  const [novoTopicoAberto, setNovoTopicoAberto] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [novoTopico, setNovoTopico] = useState(() => {
    const identidade = getIdentidade();
    return {
      titulo: "",
      categoria: "Boas práticas" as Topico["categoria"],
      autor: identidade.nome,
      entidade: identidade.entidade,
      tipoPedido: "Partilha de boas práticas" as NonNullable<Topico["tipoPedido"]>,
      formatoIntercambio: "Reunião" as NonNullable<Topico["formatoIntercambio"]>,
      objetivoIntercambio: "",
    };
  });
  const [novoResultado, setNovoResultado] = useState("");

  function refresh() {
    setTopicos(topicosRepo.list());
  }

  const filtered = topicos
    .filter((t) => {
      if (search && !`${t.titulo} ${t.entidade}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoriaFiltro && t.categoria !== categoriaFiltro) return false;
      if (entidadeFiltro && t.entidade !== entidadeFiltro) return false;
      return true;
    })
    .sort((a, b) => b.data.localeCompare(a.data));

  const { page, setPage, totalPages, paginated } = usePagination(filtered, [search, categoriaFiltro, entidadeFiltro]);

  const active = topicos.find((t) => t.id === activeId) ?? null;

  useEffect(() => {
    setNovoResultado(active?.resultado ?? "");
  }, [active?.id, active?.resultado]);

  function handleCreateTopico(e: React.FormEvent) {
    e.preventDefault();
    const topico: Topico = {
      id: newId(),
      titulo: novoTopico.titulo,
      categoria: novoTopico.categoria,
      autor: novoTopico.autor || "Anónimo",
      entidade: novoTopico.entidade,
      data: new Date().toISOString().slice(0, 10),
      mensagens: [],
      tipoPedido: novoTopico.tipoPedido,
      ...(novoTopico.tipoPedido === "Pedido de intercâmbio"
        ? { formatoIntercambio: novoTopico.formatoIntercambio, objetivoIntercambio: novoTopico.objetivoIntercambio }
        : {}),
    };
    topicosRepo.create(topico);
    refresh();
    setNovoTopicoAberto(false);
    setNovoTopico({
      titulo: "",
      categoria: "Boas práticas",
      autor: "",
      entidade: "",
      tipoPedido: "Partilha de boas práticas",
      formatoIntercambio: "Reunião",
      objetivoIntercambio: "",
    });
    setActiveId(topico.id);
    toast("Tópico criado.");
    registarAtividade("criar", "Canal Horizontal", topico.titulo);
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !novaMensagem.trim()) return;
    const mensagens = [
      ...active.mensagens,
      {
        id: newId(),
        autor: identidade.nome || "Eu",
        entidade: identidade.entidade || "—",
        texto: novaMensagem,
        data: new Date().toISOString().slice(0, 10),
      },
    ];
    topicosRepo.update(active.id, { mensagens });
    refresh();
    setNovaMensagem("");
  }

  function handleGuardarResultado(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    topicosRepo.update(active.id, { resultado: novoResultado });
    refresh();
    toast("Resultado do intercâmbio guardado.");
    registarAtividade("editar", "Canal Horizontal", `Resultado documentado: ${active.titulo}`);
  }

  async function handleDeleteTopico(id: string) {
    const ok = await confirmDialog("Remover este tópico e todas as mensagens? Esta ação não pode ser desfeita.", "Remover");
    if (!ok) return;
    const alvo = topicos.find((t) => t.id === id);
    topicosRepo.remove(id);
    refresh();
    if (activeId === id) setActiveId(null);
    toast("Tópico removido.", "info");
    registarAtividade("remover", "Canal Horizontal", alvo?.titulo ?? id);
  }

  return (
    <div className="page">
      <Breadcrumb
        items={
          active
            ? [{ label: "Canal Horizontal", to: "/canal-horizontal" }, { label: active.titulo }]
            : [{ label: "Canal Horizontal" }]
        }
      />
      <div className="page-header">
        <div>
          <h1>Canal horizontal entre pares</h1>
          <p className="page-description">
            Fóruns entre entidades homólogas (CIM–CIM, AG–AG) para partilha de boas práticas — a versão
            institucional e rastreável dos grupos informais que já funcionam.
          </p>
        </div>
        {podeEditar ? (
          <button className="btn btn-primary" onClick={() => setNovoTopicoAberto(true)}>
            + Novo tópico
          </button>
        ) : (
          <span className="badge badge-neutral" title="O teu perfil tem acesso de leitura a este módulo">
            🔒 Acesso de leitura
          </span>
        )}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar tópicos..."
        resultCount={filtered.length}
        resultLabel="tópico(s)"
        filters={[
          { label: "Categoria", value: categoriaFiltro, onChange: setCategoriaFiltro, options: categorias.map((c) => ({ value: c, label: c })) },
          { label: "Entidade", value: entidadeFiltro, onChange: setEntidadeFiltro, options: distinctOptions(topicos, "entidade") },
        ]}
      />

      <div className="forum-layout">
        <div className="forum-list">
          {filtered.length === 0 && (
            <EmptyState
              message={
                topicos.length === 0
                  ? "Sem tópicos ainda."
                  : "Nenhum tópico corresponde à pesquisa ou aos filtros aplicados."
              }
            />
          )}
          {paginated.map((t) => (
            <button
              key={t.id}
              className={`forum-list-item ${activeId === t.id ? "forum-list-item-active" : ""}`}
              onClick={() => setActiveId(t.id)}
            >
              <span className="feed-item-tag">{t.categoria}</span>
              {t.tipoPedido === "Pedido de intercâmbio" && (
                <span className="badge badge-info" style={{ marginLeft: 6 }}>
                  {t.resultado ? "Intercâmbio concluído" : "Pedido de intercâmbio"}
                </span>
              )}
              <div className="forum-list-item-title">{t.titulo}</div>
              <div className="feed-item-meta">
                {t.entidade} · {t.mensagens.length} mensagem(ns)
              </div>
            </button>
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>

        <div className="forum-thread">
          {!active && <EmptyState message="Seleciona um tópico para ver a conversa." />}
          {active && (
            <>
              <div className="forum-thread-header">
                <div>
                  <h2>{active.titulo}</h2>
                  <div className="feed-item-meta">
                    Criado por {active.autor} ({active.entidade}) em {active.data}
                  </div>
                  {active.tipoPedido === "Pedido de intercâmbio" && (
                    <p className="field-hint">
                      🔁 Formato: {active.formatoIntercambio}
                      {active.objetivoIntercambio && ` · Objetivo: ${active.objetivoIntercambio}`}
                    </p>
                  )}
                </div>
                {podeEditar && (
                  <button className="btn btn-ghost btn-danger" onClick={() => handleDeleteTopico(active.id)}>
                    🗑️ Remover tópico
                  </button>
                )}
              </div>

              {active.tipoPedido === "Pedido de intercâmbio" && (
                <form className="forum-reply-form" onSubmit={handleGuardarResultado} style={{ marginBottom: 16 }}>
                  <textarea
                    placeholder="Resultado documentado do intercâmbio (o que se aprendeu, o que ficou decidido)..."
                    value={novoResultado}
                    onChange={(e) => setNovoResultado(e.target.value)}
                    rows={2}
                  />
                  <button type="submit" className="btn btn-ghost">
                    Guardar resultado
                  </button>
                </form>
              )}

              <div className="forum-messages">
                {active.mensagens.length === 0 && (
                  <p className="page-description">Ainda sem respostas. Sê o primeiro a responder.</p>
                )}
                {active.mensagens.map((m) => (
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

              <form className="forum-reply-form" onSubmit={handleSendMessage}>
                <textarea
                  placeholder="Escreve uma resposta..."
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  rows={2}
                />
                <button type="submit" className="btn btn-primary">
                  Enviar
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {novoTopicoAberto && (
        <Modal title="Novo tópico" onClose={() => setNovoTopicoAberto(false)}>
          <form className="form" onSubmit={handleCreateTopico}>
            <div className="form-field form-field-full">
              <label>
                Título<span className="required">*</span>
              </label>
              <input
                required
                value={novoTopico.titulo}
                onChange={(e) => setNovoTopico((p) => ({ ...p, titulo: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Categoria</label>
              <select
                value={novoTopico.categoria}
                onChange={(e) =>
                  setNovoTopico((p) => ({ ...p, categoria: e.target.value as Topico["categoria"] }))
                }
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Entidade</label>
              <input
                value={novoTopico.entidade}
                onChange={(e) => setNovoTopico((p) => ({ ...p, entidade: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Autor</label>
              <input
                value={novoTopico.autor}
                onChange={(e) => setNovoTopico((p) => ({ ...p, autor: e.target.value }))}
              />
            </div>
            <div className="form-field form-field-full">
              <label>Tipo de pedido</label>
              <select
                value={novoTopico.tipoPedido}
                onChange={(e) =>
                  setNovoTopico((p) => ({ ...p, tipoPedido: e.target.value as NonNullable<Topico["tipoPedido"]> }))
                }
              >
                {tiposPedido.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="field-hint">
                Inspirado no modelo real TAIEX-REGIO Peer2Peer da DG REGIO — pedidos estruturados de
                intercâmbio entre pares, não só um fórum aberto.
              </span>
            </div>
            {novoTopico.tipoPedido === "Pedido de intercâmbio" && (
              <>
                <div className="form-field">
                  <label>Formato</label>
                  <select
                    value={novoTopico.formatoIntercambio}
                    onChange={(e) =>
                      setNovoTopico((p) => ({
                        ...p,
                        formatoIntercambio: e.target.value as NonNullable<Topico["formatoIntercambio"]>,
                      }))
                    }
                  >
                    {formatos.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field form-field-full">
                  <label>Objetivo do intercâmbio</label>
                  <input
                    value={novoTopico.objetivoIntercambio}
                    onChange={(e) => setNovoTopico((p) => ({ ...p, objetivoIntercambio: e.target.value }))}
                    placeholder="Ex.: perceber como o CIM do Cávado organizou o balcão único de candidaturas"
                  />
                </div>
              </>
            )}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setNovoTopicoAberto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Criar tópico
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
