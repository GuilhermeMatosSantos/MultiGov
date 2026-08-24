import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  notificacoesRepoAsync,
  faqRepoAsync,
  registoInformalRepoAsync,
  indicadoresRepoAsync,
  decisoesRepoAsync,
  processosRepoAsync,
  projetosRepoAsync,
  noticiasRepoAsync,
} from "../data/asyncRepos";
import { listarInterlocutores } from "../lib/interlocutoresRepository";
import { listarAvisos } from "../lib/avisosRepository";
import { listarTopicos } from "../lib/topicosRepository";

interface Result {
  key: string;
  module: string;
  icon: string;
  label: string;
  meta: string;
  to: string;
  selectId?: string;
}

async function buildIndex(): Promise<Result[]> {
  const results: Result[] = [];

  const [processos, interlocutores, notificacoes, faq, avisos, registos, indicadores, decisoes, topicos, noticias, projetos] =
    await Promise.all([
      processosRepoAsync.list(),
      listarInterlocutores(),
      notificacoesRepoAsync.list(),
      faqRepoAsync.list(),
      listarAvisos(),
      registoInformalRepoAsync.list(),
      indicadoresRepoAsync.list(),
      decisoesRepoAsync.list(),
      listarTopicos(),
      noticiasRepoAsync.list(),
      projetosRepoAsync.list(),
    ]);

  processos.forEach((p) =>
    results.push({
      key: `processo-${p.id}`,
      module: "Processos",
      icon: "📁",
      label: p.titulo,
      meta: `${p.entidadeResponsavel} · ${p.programa}`,
      to: "/processos",
      selectId: p.id,
    })
  );
  interlocutores.forEach((i) =>
    results.push({
      key: `interlocutor-${i.id}`,
      module: "Interlocutores",
      icon: "🧭",
      label: i.nome,
      meta: `${i.entidade} · ${i.cargo}`,
      to: `/interlocutores?q=${encodeURIComponent(i.nome)}`,
    })
  );
  notificacoes.forEach((n) =>
    results.push({
      key: `notificacao-${n.id}`,
      module: "Notificações",
      icon: "🔔",
      label: n.titulo,
      meta: `${n.entidadeOrigem} · ${n.dataPublicacao}`,
      to: `/notificacoes?q=${encodeURIComponent(n.titulo)}`,
    })
  );
  faq.forEach((f) =>
    results.push({
      key: `faq-${f.id}`,
      module: "Base de Conhecimento",
      icon: "📚",
      label: f.pergunta,
      meta: f.categoria,
      to: `/base-conhecimento?q=${encodeURIComponent(f.pergunta)}`,
    })
  );
  avisos.forEach((a) =>
    results.push({
      key: `aviso-${a.id}`,
      module: "Coordenação de Avisos",
      icon: "🗓️",
      label: a.titulo,
      meta: a.programa,
      to: "/coordenacao-avisos",
      selectId: a.id,
    })
  );
  registos.forEach((r) =>
    results.push({
      key: `registo-${r.id}`,
      module: "Registo do Informal",
      icon: "📝",
      label: r.resumo || r.processoAssociado || "Registo informal",
      meta: `${r.entidade} · ${r.data}`,
      to: `/registo-informal?q=${encodeURIComponent(r.processoAssociado || r.entidade)}`,
    })
  );
  indicadores.forEach((i) =>
    results.push({
      key: `indicador-${i.id}`,
      module: "Monitorização Territorial",
      icon: "📊",
      label: i.indicador,
      meta: i.territorio,
      to: `/monitorizacao-territorial?q=${encodeURIComponent(i.territorio)}`,
    })
  );
  decisoes.forEach((d) =>
    results.push({
      key: `decisao-${d.id}`,
      module: "Transparência",
      icon: "🔎",
      label: d.titulo,
      meta: d.entidade,
      to: `/transparencia?q=${encodeURIComponent(d.titulo)}`,
    })
  );
  topicos.forEach((t) =>
    results.push({
      key: `topico-${t.id}`,
      module: "Canal Horizontal",
      icon: "💬",
      label: t.titulo,
      meta: t.entidade,
      to: "/canal-horizontal",
      selectId: t.id,
    })
  );
  noticias.forEach((n) =>
    results.push({
      key: `noticia-${n.id}`,
      module: "Notícias & Regulamentação",
      icon: "📰",
      label: n.titulo,
      meta: `${n.fonte} · ${n.dataPublicacao}`,
      to: `/noticias?q=${encodeURIComponent(n.titulo)}`,
    })
  );
  projetos.forEach((p) =>
    results.push({
      key: `projeto-${p.id}`,
      module: "Memória de Projetos",
      icon: "🗂️",
      label: p.titulo,
      meta: p.territorio,
      to: `/memoria-projetos?q=${encodeURIComponent(p.titulo)}`,
    })
  );

  return results;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<Result[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      buildIndex()
        .then(setIndex)
        .catch((err) => console.error("Erro ao construir o índice de pesquisa:", err));
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.filter((r) => r.label.toLowerCase().includes(q) || r.meta.toLowerCase().includes(q)).slice(0, 20);
  }, [index, query]);

  function select(r: Result) {
    onClose();
    navigate(r.to, r.selectId ? { state: { selectId: r.selectId } } : undefined);
  }

  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Pesquisa global" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="palette-input"
          placeholder="Pesquisar em toda a aplicação..."
          aria-label="Pesquisar em toda a aplicação"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="palette-results">
          {query.trim() === "" && (
            <p className="palette-hint">Escreve para pesquisar em todos os módulos: processos, interlocutores, notificações, avisos e mais.</p>
          )}
          {query.trim() !== "" && results.length === 0 && <p className="palette-hint">Sem resultados para "{query}".</p>}
          {results.map((r) => (
            <button key={r.key} className="palette-result" onClick={() => select(r)}>
              <span className="palette-result-icon">{r.icon}</span>
              <div className="palette-result-text">
                <div className="palette-result-label">{r.label}</div>
                <div className="palette-result-meta">
                  {r.module} · {r.meta}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
