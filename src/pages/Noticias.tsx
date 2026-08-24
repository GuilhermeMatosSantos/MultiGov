import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { noticiasRepoAsync, notificacoesRepoAsync } from "../data/asyncRepos";
import type { Noticia, Notificacao } from "../types";
import { newId } from "../lib/id";
import { toast } from "../lib/toast";
import { confirmDialog } from "../lib/confirm";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { TagInput } from "../components/TagInput";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { ModuleHelp } from "../components/ModuleHelp";
import { temasDisponiveis, programasDisponiveis, territoriosDisponiveis } from "../lib/interesses";
import { useMarkSeenOnMount, isNovo } from "../lib/lastSeen";
import { ficheiroParaImagemComprimida } from "../lib/image";
import { obterPreVisualizacao } from "../lib/linkPreview";
import { registarAtividade } from "../lib/atividade";
import { usePagination } from "../lib/usePagination";
import { useIdentidade } from "../lib/session";
import { podeEscrever } from "../lib/permissoes";

const fontes: Noticia["fonte"][] = ["Comissão Europeia", "Governo / Diário da República", "Autoridade de Gestão", "Outra"];
const tipos: Noticia["tipo"][] = ["Alteração regulamentar", "Nova orientação", "Notícia", "Prazo relevante"];

const tipoInfo: Record<Noticia["tipo"], { icon: string; badgeClass: string }> = {
  "Alteração regulamentar": { icon: "📜", badgeClass: "badge-em-preparação" },
  "Nova orientação": { icon: "📢", badgeClass: "badge-info" },
  Notícia: { icon: "📰", badgeClass: "badge-neutral" },
  "Prazo relevante": { icon: "⏳", badgeClass: "badge-danger-soft" },
};

const tipoParaNotificacao: Record<Noticia["tipo"], Notificacao["tipo"]> = {
  "Alteração regulamentar": "Regra",
  "Nova orientação": "Orientação técnica",
  Notícia: "Aviso",
  "Prazo relevante": "Prazo",
};

type NoticiaForm = Omit<Noticia, "id">;

function emptyForm(): NoticiaForm {
  return {
    titulo: "",
    fonte: "Comissão Europeia",
    tipo: "Notícia",
    resumo: "",
    temas: [],
    programas: [],
    territorios: [],
    dataPublicacao: new Date().toISOString().slice(0, 10),
    dataEntradaVigor: "",
    referencia: "",
    criadoEm: new Date().toISOString(),
    imagem: "",
    processosAfetados: "",
  };
}

