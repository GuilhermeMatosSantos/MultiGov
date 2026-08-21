import { Link } from "react-router-dom";
import {
  interlocutoresRepo,
  notificacoesRepo,
  faqRepo,
  avisosRepo,
  registoInformalRepo,
  indicadoresRepo,
  decisoesRepo,
  topicosRepo,
  processosRepo,
  projetosRepo,
  noticiasRepo,
} from "../data/repos";
import { useIdentidade } from "../lib/session";
import {
  useInteresses,
  notificacaoRelevantePorInteresse,
  avisoRelevante,
  noticiaRelevante,
  faqRelevante,
  projetoRelevante,
  totalInteresses,
  algumCorresponde,
} from "../lib/interesses";
import { diasAte, urgenciaPrazo, rotuloRelativo } from "../lib/dates";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { getLastSeen, isNovo } from "../lib/lastSeen";
import { useFavoritos } from "../lib/favoritos";

interface TimelineEntry {
  id: string;
  data: string;
  titulo: string;
  meta: string;
  to: string;
  dotClass: string;
  novo: boolean;
}

interface Destaque {
  id: string;
  icon: string;
  texto: string;
  to: string;
  prioridade: number;
}

const DIAS_SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatarDataLonga(d: Date): string {
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function Dashboard() {
  const [identidade] = useIdentidade();
  const [interesses] = useInteresses();
  const { favoritos } = useFavoritos();
  const interlocutores = interlocutoresRepo.list();
  const notificacoes = notificacoesRepo.list();
  const faq = faqRepo.list();
  const avisos = avisosRepo.list();
  const registos = registoInformalRepo.list();
  const indicadores = indicadoresRepo.list();
  const decisoes = decisoesRepo.list();
  const topicos = topicosRepo.list();
  const processos = processosRepo.list();
  const projetos = projetosRepo.list();
  const noticias = noticiasRepo.list();

  const notificacoesPorLer = notificacoes.filter((n) => !n.lida);
  const avisosAtivos = avisos.filter((a) => a.estado === "Aberto" || a.estado === "Em preparação");
  const processosAtivos = processos.filter((p) => p.estado !== "Concluído" && p.estado !== "Indeferido");

  const modulos = [
    { label: "Processos", value: processosAtivos.length, to: "/processos", icon: "📁" },
    { label: "Interlocutores", value: interlocutores.length, to: "/interlocutores", icon: "🧭" },
    { label: "Notificações", value: notificacoesPorLer.length, to: "/notificacoes", icon: "🔔" },
    { label: "Notícias & Regulamentação", value: noticias.length, to: "/noticias", icon: "📰" },
    { label: "Base de Conhecimento", value: faq.length, to: "/base-conhecimento", icon: "📚" },
    { label: "Coordenação de Avisos", value: avisosAtivos.length, to: "/coordenacao-avisos", icon: "🗓️" },
    { label: "Canal Horizontal", value: topicos.length, to: "/canal-horizontal", icon: "💬" },
    { label: "Registo do Informal", value: registos.length, to: "/registo-informal", icon: "📝" },
    { label: "Monitorização Territorial", value: indicadores.length, to: "/monitorizacao-territorial", icon: "📊" },
    { label: "Memória de Projetos", value: projetos.length, to: "/memoria-projetos", icon: "🗂️" },
    { label: "Transparência", value: decisoes.length, to: "/transparencia", icon: "🔎" },
  ];

  const temPersonalizacao = Boolean(identidade.entidade) || totalInteresses(interesses) > 0;
  const lastSeenNotificacoes = getLastSeen("notificacoes");
  const lastSeenNoticias = getLastSeen("noticias");

  function entidadeCorresponde(alvo: string): boolean {
    if (!identidade.entidade) return false;
    const a = alvo.toLowerCase();
    return a.includes(identidade.entidade.toLowerCase()) || a.includes("todas");
  }

  const paraTi = [
    ...notificacoes
      .filter((n) => entidadeCorresponde(n.entidadesAfetadas) || notificacaoRelevantePorInteresse(n, interesses))
      .map((n) => ({ id: `n-${n.id}`, titulo: n.titulo, meta: n.entidadeOrigem, to: "/notificacoes", data: n.dataPublicacao, criadoEm: n.criadoEm })),
    ...avisos
      .filter((a) => entidadeCorresponde(a.entidadesEnvolvidas) || avisoRelevante(a, interesses))
      .map((a) => ({ id: `a-${a.id}`, titulo: a.titulo, meta: a.programa, to: "/coordenacao-avisos", data: a.dataPrevistaAbertura, criadoEm: "" })),
    ...noticias
      .filter((n) => noticiaRelevante(n, interesses))
      .map((n) => ({ id: `nt-${n.id}`, titulo: n.titulo, meta: n.fonte, to: "/noticias", data: n.dataPublicacao, criadoEm: n.criadoEm })),
    ...projetos
      .filter((p) => p.boaPratica && projetoRelevante(p, interesses))
      .map((p) => ({ id: `pj-${p.id}`, titulo: p.titulo, meta: `${p.territorio} · ${p.periodo}`, to: "/memoria-projetos", data: p.periodo, criadoEm: "" })),
  ].sort((x, y) => y.data.localeCompare(x.data));

  const prazosAVencer = [
    ...notificacoes.filter((n) => n.prazo).map((n) => ({ titulo: n.titulo, prazo: n.prazo, meta: n.entidadeOrigem, to: "/notificacoes" })),
    ...avisos
      .filter((a) => a.dataPrevistaFecho && a.estado !== "Fechado")
      .map((a) => ({ titulo: a.titulo, prazo: a.dataPrevistaFecho, meta: a.programa, to: "/coordenacao-avisos" })),
    ...noticias.filter((n) => n.dataEntradaVigor).map((n) => ({ titulo: n.titulo, prazo: n.dataEntradaVigor, meta: n.fonte, to: "/noticias" })),
  ]
    .filter((p) => {
      const dias = diasAte(p.prazo);
      return dias !== null && dias <= 14;
    })
    .sort((a, b) => (diasAte(a.prazo) ?? 0) - (diasAte(b.prazo) ?? 0))
    .slice(0, 5);

  // Resumo do dia: destaques em frase, não números soltos — o que precisa
  // mesmo de atenção hoje, cruzado com a entidade e os interesses definidos.
  const destaques: Destaque[] = [];

  for (const p of prazosAVencer) {
    const dias = diasAte(p.prazo);
    if (dias === null) continue;
    if (dias < 0) {
      destaques.push({
        id: `d-venc-${p.titulo}`,
        icon: "🔴",
        texto: `${p.titulo} venceu há ${Math.abs(dias)} dia(s) — ainda por resolver`,
        to: p.to,
        prioridade: 0,
      });
    } else if (dias === 0) {
      destaques.push({ id: `d-hoje-${p.titulo}`, icon: "⏰", texto: `${p.titulo} vence hoje`, to: p.to, prioridade: 1 });
    }
  }

  if (identidade.entidade) {
    for (const a of avisos) {
      const pendente = (a.confirmacoes ?? []).find(
        (c) => c.entidade.toLowerCase().includes(identidade.entidade.toLowerCase()) && !c.confirmado
      );
      if (pendente) {
        destaques.push({
          id: `d-conf-${a.id}`,
          icon: "🗓️",
          texto: `${a.titulo} aguarda a tua confirmação de alinhamento`,
          to: "/coordenacao-avisos",
          prioridade: 2,
        });
      }
    }
  }

  // Interlocutores substituídos há pouco tempo — o histórico existe
  // precisamente para dar visibilidade a isto, não só para consulta.
  for (const i of interlocutores) {
    const dias = diasAte(i.atualizadoEm);
    if (dias === null || dias < -3 || dias > 0) continue;
    if ((i.historico?.length ?? 0) === 0) continue;
    const anterior = [...i.historico].sort((a, b) => b.ate.localeCompare(a.ate))[0];
    destaques.push({
      id: `d-interloc-${i.id}`,
      icon: "🧭",
      texto: `Novo interlocutor em ${i.entidade}: ${i.nome} substituiu ${anterior.nome}`,
      to: "/interlocutores",
      prioridade: 3,
    });
  }

  // Canal horizontal: respostas recentes em tópicos que tocam a tua
  // entidade ou os teus temas de interesse.
  for (const t of topicos) {
    const mensagens = t.mensagens ?? [];
    if (mensagens.length === 0) continue;
    const ultima = [...mensagens].sort((a, b) => b.data.localeCompare(a.data))[0];
    const dias = diasAte(ultima.data);
    if (dias === null || dias < -3 || dias > 0) continue;
    const relevante = entidadeCorresponde(t.entidade) || algumCorresponde(t.categoria, interesses.temas);
    if (!relevante) continue;
    destaques.push({
      id: `d-canal-${t.id}`,
      icon: "💬",
      texto: `Nova resposta de ${ultima.entidade} em "${t.titulo}"`,
      to: "/canal-horizontal",
      prioridade: 4,
    });
  }

  // Base de conhecimento: esclarecimentos novos sobre os teus temas.
  for (const f of faq) {
    const dias = diasAte(f.atualizadoEm);
    if (dias === null || dias < -3 || dias > 0) continue;
    if (!faqRelevante(f, interesses)) continue;
    destaques.push({
      id: `d-faq-${f.id}`,
      icon: "📚",
      texto: `Novo esclarecimento sobre ${f.categoria}: ${f.pergunta}`,
      to: "/base-conhecimento",
      prioridade: 5,
    });
  }

  // Transparência: decisões recentes que tocam a tua entidade ou programas.
  for (const d of decisoes) {
    const dias = diasAte(d.data);
    if (dias === null || dias < -3 || dias > 0) continue;
    if (!entidadeCorresponde(d.entidade) && !algumCorresponde(d.entidade, interesses.programas)) continue;
    destaques.push({ id: `d-decisao-${d.id}`, icon: "🔎", texto: `Decisão publicada: ${d.titulo}`, to: "/transparencia", prioridade: 6 });
  }

  // Processos parados — nem tudo o que precisa de atenção é recente;
  // isto sinaliza o oposto, o que está esquecido.
  for (const p of processos) {
    if (p.estado !== "Submetido" && p.estado !== "Em análise") continue;
    const dias = diasAte(p.dataAbertura);
    if (dias === null || dias > -14) continue;
    if (!entidadeCorresponde(p.entidadeResponsavel) && !algumCorresponde(p.programa, interesses.programas)) continue;
    destaques.push({
      id: `d-parado-${p.id}`,
      icon: "⏳",
      texto: `${p.titulo} está "${p.estado}" há ${Math.abs(dias)} dias sem avançar`,
      to: "/processos",
      prioridade: 7,
    });
  }

  if (temPersonalizacao) {
    for (const item of paraTi) {
      const lastSeenModulo = item.to === "/notificacoes" ? lastSeenNotificacoes : item.to === "/noticias" ? lastSeenNoticias : "";
      if (isNovo(item.criadoEm, lastSeenModulo)) {
        destaques.push({ id: `d-novo-${item.id}`, icon: "🆕", texto: `Novo: ${item.titulo}`, to: item.to, prioridade: 8 });
      }
    }
  }

  destaques.sort((a, b) => a.prioridade - b.prioridade);
  const destaquesTop = destaques.slice(0, 7);
  const hoje = new Date();

  // Fluxo cronológico único: em vez de um painel por módulo, tudo o que foi
  // publicado/registado recentemente junta-se numa só lista, agrupada por dia.
  const timelineItems: TimelineEntry[] = [
    ...notificacoes.map((n) => ({
      id: `tn-${n.id}`,
      data: n.dataPublicacao,
      titulo: n.titulo,
      meta: `Notificação · ${n.entidadeOrigem}`,
      to: "/notificacoes",
      dotClass: "timeline-feed-dot-notificacao",
      novo: isNovo(n.criadoEm, lastSeenNotificacoes),
    })),
    ...noticias.map((n) => ({
      id: `tnt-${n.id}`,
      data: n.dataPublicacao,
      titulo: n.titulo,
      meta: `Notícia · ${n.fonte}`,
      to: "/noticias",
      dotClass: "timeline-feed-dot-noticia",
      novo: isNovo(n.criadoEm, lastSeenNoticias),
    })),
    ...decisoes.map((d) => ({
      id: `td-${d.id}`,
      data: d.data,
      titulo: d.titulo,
      meta: `Decisão · ${d.entidade}`,
      to: "/transparencia",
      dotClass: "timeline-feed-dot-decisao",
      novo: false,
    })),
    ...registos.map((r) => ({
      id: `tr-${r.id}`,
      data: r.data,
      titulo: r.resumo || r.processoAssociado || "Registo informal",
      meta: `${r.tipo} · ${r.entidade}`,
      to: "/registo-informal",
      dotClass: "timeline-feed-dot-registo",
      novo: false,
    })),
    ...faq.map((f) => ({
      id: `tf-${f.id}`,
      data: f.atualizadoEm,
      titulo: f.pergunta,
      meta: `Base de Conhecimento · ${f.categoria}`,
      to: "/base-conhecimento",
      dotClass: "timeline-feed-dot-faq",
      novo: false,
    })),
  ].sort((a, b) => b.data.localeCompare(a.data));

  const timelineGroups: { label: string; items: TimelineEntry[] }[] = [];
  for (const item of timelineItems) {
    const label = rotuloRelativo(item.data);
    const grupoAtual = timelineGroups[timelineGroups.length - 1];
    if (grupoAtual && grupoAtual.label === label) {
      grupoAtual.items.push(item);
    } else {
      timelineGroups.push({ label, items: [item] });
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Painel geral</h1>
        </div>
      </div>
      <section className="daily-brief">
        <div className="daily-brief-header">
          <span className="daily-brief-eyebrow">Resumo do dia</span>
          <span className="daily-brief-date">{formatarDataLonga(hoje)}</span>
        </div>
        {destaquesTop.length === 0 ? (
          <p className="daily-brief-empty">
            {temPersonalizacao
              ? "Sem destaques para a tua entidade ou interesses hoje — tudo em dia."
              : "Sem urgências gerais hoje."}
          </p>
        ) : (
          <ul className="daily-brief-list">
            {destaquesTop.map((d) => (
              <li key={d.id}>
                <Link to={d.to} className="daily-brief-item">
                  <span className="daily-brief-icon">{d.icon}</span>
                  <span>{d.texto}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {!temPersonalizacao && (
          <p className="daily-brief-hint">
            Define a tua entidade e áreas de interesse na barra do topo para um resumo dirigido a ti.
          </p>
        )}
      </section>

      <div className="dashboard-grid">
        <aside className="dashboard-rail">
          <div>
            <h2 className="rail-heading">Prazos a vencer</h2>
            {prazosAVencer.length === 0 ? (
              <p className="rail-empty">Nada a vencer nos próximos 14 dias.</p>
            ) : (
              <div className="rail-list">
                {prazosAVencer.map((p, idx) => (
                  <Link key={idx} to={p.to} className={`rail-item rail-item-${urgenciaPrazo(p.prazo) ?? "ok"}`}>
                    <div className="rail-item-title">{p.titulo}</div>
                    <div className="rail-item-meta">
                      {p.meta} · <UrgencyBadge prazo={p.prazo} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="rail-heading">Para ti</h2>
            {!temPersonalizacao ? (
              <p className="rail-empty">
                Define a tua entidade ou áreas de interesse na barra do topo para veres aqui o que te diz respeito.
              </p>
            ) : paraTi.length === 0 ? (
              <p className="rail-empty">Nada corresponde ao momento.</p>
            ) : (
              <div className="rail-list">
                {paraTi.slice(0, 5).map((item) => (
                  <Link key={item.id} to={item.to} className="rail-item rail-item-neutro">
                    <div className="rail-item-title">
                      {isNovo(item.criadoEm, item.to === "/notificacoes" ? lastSeenNotificacoes : item.to === "/noticias" ? lastSeenNoticias : "") && (
                        <span className="badge-novo">Novo</span>
                      )}
                      {item.titulo}
                    </div>
                    <div className="rail-item-meta">{item.meta}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {favoritos.length > 0 && (
            <div>
              <h2 className="rail-heading">Seguidos</h2>
              <div className="rail-list">
                {favoritos.slice(0, 6).map((f) => (
                  <Link key={f.key} to={f.to} className="rail-item rail-item-neutro">
                    <div className="rail-item-title">★ {f.label}</div>
                    <div className="rail-item-meta">{f.modulo}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="rail-heading">Módulos</h2>
            <ul className="module-index">
              {modulos.map((m) => (
                <li key={m.label}>
                  <Link to={m.to}>
                    <span className="module-index-icon">{m.icon}</span>
                    <span className="module-index-label">{m.label}</span>
                    <span className="module-index-count">{m.value}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="dashboard-timeline">
          {timelineGroups.length === 0 ? (
            <p className="page-description" style={{ padding: "16px 4px" }}>
              Ainda sem atividade registada.
            </p>
          ) : (
            timelineGroups.map((group) => (
              <div key={group.label} className="timeline-day-group">
                <div className="timeline-day-label">{group.label}</div>
                {group.items.map((item) => (
                  <Link key={item.id} to={item.to} className="timeline-feed-row">
                    <span className={`timeline-feed-dot ${item.dotClass}`} />
                    <div>
                      <div className="timeline-feed-title">
                        {item.novo && <span className="badge-novo">Novo</span>}
                        {item.titulo}
                      </div>
                      <div className="timeline-feed-meta">
                        {item.meta} · {item.data}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