export function Noticias() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastSeen = useMarkSeenOnMount("noticias");
  const [identidade] = useIdentidade();
  const podeEditar = podeEscrever(identidade.nivel, "noticias");
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("q") ?? "");
  const [fonteFiltro, setFonteFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Noticia | null>(null);
  const [formData, setFormData] = useState<NoticiaForm>(emptyForm());
  const [imagemProcessando, setImagemProcessando] = useState(false);
  const [preVisualizando, setPreVisualizando] = useState(false);
  const [sugestoes, setSugestoes] = useState<{ temas: string[]; programas: string[]; territorios: string[] }>({
    temas: [],
    programas: [],
    territorios: [],
  });

  async function refresh() {
    setNoticias(await noticiasRepoAsync.list());
  }

  useEffect(() => {
    refresh();
    Promise.all([temasDisponiveis(), programasDisponiveis(), territoriosDisponiveis()])
      .then(([temas, programas, territorios]) => setSugestoes({ temas, programas, territorios }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = noticias
    .filter((n) => {
      if (
        search &&
        !`${n.titulo} ${n.resumo} ${n.temas.join(" ")} ${n.programas.join(" ")}`.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (fonteFiltro && n.fonte !== fonteFiltro) return false;
      if (tipoFiltro && n.tipo !== tipoFiltro) return false;
      return true;
    })
    .sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao));

  const { page, setPage, totalPages, paginated } = usePagination(filtered, [search, fonteFiltro, tipoFiltro]);
  const lead = page === 1 ? paginated[0] : undefined;
  const resto = page === 1 ? paginated.slice(1) : paginated;

  function openCreate() {
    setEditing(null);
    setFormData(emptyForm());
    setFormOpen(true);
  }

  function openEdit(n: Noticia) {
    setEditing(n);
    setFormData({ ...n });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await noticiasRepoAsync.update(editing.id, formData);
        toast("Alterações guardadas.");
        registarAtividade("editar", "Notícias & Regulamentação", formData.titulo);
      } else {
        await noticiasRepoAsync.create({ id: newId(), ...formData });
        toast("Notícia criada.");
        registarAtividade("criar", "Notícias & Regulamentação", formData.titulo);
      }
      await refresh();
      closeForm();
    } catch (err) {
      console.error(err);
      toast("Erro ao guardar. Tenta novamente.", "error");
    }
  }

  async function handleDelete(n: Noticia) {
    const ok = await confirmDialog(`Remover "${n.titulo}"? Esta ação não pode ser desfeita.`, "Remover");
    if (!ok) return;
    try {
      await noticiasRepoAsync.remove(n.id);
      await refresh();
      registarAtividade("remover", "Notícias & Regulamentação", n.titulo);
      toast("Notícia removida.", "info");
    } catch (err) {
      console.error(err);
      toast("Erro ao remover. Tenta novamente.", "error");
    }
  }

  async function criarNotificacao(n: Noticia) {
    const notificacao: Notificacao = {
      id: newId(),
      titulo: n.titulo,
      tipo: tipoParaNotificacao[n.tipo],
      descricao: n.resumo,
      entidadeOrigem: n.fonte,
      entidadesAfetadas: n.programas.length > 0 ? n.programas.join(", ") : "Todas as entidades",
      dataPublicacao: new Date().toISOString().slice(0, 10),
      prazo: n.dataEntradaVigor,
      lida: false,
      processoId: "",
      criadoEm: new Date().toISOString(),
    };
    try {
      await notificacoesRepoAsync.create(notificacao);
      toast("Notificação interna criada a partir desta notícia.");
      navigate("/notificacoes");
    } catch (err) {
      console.error(err);
      toast("Erro ao criar notificação. Tenta novamente.", "error");
    }
  }

  async function handleImagemFile(file: File | undefined) {
    if (!file) return;
    setImagemProcessando(true);
    try {
      const dataUrl = await ficheiroParaImagemComprimida(file);
      setFormData((prev) => ({ ...prev, imagem: dataUrl }));
    } catch {
      toast("Não foi possível carregar esta imagem.", "error");
    } finally {
      setImagemProcessando(false);
    }
  }

  async function handlePreVisualizar() {
    const url = formData.referencia.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast("Cola primeiro um URL (http:// ou https://) no campo de referência.", "error");
      return;
    }
    setPreVisualizando(true);
    try {
      const preview = await obterPreVisualizacao(url);
      setFormData((prev) => ({
        ...prev,
        titulo: preview.titulo || prev.titulo,
        resumo: preview.resumo || prev.resumo,
        imagem: preview.imagem || prev.imagem,
      }));
      toast("Pré-visualização aplicada. Revê os campos antes de guardar.");
    } catch {
      toast("Não foi possível obter uma pré-visualização deste link.", "error");
    } finally {
      setPreVisualizando(false);
    }
  }

  const filters = [
    { label: "Fonte", value: fonteFiltro, onChange: setFonteFiltro, options: fontes.map((f) => ({ value: f, label: f })) },
    { label: "Tipo", value: tipoFiltro, onChange: setTipoFiltro, options: tipos.map((t) => ({ value: t, label: t })) },
  ];

  function renderMedia(n: Noticia, className: string) {
    return (
      <div className={className}>
        {n.imagem ? (
          <img src={n.imagem} alt="" />
        ) : (
          <span className="news-placeholder-icon">{tipoInfo[n.tipo].icon}</span>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            Notícias & Regulamentação
            <ModuleHelp
              titulo="Notícias & Regulamentação"
              oQueE="Resumos de alterações regulamentares, novas orientações e prazos relevantes vindos da Comissão Europeia, do governo ou das autoridades de gestão."
              paraQueServe="Para consultares rapidamente o essencial de uma mudança sem teres de ir à fonte original, e para converteres uma notícia importante numa notificação interna dirigida às entidades afetadas."
              comoUsar='Cola um URL no campo de referência para pré-preencher título, resumo e imagem automaticamente. Usa "→ Notificação" para propagar a novidade ao módulo de Notificações.'
            />
          </h1>
          <p className="page-description">
            Alterações a regulamentos europeus e nacionais, orientações novas e prazos relevantes, resumidos
            para consulta rápida sem ir à fonte original.
          </p>
        </div>
        {podeEditar ? (
          <button className="btn btn-primary" onClick={openCreate}>
            + Novo registo
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
        resultCount={filtered.length}
        filters={filters}
      />

      {filtered.length === 0 ? (
        <EmptyState
          message={
            noticias.length === 0
              ? "Sem notícias ainda."
              : "Nenhuma notícia corresponde à pesquisa ou aos filtros aplicados."
          }
        />
      ) : (
        <>
          {lead && (
            <article className="news-lead">
              {renderMedia(lead, "news-lead-media")}
              <div className="news-lead-content">
                <div className="news-lead-meta">
                  <span className={`badge ${tipoInfo[lead.tipo].badgeClass}`}>{lead.tipo}</span>
                  {isNovo(lead.criadoEm, lastSeen) && <span className="badge-novo">Novo</span>}
                  <span className="news-source">{lead.fonte}</span>
                  <span className="news-dot">·</span>
                  <span>{lead.dataPublicacao}</span>
                </div>
                <h2 className="news-headline">{lead.titulo}</h2>
                <p className="news-dek">{lead.resumo}</p>
                {lead.processosAfetados && (
                  <p className="field-hint">📎 Afeta: {lead.processosAfetados}</p>
                )}
                {lead.temas.length > 0 && (
                  <div className="news-tags">
                    {lead.temas.map((t) => (
                      <span key={t} className="news-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="news-lead-footer">
                  {lead.dataEntradaVigor && <UrgencyBadge prazo={lead.dataEntradaVigor} kind="vigor" />}
                  {podeEditar && (
                    <div className="news-actions">
                      <button className="btn btn-ghost" onClick={() => criarNotificacao(lead)}>
                        → Notificação
                      </button>
                      <button className="btn btn-ghost" onClick={() => openEdit(lead)}>
                        ✏️ Editar
                      </button>
                      <button className="btn btn-ghost btn-danger" onClick={() => handleDelete(lead)}>
                        🗑️ Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          )}

          {resto.length > 0 && (
            <div className="news-grid">
              {resto.map((n) => (
                <article key={n.id} className="news-card">
                  {renderMedia(n, "news-card-media")}
                  <div className="news-card-body">
                    <div className="news-lead-meta">
                      <span className={`badge ${tipoInfo[n.tipo].badgeClass}`}>{n.tipo}</span>
                      {isNovo(n.criadoEm, lastSeen) && <span className="badge-novo">Novo</span>}
                    </div>
                    <h3 className="news-card-headline">{n.titulo}</h3>
                    <p className="news-card-dek">{n.resumo}</p>
                    <div className="news-card-footer">
                      <span className="news-card-meta">
                        {n.fonte} · {n.dataPublicacao}
                      </span>
                      {n.dataEntradaVigor && <UrgencyBadge prazo={n.dataEntradaVigor} kind="vigor" />}
                    </div>
                    {podeEditar && (
                      <div className="news-actions">
                        <button className="btn btn-ghost" onClick={() => criarNotificacao(n)}>
                          → Notificação
                        </button>
                        <button className="btn btn-ghost" onClick={() => openEdit(n)}>
                          ✏️ Editar
                        </button>
                        <button className="btn btn-ghost btn-danger" onClick={() => handleDelete(n)}>
                          🗑️ Remover
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {formOpen && (
        <Modal title={editing ? "Editar notícia" : "Nova notícia"} onClose={closeForm}>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-field form-field-full">
              <label>
                Título<span className="required">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.titulo}
                onChange={(e) => setFormData((p) => ({ ...p, titulo: e.target.value }))}
              />
            </div>

            <div className="form-field form-field-full">
              <label>Imagem (opcional)</label>
              <div className="image-upload">
                {formData.imagem && (
                  <div className="image-preview">
                    <img src={formData.imagem} alt="" />
                    <button type="button" className="btn btn-ghost btn-danger" onClick={() => setFormData((p) => ({ ...p, imagem: "" }))}>
                      Remover imagem
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagemFile(e.target.files?.[0])}
                  disabled={imagemProcessando}
                />
                {imagemProcessando && <span className="feed-item-meta">A processar imagem...</span>}
                <input
                  type="text"
                  placeholder="ou colar o URL de uma imagem"
                  value={formData.imagem.startsWith("data:") ? "" : formData.imagem}
                  onChange={(e) => setFormData((p) => ({ ...p, imagem: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Fonte</label>
              <select value={formData.fonte} onChange={(e) => setFormData((p) => ({ ...p, fonte: e.target.value as Noticia["fonte"] }))}>
                {fontes.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Tipo</label>
              <select value={formData.tipo} onChange={(e) => setFormData((p) => ({ ...p, tipo: e.target.value as Noticia["tipo"] }))}>
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field form-field-full">
              <label>Resumo (versão reduzida)</label>
              <textarea
                required
                rows={3}
                value={formData.resumo}
                onChange={(e) => setFormData((p) => ({ ...p, resumo: e.target.value }))}
              />
            </div>

            <div className="form-field form-field-full">
              <label>Temas</label>
              <TagInput
                value={formData.temas}
                onChange={(next) => setFormData((p) => ({ ...p, temas: next }))}
                suggestions={sugestoes.temas}
              />
            </div>
            <div className="form-field form-field-full">
              <label>Programas relacionados</label>
              <TagInput
                value={formData.programas}
                onChange={(next) => setFormData((p) => ({ ...p, programas: next }))}
                suggestions={sugestoes.programas}
              />
            </div>
            <div className="form-field form-field-full">
              <label>Territórios relacionados</label>
              <TagInput
                value={formData.territorios}
                onChange={(next) => setFormData((p) => ({ ...p, territorios: next }))}
                suggestions={sugestoes.territorios}
              />
            </div>

            <div className="form-field">
              <label>Data de publicação</label>
              <input
                type="date"
                required
                value={formData.dataPublicacao}
                onChange={(e) => setFormData((p) => ({ ...p, dataPublicacao: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Data de entrada em vigor</label>
              <input
                type="date"
                value={formData.dataEntradaVigor}
                onChange={(e) => setFormData((p) => ({ ...p, dataEntradaVigor: e.target.value }))}
              />
            </div>
            <div className="form-field form-field-full">
              <label>Fonte / referência documental (cola aqui um URL para pré-preencher)</label>
              <div className="link-preview-row">
                <input
                  type="text"
                  placeholder="https://... ou uma citação de texto"
                  value={formData.referencia}
                  onChange={(e) => setFormData((p) => ({ ...p, referencia: e.target.value }))}
                />
                <button type="button" className="btn btn-ghost" onClick={handlePreVisualizar} disabled={preVisualizando}>
                  {preVisualizando ? "A obter..." : "🔗 Pré-preencher"}
                </button>
              </div>
              <p className="field-hint">
                Se colares um URL, isto vai buscar título, resumo e imagem através de um serviço externo
                (microlink.io). O URL é enviado a esse serviço nesse momento. Revê sempre antes de guardar.
              </p>
            </div>
            <div className="form-field form-field-full">
              <label>Processos/avisos concretos afetados por esta alteração (opcional)</label>
              <input
                type="text"
                placeholder="Ex.: Candidatura #2026-0451, Aviso 12/2026..."
                value={formData.processosAfetados}
                onChange={(e) => setFormData((p) => ({ ...p, processosAfetados: e.target.value }))}
              />
              <span className="field-hint">
                Liga a mudança regulamentar ao que concretamente afeta, em vez de só ao tema geral.
              </span>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={closeForm}>
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
